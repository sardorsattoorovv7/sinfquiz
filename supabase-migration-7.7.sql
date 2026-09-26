-- SinfQuiz 7.7: original Multilevel mashqlar, admin seed va local audio.
-- Existing database: RUN after supabase-migration-7.4.sql and 7.6.
begin;
create or replace function public.sq_cefr_validate(p jsonb) returns void
language plpgsql set search_path=public as $$
declare s jsonb; part jsonb; q jsonb; a jsonb; si int:=0; pi int; ids text[]:='{}';
 expected jsonb:='[[8,6,4,5,6,6],[6,8,6,9,6],[3],[3,3,1,1]]'; n int;
begin
 if length(p::text)>2000000 or jsonb_typeof(p->'sections') is distinct from 'array' or jsonb_array_length(p->'sections')<>4 then raise exception '4 ta CEFR bo‘limi kerak.'; end if;
 if coalesce(length(trim(p->>'title')),0) not between 1 and 160 then raise exception 'Variant nomi 1–160 belgi bo‘lsin.'; end if;
 if p->>'rightsConfirmed' is distinct from 'true' then raise exception 'Materiallardan foydalanish huquqini tasdiqlang.'; end if;
 for s in select value from jsonb_array_elements(p->'sections') loop
  if s->>'skill' is distinct from (array['listening','reading','writing','speaking'])[si+1] or coalesce(s->>'minutes','') !~ '^[0-9]+$' then raise exception 'Bo‘lim turi yoki vaqti noto‘g‘ri.'; end if;
  if (s->>'minutes')::int not between 1 and 180 or jsonb_typeof(s->'parts') is distinct from 'array' then raise exception 'Bo‘lim sozlamasi noto‘g‘ri.'; end if;
  if jsonb_array_length(s->'parts') not between 1 and 20 then raise exception 'Qismlar soni noto‘g‘ri.'; end if;
  if p->>'format'='multilevel' and jsonb_array_length(s->'parts')<>jsonb_array_length(expected->si) then raise exception 'Multilevel qismlari sonini tekshiring.'; end if;
  pi:=0;
  for part in select value from jsonb_array_elements(s->'parts') loop
   if coalesce(length(trim(part->>'source')),0)=0 then raise exception 'Har qismda muallif yoki manba kerak.'; end if;
   if si=0 and (coalesce(part->>'audioUrl','') !~ '^https://[^/@[:space:]]+([/:?#]|$)' and coalesce(part->>'audioUrl','') !~ '^/cefr-audio/mock-([1-9]|10)-part-[1-6]\.mp3$') then raise exception 'Listening uchun HTTPS audio kerak.'; end if;
   if si=1 and coalesce(length(trim(part->>'text')),0)=0 then raise exception 'Reading matni kerak.'; end if;
   if coalesce(part->>'imageUrl','')<>'' and (part->>'imageUrl') !~ '^https://[^/@[:space:]]+([/:?#]|$)' then raise exception 'HTTPS rasm manzili kerak.'; end if;
   if jsonb_typeof(part->'questions') is distinct from 'array' then raise exception 'Savollar ro‘yxati kerak.'; end if;
   n:=jsonb_array_length(part->'questions');
   if n not between 1 and 100 or (p->>'format'='multilevel' and n<>(expected->si->>pi)::int) then raise exception 'Qismdagi savollar soni noto‘g‘ri.'; end if;
   for q in select value from jsonb_array_elements(part->'questions') loop
    if coalesce(q->>'id','') !~ '^[a-zA-Z0-9_-]{1,100}$' or q->>'id'=any(ids) then raise exception 'Savol ID bo‘sh yoki takrorlangan.'; end if;
    ids:=array_append(ids,q->>'id');
    if coalesce(length(trim(q->>'text')),0) not between 1 and 20000 then raise exception 'Savol matnini tekshiring.'; end if;
    if si<2 then
     if coalesce(q->>'type','') not in ('choice','text') or jsonb_typeof(q->'answers') is distinct from 'array' or coalesce(length(trim(q->>'explanation')),0)=0 then raise exception 'Javob kaliti va izoh kerak.'; end if;
     if jsonb_array_length(q->'answers') not between 1 and 20 then raise exception 'Kalitni tekshiring.'; end if;
     if q->>'type'='choice' then
      if jsonb_typeof(q->'options') is distinct from 'array' then raise exception 'Variantlar kerak.'; end if;
      if jsonb_array_length(q->'options') not between 2 and 12 or exists(select 1 from jsonb_array_elements_text(q->'options') v where trim(v)='') or (select count(distinct v) from jsonb_array_elements_text(q->'options') v)<>jsonb_array_length(q->'options') then raise exception 'Variantlar bo‘sh yoki takrorlangan.'; end if;
     end if;
     for a in select value from jsonb_array_elements(q->'answers') loop
      if jsonb_typeof(a)<>'string' or length(trim(a#>>'{}'))=0 or (q->>'type'='choice' and not (q->'options' @> jsonb_build_array(a))) then raise exception 'Javob kaliti noto‘g‘ri.'; end if;
     end loop;
    elsif q->>'type' is distinct from s->>'skill' then raise exception 'Topshiriq turi noto‘g‘ri.'; end if;
   end loop;
   pi:=pi+1;
  end loop;
  si:=si+1;
 end loop;
 if array_length(ids,1)>300 then raise exception 'Bir variantda 300 tagacha savol bo‘lsin.'; end if;
end $$;


create or replace function public.sq_cefr_admin(p_action text, p_id uuid default null, p_body jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=public as $$
declare t public.cefr_tests; a public.cefr_attempts; out_json jsonb;
begin
 if auth.uid() is null or not public.sq_is_admin() then raise exception 'Faqat administrator uchun.' using errcode='42501'; end if;
 if p_action='list' then select coalesce(jsonb_agg(to_jsonb(x) order by updated_at desc),'[]') into out_json from public.cefr_tests x; return out_json; end if;
 if p_action='results' then
  select coalesce(jsonb_agg(to_jsonb(x)),'[]') into out_json from (select attempt_row.id,attempt_row.test_id,attempt_row.uid,attempt_row.snapshot->>'title' title,attempt_row.started_at,attempt_row.finished_at,attempt_row.assessment,coalesce(d.data->>'name','O‘quvchi') student_name from public.cefr_attempts attempt_row left join public.documents d on d.collection='profiles' and d.id=attempt_row.uid::text where attempt_row.finished_at is not null order by attempt_row.finished_at desc limit 100) x;return out_json;
 end if;
 if p_action in ('attempt','review') then
  select * into a from public.cefr_attempts where id=p_id for update;
  if not found or a.finished_at is null then raise exception 'Topshirilgan javob topilmadi.'; end if;
  if p_action='review' then
   if coalesce(p_body->>'writing','') !~ '^[0-9]+$' or coalesce(p_body->>'speaking','') !~ '^[0-9]+$' then raise exception 'Baholar butun son bo‘lsin.'; end if;
   if (p_body->>'writing')::int not between 0 and 75 or (p_body->>'speaking')::int not between 0 and 75 or coalesce(length(trim(p_body->>'feedback')),0) not between 1 and 5000 then raise exception '0–75 oralig‘ida baho va izoh kiriting.'; end if;
   update public.cefr_attempts set assessment=jsonb_build_object('writing',(p_body->>'writing')::int,'speaking',(p_body->>'speaking')::int,'feedback',p_body->>'feedback'),reviewed_by=auth.uid(),reviewed_at=now() where id=p_id returning * into a;
  end if;
  return to_jsonb(a);
 end if;
 if p_action='save' then
  if length(p_body::text)>2000000 or jsonb_typeof(p_body->'payload'->'sections') is distinct from 'array' or jsonb_array_length(p_body->'payload'->'sections')<>4 then raise exception 'Variant tuzilmasi noto‘g‘ri.'; end if;
  if coalesce(length(trim(p_body->'payload'->>'title')),0) not between 1 and 160 then raise exception 'Variant nomini kiriting (160 belgigacha).'; end if;
  if p_id is null then insert into public.cefr_tests(payload,created_by) values(p_body->'payload',auth.uid()) returning * into t;
  else update public.cefr_tests set payload=p_body->'payload',status='draft',revision=revision+1,updated_at=now() where id=p_id and revision=(p_body->>'revision')::int returning * into t;
   if not found then raise exception 'Variant boshqa oynada o‘zgargan. Ro‘yxatni yangilang.'; end if;
  end if;return to_jsonb(t);
 end if;
 select * into t from public.cefr_tests where id=p_id for update;
 if not found then raise exception 'Variant topilmadi.'; end if;
 if p_action='publish' then perform public.sq_cefr_validate(t.payload); update public.cefr_tests set status='published',updated_at=now() where id=p_id returning * into t;
 elsif p_action='archive' then update public.cefr_tests set status='archived',updated_at=now() where id=p_id returning * into t;
 else raise exception 'Amal noto‘g‘ri.'; end if;
 return to_jsonb(t);
end $$;

create table if not exists public.cefr_builtin_bank(
  seed_key text primary key,
  payload jsonb not null
);
revoke all on public.cefr_builtin_bank from anon,authenticated;

insert into public.cefr_builtin_bank(seed_key,payload)
select item->>'seedKey',item-'seedKey'
from jsonb_array_elements($cefr_bank$[
  {
    "title": "Multilevel Mock 01 · Neighbourhood library",
    "description": "Original mashq varianti: neighbourhood library. 35 Listening, 35 Reading, 3 Writing va 8 Speaking topshirig‘i. Rasmiy test savollari emas.",
    "level": "B1–C1",
    "format": "multilevel",
    "rightsConfirmed": true,
    "seedKey": "sinfquiz-multilevel-1",
    "sections": [
      {
        "skill": "listening",
        "minutes": 45,
        "parts": [
          {
            "id": "listening-p1",
            "title": "Short announcements",
            "text": "Listen to eight short messages. Choose the best answer for each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-1-part-1.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-l1-1",
                "type": "choice",
                "text": "When does the meeting begin?",
                "options": [
                  "10:30",
                  "09:45",
                  "12:00"
                ],
                "answers": [
                  "10:30"
                ],
                "explanation": "The announcement says: The first message said 09:45, but the neighbourhood library meeting now starts at 10:30."
              },
              {
                "id": "m1-l1-2",
                "type": "choice",
                "text": "Where will people meet?",
                "options": [
                  "the town hall",
                  "the railway café",
                  "Riverside Library"
                ],
                "answers": [
                  "Riverside Library"
                ],
                "explanation": "The announcement says: We are meeting at Riverside Library. Please do not wait at the old entrance."
              },
              {
                "id": "m1-l1-3",
                "type": "choice",
                "text": "What should visitors bring?",
                "options": [
                  "a camera",
                  "a notebook",
                  "a printed ticket"
                ],
                "answers": [
                  "a notebook"
                ],
                "explanation": "The announcement says: Before you leave home, remember to bring a notebook. Other equipment is provided."
              },
              {
                "id": "m1-l1-4",
                "type": "choice",
                "text": "What is the last day to register?",
                "options": [
                  "Wednesday",
                  "the following weekend",
                  "the day after the event"
                ],
                "answers": [
                  "Wednesday"
                ],
                "explanation": "The announcement says: You can sign up until Wednesday. We cannot add names at the door."
              },
              {
                "id": "m1-l1-5",
                "type": "choice",
                "text": "How much is admission?",
                "options": [
                  "five pounds",
                  "ten pounds",
                  "free"
                ],
                "answers": [
                  "free"
                ],
                "explanation": "The announcement says: Admission is free. The amount covers the materials, and there is no extra charge."
              },
              {
                "id": "m1-l1-6",
                "type": "choice",
                "text": "Who can answer questions?",
                "options": [
                  "the driver",
                  "Mina",
                  "the caretaker"
                ],
                "answers": [
                  "Mina"
                ],
                "explanation": "The announcement says: If you have a question, ask for Mina at the information desk."
              },
              {
                "id": "m1-l1-7",
                "type": "choice",
                "text": "What did the team decide to do?",
                "options": [
                  "move the discussion to the ground floor",
                  "cancel the entire project",
                  "ignore the difficulty"
                ],
                "answers": [
                  "move the discussion to the ground floor"
                ],
                "explanation": "The announcement says: Because the lift was unavailable, the team decided to move the discussion to the ground floor."
              },
              {
                "id": "m1-l1-8",
                "type": "choice",
                "text": "What is the main purpose?",
                "options": [
                  "to sell more tickets",
                  "to replace every volunteer",
                  "sharing books across generations"
                ],
                "answers": [
                  "sharing books across generations"
                ],
                "explanation": "The announcement says: We are doing this to support sharing books across generations, not simply to advertise the event."
              }
            ]
          },
          {
            "id": "listening-p2",
            "title": "Briefing notes",
            "text": "Listen to the briefing. Complete the notes with one word or number.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-1-part-2.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-l2-1",
                "type": "text",
                "text": "Which day is the briefing held? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Thursday"
                ],
                "explanation": "The briefing explicitly gives Thursday."
              },
              {
                "id": "m1-l2-2",
                "type": "text",
                "text": "What time does the briefing start? Write ONE word or number.",
                "options": [],
                "answers": [
                  "10:30"
                ],
                "explanation": "The briefing explicitly gives 10:30."
              },
              {
                "id": "m1-l2-3",
                "type": "text",
                "text": "Who leads the first session? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Mina"
                ],
                "explanation": "The briefing explicitly gives Mina."
              },
              {
                "id": "m1-l2-4",
                "type": "text",
                "text": "What is the registration deadline? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Wednesday"
                ],
                "explanation": "The briefing explicitly gives Wednesday."
              },
              {
                "id": "m1-l2-5",
                "type": "text",
                "text": "How many entries were recorded? Write ONE word or number.",
                "options": [],
                "answers": [
                  "26"
                ],
                "explanation": "The briefing explicitly gives 26."
              },
              {
                "id": "m1-l2-6",
                "type": "text",
                "text": "Which word describes the main concern? Write ONE word or number.",
                "options": [],
                "answers": [
                  "accessibility"
                ],
                "explanation": "The briefing explicitly gives accessibility."
              }
            ]
          },
          {
            "id": "listening-p3",
            "title": "Four speakers",
            "text": "Match four speakers with the main ideas. Two options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-1-part-3.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-l3-1",
                "type": "choice",
                "text": "Match speaker 1 with the main idea.",
                "options": [
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation"
                ],
                "answers": [
                  "Personal motivation"
                ],
                "explanation": "Speaker 1 focuses on personal motivation."
              },
              {
                "id": "m1-l3-2",
                "type": "choice",
                "text": "Match speaker 2 with the main idea.",
                "options": [
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback"
                ],
                "answers": [
                  "Learning from a setback"
                ],
                "explanation": "Speaker 2 focuses on learning from a setback."
              },
              {
                "id": "m1-l3-3",
                "type": "choice",
                "text": "Match speaker 3 with the main idea.",
                "options": [
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result"
                ],
                "answers": [
                  "Cautious optimism about a result"
                ],
                "explanation": "Speaker 3 focuses on cautious optimism about a result."
              },
              {
                "id": "m1-l3-4",
                "type": "choice",
                "text": "Match speaker 4 with the main idea.",
                "options": [
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage"
                ],
                "answers": [
                  "Planning the next stage"
                ],
                "explanation": "Speaker 4 focuses on planning the next stage."
              }
            ]
          },
          {
            "id": "listening-p4",
            "title": "Responding to requests",
            "text": "Match each request to the response. Three options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-1-part-4.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-l4-1",
                "type": "choice",
                "text": "Which response was given to a visitor who cannot reach the upper floor?",
                "options": [
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room"
                ],
                "answers": [
                  "Move activities to an accessible room"
                ],
                "explanation": "The announcement connects this request with “move activities to an accessible room”."
              },
              {
                "id": "m1-l4-2",
                "type": "choice",
                "text": "Which response was given to a volunteer who needs to know the arrival time?",
                "options": [
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule"
                ],
                "answers": [
                  "Check the revised schedule"
                ],
                "explanation": "The announcement connects this request with “check the revised schedule”."
              },
              {
                "id": "m1-l4-3",
                "type": "choice",
                "text": "Which response was given to someone who wants the project to continue?",
                "options": [
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session"
                ],
                "answers": [
                  "Help plan a follow-up session"
                ],
                "explanation": "The announcement connects this request with “help plan a follow-up session”."
              },
              {
                "id": "m1-l4-4",
                "type": "choice",
                "text": "Which response was given to a researcher questioning the findings?",
                "options": [
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation"
                ],
                "answers": [
                  "Explain the sample limitation"
                ],
                "explanation": "The announcement connects this request with “explain the sample limitation”."
              },
              {
                "id": "m1-l4-5",
                "type": "choice",
                "text": "Which response was given to a participant with an item to bring?",
                "options": [
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list"
                ],
                "answers": [
                  "Read the equipment list"
                ],
                "explanation": "The announcement connects this request with “read the equipment list”."
              }
            ]
          },
          {
            "id": "listening-p5",
            "title": "Three conversations",
            "text": "Listen to three conversations. Answer two questions about each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-1-part-5.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-l5-1",
                "type": "choice",
                "text": "Why is the speaker cautious?",
                "options": [
                  "There was no trial.",
                  "The report was lost.",
                  "the survey covered just one afternoon"
                ],
                "answers": [
                  "the survey covered just one afternoon"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m1-l5-2",
                "type": "choice",
                "text": "What does the speaker recommend?",
                "options": [
                  "buying a larger room",
                  "another trial",
                  "closing the project"
                ],
                "answers": [
                  "another trial"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m1-l5-3",
                "type": "choice",
                "text": "Which option does the second speaker prefer?",
                "options": [
                  "neither option",
                  "a lending shelf",
                  "a digital catalogue"
                ],
                "answers": [
                  "a lending shelf"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m1-l5-4",
                "type": "choice",
                "text": "Why does the speaker prefer it?",
                "options": [
                  "sharing books across generations",
                  "it is the oldest option",
                  "it needs no volunteers"
                ],
                "answers": [
                  "sharing books across generations"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m1-l5-5",
                "type": "choice",
                "text": "Who will speak?",
                "options": [
                  "Mina",
                  "the driver",
                  "the caretaker"
                ],
                "answers": [
                  "Mina"
                ],
                "explanation": "Conversation 3 states this clearly."
              },
              {
                "id": "m1-l5-6",
                "type": "choice",
                "text": "Why did the plan change?",
                "options": [
                  "a lack of interest",
                  "a change in the weather forecast",
                  "the lift was unavailable"
                ],
                "answers": [
                  "the lift was unavailable"
                ],
                "explanation": "Conversation 3 states this clearly."
              }
            ]
          },
          {
            "id": "listening-p6",
            "title": "Project lecture",
            "text": "Listen to the lecture and write one word or number for each answer.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-1-part-6.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-l6-1",
                "type": "text",
                "text": "What do the collected records form? Write ONE word or number.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "The lecture uses the word evidence."
              },
              {
                "id": "m1-l6-2",
                "type": "text",
                "text": "What is the total highlighted in the report? Write ONE word or number.",
                "options": [],
                "answers": [
                  "26"
                ],
                "explanation": "The lecture uses the word 26."
              },
              {
                "id": "m1-l6-3",
                "type": "text",
                "text": "Which word describes the key idea? Write ONE word or number.",
                "options": [],
                "answers": [
                  "accessibility"
                ],
                "explanation": "The lecture uses the word accessibility."
              },
              {
                "id": "m1-l6-4",
                "type": "text",
                "text": "What did the team ask visitors for? Write ONE word or number.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "The lecture uses the word feedback."
              },
              {
                "id": "m1-l6-5",
                "type": "text",
                "text": "What must be understood behind a result? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conditions"
                ],
                "explanation": "The lecture uses the word conditions."
              },
              {
                "id": "m1-l6-6",
                "type": "text",
                "text": "Which section contains the final interpretation? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conclusions"
                ],
                "explanation": "The lecture uses the word conclusions."
              }
            ]
          }
        ]
      },
      {
        "skill": "reading",
        "minutes": 60,
        "parts": [
          {
            "id": "reading-p1",
            "title": "One-word gaps",
            "text": "The neighbourhood library project depended on (1) ____ who gave their time freely. At first, the team followed a fixed (2) ____, but the lift was unavailable. Careful (3) ____ showed exactly when the difficulty appeared. The organisers asked visitors for (4) ____ before changing the plan. They also wanted better (5) ____ for people who could not use the first arrangement. In the end, the strongest (6) ____ came from feedback from twenty-six visitors. None of these observations proves that the same approach would work in every town. Nevertheless, the group learned why small, well-recorded changes can matter. Its next meeting will consider whether add a Saturday session is practical and who could help.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-r1-1",
                "type": "text",
                "text": "Complete gap 1 with ONE word.",
                "options": [],
                "answers": [
                  "volunteers"
                ],
                "explanation": "“volunteers” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m1-r1-2",
                "type": "text",
                "text": "Complete gap 2 with ONE word.",
                "options": [],
                "answers": [
                  "schedule"
                ],
                "explanation": "“schedule” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m1-r1-3",
                "type": "text",
                "text": "Complete gap 3 with ONE word.",
                "options": [],
                "answers": [
                  "records"
                ],
                "explanation": "“records” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m1-r1-4",
                "type": "text",
                "text": "Complete gap 4 with ONE word.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "“feedback” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m1-r1-5",
                "type": "text",
                "text": "Complete gap 5 with ONE word.",
                "options": [],
                "answers": [
                  "access"
                ],
                "explanation": "“access” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m1-r1-6",
                "type": "text",
                "text": "Complete gap 6 with ONE word.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "“evidence” makes the sentence grammatically and logically complete."
              }
            ]
          },
          {
            "id": "reading-p2",
            "title": "Notices and needs",
            "text": "A. Guided introduction: meet Mina at Riverside Library on Thursday.\nB. Quiet hour: a smaller group meets before the main session.\nC. Access help: ask about step-free rooms and larger-print information.\nD. Skills desk: volunteers demonstrate practical methods and tools.\nE. Family visit: activities are planned for adults and children together.\nF. Research corner: examine the report and ask how information was collected.\nG. Follow-up team: help organise add a Saturday session.\nH. Short briefing: Mina gives a twenty-minute overview.\nI. Merchandise desk: souvenirs are available after the event.\nJ. Private room hire: businesses can book an unrelated meeting.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-r2-1",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants a guided introduction.",
                "options": [
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A"
                ],
                "answers": [
                  "A"
                ],
                "explanation": "Notice A offers exactly this service."
              },
              {
                "id": "m1-r2-2",
                "type": "choice",
                "text": "Which notice suits this person? Someone prefers a smaller, quieter group.",
                "options": [
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B"
                ],
                "answers": [
                  "B"
                ],
                "explanation": "Notice B offers exactly this service."
              },
              {
                "id": "m1-r2-3",
                "type": "choice",
                "text": "Which notice suits this person? A person needs access information.",
                "options": [
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C"
                ],
                "answers": [
                  "C"
                ],
                "explanation": "Notice C offers exactly this service."
              },
              {
                "id": "m1-r2-4",
                "type": "choice",
                "text": "Which notice suits this person? A learner wants a hands-on demonstration.",
                "options": [
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D"
                ],
                "answers": [
                  "D"
                ],
                "explanation": "Notice D offers exactly this service."
              },
              {
                "id": "m1-r2-5",
                "type": "choice",
                "text": "Which notice suits this person? A parent wants to bring a child.",
                "options": [
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E"
                ],
                "answers": [
                  "E"
                ],
                "explanation": "Notice E offers exactly this service."
              },
              {
                "id": "m1-r2-6",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants to inspect the evidence.",
                "options": [
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F"
                ],
                "answers": [
                  "F"
                ],
                "explanation": "Notice F offers exactly this service."
              },
              {
                "id": "m1-r2-7",
                "type": "choice",
                "text": "Which notice suits this person? A resident wants to help with the next event.",
                "options": [
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G"
                ],
                "answers": [
                  "G"
                ],
                "explanation": "Notice G offers exactly this service."
              },
              {
                "id": "m1-r2-8",
                "type": "choice",
                "text": "Which notice suits this person? Someone has only twenty minutes available.",
                "options": [
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H"
                ],
                "answers": [
                  "H"
                ],
                "explanation": "Notice H offers exactly this service."
              }
            ]
          },
          {
            "id": "reading-p3",
            "title": "Paragraph headings",
            "text": "Headings: A. The original difficulty | B. A practical adjustment | C. Collecting information | D. What the figures show | E. A reason for caution | F. The next question | G. A celebrity endorsement | H. An unrelated invention\n\nA. The idea behind neighbourhood library began with sharing books across generations. People welcomed the aim, but the first arrangement was less reliable than the team expected. In particular, the lift was unavailable. Several participants described this as a problem of planning rather than a reason to abandon the work. Their observations were recorded instead of being dismissed.\n\nB. The organisers compared a complicated solution with a manageable one. They chose to move the discussion to the ground floor. This did not remove every difficulty, yet it made the next session possible without asking volunteers to start again. Mina then explained the revised procedure to participants, including those who had missed the first announcement.\n\nC. Good intentions alone could not tell the team whether the change helped. They gathered feedback from twenty-six visitors and kept notes about the conditions under which each observation was made. When a record was incomplete, they marked it as uncertain rather than filling in a likely answer. This made the report less dramatic but more useful.\n\nD. According to the team, attendance rose from eighteen to twenty-six. The figure attracted attention because it described an observable outcome, not merely a prediction. It also encouraged more residents to ask how they could take part. However, a number by itself says little about the people or circumstances behind it.\n\nE. The report acknowledges that the survey covered just one afternoon. A different location, season or group of participants might produce a different result. The team therefore resisted a claim that its method was universally successful. This careful interpretation helped readers separate the evidence from the organisers' hopes.\n\nF. The final recommendation was to add a Saturday session. Before doing so, the organisers want to agree on clear measures of success and an accessible way to collect comments. They also plan to compare a lending shelf with a digital catalogue rather than assuming one choice will be best for every participant.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-r3-1",
                "type": "choice",
                "text": "Choose a heading for paragraph A.",
                "options": [
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty"
                ],
                "answers": [
                  "The original difficulty"
                ],
                "explanation": "Paragraph A develops the idea “the original difficulty”."
              },
              {
                "id": "m1-r3-2",
                "type": "choice",
                "text": "Choose a heading for paragraph B.",
                "options": [
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment"
                ],
                "answers": [
                  "A practical adjustment"
                ],
                "explanation": "Paragraph B develops the idea “a practical adjustment”."
              },
              {
                "id": "m1-r3-3",
                "type": "choice",
                "text": "Choose a heading for paragraph C.",
                "options": [
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information"
                ],
                "answers": [
                  "Collecting information"
                ],
                "explanation": "Paragraph C develops the idea “collecting information”."
              },
              {
                "id": "m1-r3-4",
                "type": "choice",
                "text": "Choose a heading for paragraph D.",
                "options": [
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show"
                ],
                "answers": [
                  "What the figures show"
                ],
                "explanation": "Paragraph D develops the idea “what the figures show”."
              },
              {
                "id": "m1-r3-5",
                "type": "choice",
                "text": "Choose a heading for paragraph E.",
                "options": [
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution"
                ],
                "answers": [
                  "A reason for caution"
                ],
                "explanation": "Paragraph E develops the idea “a reason for caution”."
              },
              {
                "id": "m1-r3-6",
                "type": "choice",
                "text": "Choose a heading for paragraph F.",
                "options": [
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question"
                ],
                "answers": [
                  "The next question"
                ],
                "explanation": "Paragraph F develops the idea “the next question”."
              }
            ]
          },
          {
            "id": "reading-p4",
            "title": "Detailed article",
            "text": "An invitation to take part in neighbourhood library appeared at Riverside Library. Its stated aim was sharing books across generations. The first public meeting was held on Thursday, and Mina collected the comments. Early reports suggested enthusiasm, but the team also heard practical concerns. Most notably, the lift was unavailable. It would have been easy to present this as a minor inconvenience. Instead, the organisers documented it and chose to move the discussion to the ground floor.\n\nThe revised activity did not follow exactly the original schedule. The organisers tested the change, recorded feedback from twenty-six visitors, and compared comments made before and after the adjustment. Their report states that attendance rose from eighteen to twenty-six. The authors are careful to explain the difference between an observation and a prediction: a positive first month does not guarantee a positive first year.\n\nTwo alternatives were discussed. Some participants supported a lending shelf; others preferred a digital catalogue. Neither option was dismissed without consideration. The report ultimately recommended a limited further trial rather than an immediate permanent decision. Its main reservation was that the survey covered just one afternoon. Mina said that the next stage would be to add a Saturday session.\n\nThe report does not give the ages of the visitors, the exact amount of any future grant, or a date for publishing a second edition. Those details may matter later, but a reader should not invent them now. The value of the project lies partly in its willingness to say what remains unknown.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-r4-1",
                "type": "choice",
                "text": "What was the stated aim of the project?",
                "options": [
                  "to sell souvenirs",
                  "to replace public transport",
                  "to close the venue",
                  "sharing books across generations"
                ],
                "answers": [
                  "sharing books across generations"
                ],
                "explanation": "The opening paragraph states the aim."
              },
              {
                "id": "m1-r4-2",
                "type": "choice",
                "text": "What led the organisers to revise the activity?",
                "options": [
                  "a cancelled newspaper",
                  "a competition prize",
                  "the lift was unavailable",
                  "a new mayor"
                ],
                "answers": [
                  "the lift was unavailable"
                ],
                "explanation": "The reported problem led directly to the adjustment."
              },
              {
                "id": "m1-r4-3",
                "type": "choice",
                "text": "Which action did the organisers take?",
                "options": [
                  "ignore accessibility",
                  "move the discussion to the ground floor",
                  "stop collecting comments",
                  "claim guaranteed success"
                ],
                "answers": [
                  "move the discussion to the ground floor"
                ],
                "explanation": "The revised action is explicitly described."
              },
              {
                "id": "m1-r4-4",
                "type": "choice",
                "text": "How do the authors treat the positive early result?",
                "options": [
                  "As useful but limited evidence",
                  "As proof for every community",
                  "As an error to hide",
                  "As irrelevant to the project"
                ],
                "answers": [
                  "As useful but limited evidence"
                ],
                "explanation": "The text distinguishes observation from prediction."
              },
              {
                "id": "m1-r4-5",
                "type": "choice",
                "text": "True / False / Not Given: The team recorded information during the revised activity.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The second paragraph says the team recorded evidence."
              },
              {
                "id": "m1-r4-6",
                "type": "choice",
                "text": "True / False / Not Given: The organisers permanently rejected both alternatives.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "False"
                ],
                "explanation": "Both alternatives were considered; a further trial was recommended."
              },
              {
                "id": "m1-r4-7",
                "type": "choice",
                "text": "True / False / Not Given: Every visitor was younger than eighteen.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No ages are supplied."
              },
              {
                "id": "m1-r4-8",
                "type": "choice",
                "text": "True / False / Not Given: The report identifies a limitation of the trial.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The report acknowledges a limitation."
              },
              {
                "id": "m1-r4-9",
                "type": "choice",
                "text": "True / False / Not Given: A second edition will be published next month.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No date for a second edition is given."
              }
            ]
          },
          {
            "id": "reading-p5",
            "title": "Analysis and inference",
            "text": "The organisers at Riverside Library made a useful distinction between a change that is easy to announce and a change that can be evaluated. Their focus was sharing books across generations. During the first stage, the lift was unavailable. The immediate response was to move the discussion to the ground floor, but the team did not describe this response as a complete solution.\n\nTo check what happened, they collected feedback from twenty-six visitors. The report highlighted a figure of 26. A short account of the trial was sent to Mina, who asked for more information about the conditions in which it took place. In particular, the survey covered just one afternoon. This mattered because an impressive number from a narrow trial can be misleading when removed from its context.\n\nAt the next meeting, participants will compare a lending shelf with a digital catalogue. They will also consider how to add a Saturday session. The discussion is designed to invite disagreement supported by reasons, not to reward the loudest speaker. If the group can repeat the trial and explain its limitations clearly, the result will be more useful to other communities.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-r5-1",
                "type": "text",
                "text": "Which venue hosted the organisers? Write ONE word from the venue name.",
                "options": [],
                "answers": [
                  "Riverside"
                ],
                "explanation": "The venue starts with Riverside."
              },
              {
                "id": "m1-r5-2",
                "type": "text",
                "text": "What figure did the report highlight? Write ONE number.",
                "options": [],
                "answers": [
                  "26"
                ],
                "explanation": "The figure given is 26."
              },
              {
                "id": "m1-r5-3",
                "type": "text",
                "text": "Who requested more information? Write ONE name.",
                "options": [],
                "answers": [
                  "Mina"
                ],
                "explanation": "The text names Mina."
              },
              {
                "id": "m1-r5-4",
                "type": "text",
                "text": "What can be misleading without context? Write ONE word.",
                "options": [],
                "answers": [
                  "number"
                ],
                "explanation": "The passage describes an impressive number from a narrow trial."
              },
              {
                "id": "m1-r5-5",
                "type": "choice",
                "text": "Why does the writer mention the limitation?",
                "options": [
                  "To argue that evidence is useless",
                  "To avoid hearing from participants",
                  "To hide the report",
                  "To prevent an overconfident conclusion"
                ],
                "answers": [
                  "To prevent an overconfident conclusion"
                ],
                "explanation": "The writer warns against removing the result from context."
              },
              {
                "id": "m1-r5-6",
                "type": "choice",
                "text": "What attitude does the final paragraph encourage?",
                "options": [
                  "Immediate approval of every idea",
                  "Competition for attention",
                  "Reasoned disagreement",
                  "Silence at meetings"
                ],
                "answers": [
                  "Reasoned disagreement"
                ],
                "explanation": "The group invites disagreement supported by reasons."
              }
            ]
          }
        ]
      },
      {
        "skill": "writing",
        "minutes": 60,
        "parts": [
          {
            "id": "writing-p1",
            "title": "Tasks 1.1, 1.2 and 2",
            "text": "Write all three responses. Your work is assessed by an administrator.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-w1",
                "type": "writing",
                "text": "You and a friend attended an activity about neighbourhood library. Write an informal message to your friend. Explain what you enjoyed and suggest one thing to do next. Aim for about 50 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m1-w2",
                "type": "writing",
                "text": "Write to Mina, the organiser at Riverside Library. Explain why you attended, describe the difficulty (“the lift was unavailable”), and suggest a practical improvement. Use a suitable formal tone. Aim for about 120–150 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m1-w3",
                "type": "writing",
                "text": "Some people think communities should invest in a lending shelf; others prefer a digital catalogue. Discuss both views and explain which approach would better support sharing books across generations. Give reasons and examples. Aim for about 180–220 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      },
      {
        "skill": "speaking",
        "minutes": 15,
        "parts": [
          {
            "id": "speaking-p1",
            "title": "Part 1.1 — personal questions",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-s1-1",
                "type": "speaking",
                "text": "What do you enjoy doing in your neighbourhood?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m1-s1-2",
                "type": "speaking",
                "text": "How do you usually learn about local events?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m1-s1-3",
                "type": "speaking",
                "text": "Have you ever visited a place like Riverside Library?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p2",
            "title": "Part 1.2 — compare two scenes",
            "text": "Scene A: a small group working together. Scene B: a large public presentation. Compare the two situations.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-s2-1",
                "type": "speaking",
                "text": "Compare a small group discussion at Riverside Library with a large public meeting. What might each be like?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m1-s2-2",
                "type": "speaking",
                "text": "Which setting would help people discuss neighbourhood library more effectively, and why?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m1-s2-3",
                "type": "speaking",
                "text": "Would your preference change if you were presenting rather than listening?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p3",
            "title": "Part 2 — extended answer",
            "text": "Prepare for one minute; speak for about two minutes.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-s3-1",
                "type": "speaking",
                "text": "Discuss this issue: should communities prioritise a lending shelf or a digital catalogue? Give advantages, disadvantages and examples connected with sharing books across generations.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p4",
            "title": "Part 3 — argument",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m1-s4-1",
                "type": "speaking",
                "text": "“A small successful trial is enough to justify a permanent public policy.” Discuss both sides of this claim. Refer to the limitation that the survey covered just one afternoon.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Multilevel Mock 02 · Urban cycling",
    "description": "Original mashq varianti: urban cycling. 35 Listening, 35 Reading, 3 Writing va 8 Speaking topshirig‘i. Rasmiy test savollari emas.",
    "level": "B1–C1",
    "format": "multilevel",
    "rightsConfirmed": true,
    "seedKey": "sinfquiz-multilevel-2",
    "sections": [
      {
        "skill": "listening",
        "minutes": 45,
        "parts": [
          {
            "id": "listening-p1",
            "title": "Short announcements",
            "text": "Listen to eight short messages. Choose the best answer for each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-2-part-1.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-l1-1",
                "type": "choice",
                "text": "When does the meeting begin?",
                "options": [
                  "09:20",
                  "08:50",
                  "12:00"
                ],
                "answers": [
                  "09:20"
                ],
                "explanation": "The announcement says: The first message said 08:50, but the urban cycling meeting now starts at 09:20."
              },
              {
                "id": "m2-l1-2",
                "type": "choice",
                "text": "Where will people meet?",
                "options": [
                  "the town hall",
                  "the railway café",
                  "East Park Hub"
                ],
                "answers": [
                  "East Park Hub"
                ],
                "explanation": "The announcement says: We are meeting at East Park Hub. Please do not wait at the old entrance."
              },
              {
                "id": "m2-l1-3",
                "type": "choice",
                "text": "What should visitors bring?",
                "options": [
                  "a camera",
                  "a helmet",
                  "a printed ticket"
                ],
                "answers": [
                  "a helmet"
                ],
                "explanation": "The announcement says: Before you leave home, remember to bring a helmet. Other equipment is provided."
              },
              {
                "id": "m2-l1-4",
                "type": "choice",
                "text": "What is the last day to register?",
                "options": [
                  "Friday",
                  "the following weekend",
                  "the day after the event"
                ],
                "answers": [
                  "Friday"
                ],
                "explanation": "The announcement says: You can sign up until Friday. We cannot add names at the door."
              },
              {
                "id": "m2-l1-5",
                "type": "choice",
                "text": "How much is admission?",
                "options": [
                  "five pounds",
                  "ten pounds",
                  "two pounds"
                ],
                "answers": [
                  "two pounds"
                ],
                "explanation": "The announcement says: Admission is two pounds. The amount covers the materials, and there is no extra charge."
              },
              {
                "id": "m2-l1-6",
                "type": "choice",
                "text": "Who can answer questions?",
                "options": [
                  "the driver",
                  "Owen",
                  "the caretaker"
                ],
                "answers": [
                  "Owen"
                ],
                "explanation": "The announcement says: If you have a question, ask for Owen at the information desk."
              },
              {
                "id": "m2-l1-7",
                "type": "choice",
                "text": "What did the team decide to do?",
                "options": [
                  "use the riverside path",
                  "cancel the entire project",
                  "ignore the difficulty"
                ],
                "answers": [
                  "use the riverside path"
                ],
                "explanation": "The announcement says: Because roadworks blocked the usual route, the team decided to use the riverside path."
              },
              {
                "id": "m2-l1-8",
                "type": "choice",
                "text": "What is the main purpose?",
                "options": [
                  "to sell more tickets",
                  "to replace every volunteer",
                  "safer short journeys"
                ],
                "answers": [
                  "safer short journeys"
                ],
                "explanation": "The announcement says: We are doing this to support safer short journeys, not simply to advertise the event."
              }
            ]
          },
          {
            "id": "listening-p2",
            "title": "Briefing notes",
            "text": "Listen to the briefing. Complete the notes with one word or number.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-2-part-2.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-l2-1",
                "type": "text",
                "text": "Which day is the briefing held? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Saturday"
                ],
                "explanation": "The briefing explicitly gives Saturday."
              },
              {
                "id": "m2-l2-2",
                "type": "text",
                "text": "What time does the briefing start? Write ONE word or number.",
                "options": [],
                "answers": [
                  "09:20"
                ],
                "explanation": "The briefing explicitly gives 09:20."
              },
              {
                "id": "m2-l2-3",
                "type": "text",
                "text": "Who leads the first session? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Owen"
                ],
                "explanation": "The briefing explicitly gives Owen."
              },
              {
                "id": "m2-l2-4",
                "type": "text",
                "text": "What is the registration deadline? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Friday"
                ],
                "explanation": "The briefing explicitly gives Friday."
              },
              {
                "id": "m2-l2-5",
                "type": "text",
                "text": "How many entries were recorded? Write ONE word or number.",
                "options": [],
                "answers": [
                  "30"
                ],
                "explanation": "The briefing explicitly gives 30."
              },
              {
                "id": "m2-l2-6",
                "type": "text",
                "text": "Which word describes the main concern? Write ONE word or number.",
                "options": [],
                "answers": [
                  "visibility"
                ],
                "explanation": "The briefing explicitly gives visibility."
              }
            ]
          },
          {
            "id": "listening-p3",
            "title": "Four speakers",
            "text": "Match four speakers with the main ideas. Two options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-2-part-3.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-l3-1",
                "type": "choice",
                "text": "Match speaker 1 with the main idea.",
                "options": [
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback"
                ],
                "answers": [
                  "Personal motivation"
                ],
                "explanation": "Speaker 1 focuses on personal motivation."
              },
              {
                "id": "m2-l3-2",
                "type": "choice",
                "text": "Match speaker 2 with the main idea.",
                "options": [
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result"
                ],
                "answers": [
                  "Learning from a setback"
                ],
                "explanation": "Speaker 2 focuses on learning from a setback."
              },
              {
                "id": "m2-l3-3",
                "type": "choice",
                "text": "Match speaker 3 with the main idea.",
                "options": [
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage"
                ],
                "answers": [
                  "Cautious optimism about a result"
                ],
                "explanation": "Speaker 3 focuses on cautious optimism about a result."
              },
              {
                "id": "m2-l3-4",
                "type": "choice",
                "text": "Match speaker 4 with the main idea.",
                "options": [
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor"
                ],
                "answers": [
                  "Planning the next stage"
                ],
                "explanation": "Speaker 4 focuses on planning the next stage."
              }
            ]
          },
          {
            "id": "listening-p4",
            "title": "Responding to requests",
            "text": "Match each request to the response. Three options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-2-part-4.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-l4-1",
                "type": "choice",
                "text": "Which response was given to a visitor who cannot reach the upper floor?",
                "options": [
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule"
                ],
                "answers": [
                  "Move activities to an accessible room"
                ],
                "explanation": "The announcement connects this request with “move activities to an accessible room”."
              },
              {
                "id": "m2-l4-2",
                "type": "choice",
                "text": "Which response was given to a volunteer who needs to know the arrival time?",
                "options": [
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session"
                ],
                "answers": [
                  "Check the revised schedule"
                ],
                "explanation": "The announcement connects this request with “check the revised schedule”."
              },
              {
                "id": "m2-l4-3",
                "type": "choice",
                "text": "Which response was given to someone who wants the project to continue?",
                "options": [
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation"
                ],
                "answers": [
                  "Help plan a follow-up session"
                ],
                "explanation": "The announcement connects this request with “help plan a follow-up session”."
              },
              {
                "id": "m2-l4-4",
                "type": "choice",
                "text": "Which response was given to a researcher questioning the findings?",
                "options": [
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list"
                ],
                "answers": [
                  "Explain the sample limitation"
                ],
                "explanation": "The announcement connects this request with “explain the sample limitation”."
              },
              {
                "id": "m2-l4-5",
                "type": "choice",
                "text": "Which response was given to a participant with an item to bring?",
                "options": [
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately"
                ],
                "answers": [
                  "Read the equipment list"
                ],
                "explanation": "The announcement connects this request with “read the equipment list”."
              }
            ]
          },
          {
            "id": "listening-p5",
            "title": "Three conversations",
            "text": "Listen to three conversations. Answer two questions about each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-2-part-5.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-l5-1",
                "type": "choice",
                "text": "Why is the speaker cautious?",
                "options": [
                  "The report was lost.",
                  "the trial took place in dry weather",
                  "There was no trial."
                ],
                "answers": [
                  "the trial took place in dry weather"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m2-l5-2",
                "type": "choice",
                "text": "What does the speaker recommend?",
                "options": [
                  "another trial",
                  "closing the project",
                  "buying a larger room"
                ],
                "answers": [
                  "another trial"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m2-l5-3",
                "type": "choice",
                "text": "Which option does the second speaker prefer?",
                "options": [
                  "protected cycle lanes",
                  "more parking spaces",
                  "neither option"
                ],
                "answers": [
                  "protected cycle lanes"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m2-l5-4",
                "type": "choice",
                "text": "Why does the speaker prefer it?",
                "options": [
                  "it is the oldest option",
                  "it needs no volunteers",
                  "safer short journeys"
                ],
                "answers": [
                  "safer short journeys"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m2-l5-5",
                "type": "choice",
                "text": "Who will speak?",
                "options": [
                  "the driver",
                  "the caretaker",
                  "Owen"
                ],
                "answers": [
                  "Owen"
                ],
                "explanation": "Conversation 3 states this clearly."
              },
              {
                "id": "m2-l5-6",
                "type": "choice",
                "text": "Why did the plan change?",
                "options": [
                  "a change in the weather forecast",
                  "roadworks blocked the usual route",
                  "a lack of interest"
                ],
                "answers": [
                  "roadworks blocked the usual route"
                ],
                "explanation": "Conversation 3 states this clearly."
              }
            ]
          },
          {
            "id": "listening-p6",
            "title": "Project lecture",
            "text": "Listen to the lecture and write one word or number for each answer.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-2-part-6.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-l6-1",
                "type": "text",
                "text": "What do the collected records form? Write ONE word or number.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "The lecture uses the word evidence."
              },
              {
                "id": "m2-l6-2",
                "type": "text",
                "text": "What is the total highlighted in the report? Write ONE word or number.",
                "options": [],
                "answers": [
                  "30"
                ],
                "explanation": "The lecture uses the word 30."
              },
              {
                "id": "m2-l6-3",
                "type": "text",
                "text": "Which word describes the key idea? Write ONE word or number.",
                "options": [],
                "answers": [
                  "visibility"
                ],
                "explanation": "The lecture uses the word visibility."
              },
              {
                "id": "m2-l6-4",
                "type": "text",
                "text": "What did the team ask visitors for? Write ONE word or number.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "The lecture uses the word feedback."
              },
              {
                "id": "m2-l6-5",
                "type": "text",
                "text": "What must be understood behind a result? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conditions"
                ],
                "explanation": "The lecture uses the word conditions."
              },
              {
                "id": "m2-l6-6",
                "type": "text",
                "text": "Which section contains the final interpretation? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conclusions"
                ],
                "explanation": "The lecture uses the word conclusions."
              }
            ]
          }
        ]
      },
      {
        "skill": "reading",
        "minutes": 60,
        "parts": [
          {
            "id": "reading-p1",
            "title": "One-word gaps",
            "text": "The urban cycling project depended on (1) ____ who gave their time freely. At first, the team followed a fixed (2) ____, but roadworks blocked the usual route. Careful (3) ____ showed exactly when the difficulty appeared. The organisers asked visitors for (4) ____ before changing the plan. They also wanted better (5) ____ for people who could not use the first arrangement. In the end, the strongest (6) ____ came from journey logs from thirty riders. None of these observations proves that the same approach would work in every town. Nevertheless, the group learned why small, well-recorded changes can matter. Its next meeting will consider whether test the route during winter is practical and who could help.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-r1-1",
                "type": "text",
                "text": "Complete gap 1 with ONE word.",
                "options": [],
                "answers": [
                  "volunteers"
                ],
                "explanation": "“volunteers” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m2-r1-2",
                "type": "text",
                "text": "Complete gap 2 with ONE word.",
                "options": [],
                "answers": [
                  "schedule"
                ],
                "explanation": "“schedule” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m2-r1-3",
                "type": "text",
                "text": "Complete gap 3 with ONE word.",
                "options": [],
                "answers": [
                  "records"
                ],
                "explanation": "“records” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m2-r1-4",
                "type": "text",
                "text": "Complete gap 4 with ONE word.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "“feedback” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m2-r1-5",
                "type": "text",
                "text": "Complete gap 5 with ONE word.",
                "options": [],
                "answers": [
                  "access"
                ],
                "explanation": "“access” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m2-r1-6",
                "type": "text",
                "text": "Complete gap 6 with ONE word.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "“evidence” makes the sentence grammatically and logically complete."
              }
            ]
          },
          {
            "id": "reading-p2",
            "title": "Notices and needs",
            "text": "A. Guided introduction: meet Owen at East Park Hub on Saturday.\nB. Quiet hour: a smaller group meets before the main session.\nC. Access help: ask about step-free rooms and larger-print information.\nD. Skills desk: volunteers demonstrate practical methods and tools.\nE. Family visit: activities are planned for adults and children together.\nF. Research corner: examine the report and ask how information was collected.\nG. Follow-up team: help organise test the route during winter.\nH. Short briefing: Owen gives a twenty-minute overview.\nI. Merchandise desk: souvenirs are available after the event.\nJ. Private room hire: businesses can book an unrelated meeting.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-r2-1",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants a guided introduction.",
                "options": [
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B"
                ],
                "answers": [
                  "A"
                ],
                "explanation": "Notice A offers exactly this service."
              },
              {
                "id": "m2-r2-2",
                "type": "choice",
                "text": "Which notice suits this person? Someone prefers a smaller, quieter group.",
                "options": [
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C"
                ],
                "answers": [
                  "B"
                ],
                "explanation": "Notice B offers exactly this service."
              },
              {
                "id": "m2-r2-3",
                "type": "choice",
                "text": "Which notice suits this person? A person needs access information.",
                "options": [
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D"
                ],
                "answers": [
                  "C"
                ],
                "explanation": "Notice C offers exactly this service."
              },
              {
                "id": "m2-r2-4",
                "type": "choice",
                "text": "Which notice suits this person? A learner wants a hands-on demonstration.",
                "options": [
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E"
                ],
                "answers": [
                  "D"
                ],
                "explanation": "Notice D offers exactly this service."
              },
              {
                "id": "m2-r2-5",
                "type": "choice",
                "text": "Which notice suits this person? A parent wants to bring a child.",
                "options": [
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F"
                ],
                "answers": [
                  "E"
                ],
                "explanation": "Notice E offers exactly this service."
              },
              {
                "id": "m2-r2-6",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants to inspect the evidence.",
                "options": [
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G"
                ],
                "answers": [
                  "F"
                ],
                "explanation": "Notice F offers exactly this service."
              },
              {
                "id": "m2-r2-7",
                "type": "choice",
                "text": "Which notice suits this person? A resident wants to help with the next event.",
                "options": [
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H"
                ],
                "answers": [
                  "G"
                ],
                "explanation": "Notice G offers exactly this service."
              },
              {
                "id": "m2-r2-8",
                "type": "choice",
                "text": "Which notice suits this person? Someone has only twenty minutes available.",
                "options": [
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I"
                ],
                "answers": [
                  "H"
                ],
                "explanation": "Notice H offers exactly this service."
              }
            ]
          },
          {
            "id": "reading-p3",
            "title": "Paragraph headings",
            "text": "Headings: A. The original difficulty | B. A practical adjustment | C. Collecting information | D. What the figures show | E. A reason for caution | F. The next question | G. A celebrity endorsement | H. An unrelated invention\n\nA. The idea behind urban cycling began with safer short journeys. People welcomed the aim, but the first arrangement was less reliable than the team expected. In particular, roadworks blocked the usual route. Several participants described this as a problem of planning rather than a reason to abandon the work. Their observations were recorded instead of being dismissed.\n\nB. The organisers compared a complicated solution with a manageable one. They chose to use the riverside path. This did not remove every difficulty, yet it made the next session possible without asking volunteers to start again. Owen then explained the revised procedure to participants, including those who had missed the first announcement.\n\nC. Good intentions alone could not tell the team whether the change helped. They gathered journey logs from thirty riders and kept notes about the conditions under which each observation was made. When a record was incomplete, they marked it as uncertain rather than filling in a likely answer. This made the report less dramatic but more useful.\n\nD. According to the team, travel time fell by twelve minutes. The figure attracted attention because it described an observable outcome, not merely a prediction. It also encouraged more residents to ask how they could take part. However, a number by itself says little about the people or circumstances behind it.\n\nE. The report acknowledges that the trial took place in dry weather. A different location, season or group of participants might produce a different result. The team therefore resisted a claim that its method was universally successful. This careful interpretation helped readers separate the evidence from the organisers' hopes.\n\nF. The final recommendation was to test the route during winter. Before doing so, the organisers want to agree on clear measures of success and an accessible way to collect comments. They also plan to compare protected cycle lanes with more parking spaces rather than assuming one choice will be best for every participant.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-r3-1",
                "type": "choice",
                "text": "Choose a heading for paragraph A.",
                "options": [
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment"
                ],
                "answers": [
                  "The original difficulty"
                ],
                "explanation": "Paragraph A develops the idea “the original difficulty”."
              },
              {
                "id": "m2-r3-2",
                "type": "choice",
                "text": "Choose a heading for paragraph B.",
                "options": [
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information"
                ],
                "answers": [
                  "A practical adjustment"
                ],
                "explanation": "Paragraph B develops the idea “a practical adjustment”."
              },
              {
                "id": "m2-r3-3",
                "type": "choice",
                "text": "Choose a heading for paragraph C.",
                "options": [
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show"
                ],
                "answers": [
                  "Collecting information"
                ],
                "explanation": "Paragraph C develops the idea “collecting information”."
              },
              {
                "id": "m2-r3-4",
                "type": "choice",
                "text": "Choose a heading for paragraph D.",
                "options": [
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution"
                ],
                "answers": [
                  "What the figures show"
                ],
                "explanation": "Paragraph D develops the idea “what the figures show”."
              },
              {
                "id": "m2-r3-5",
                "type": "choice",
                "text": "Choose a heading for paragraph E.",
                "options": [
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question"
                ],
                "answers": [
                  "A reason for caution"
                ],
                "explanation": "Paragraph E develops the idea “a reason for caution”."
              },
              {
                "id": "m2-r3-6",
                "type": "choice",
                "text": "Choose a heading for paragraph F.",
                "options": [
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement"
                ],
                "answers": [
                  "The next question"
                ],
                "explanation": "Paragraph F develops the idea “the next question”."
              }
            ]
          },
          {
            "id": "reading-p4",
            "title": "Detailed article",
            "text": "An invitation to take part in urban cycling appeared at East Park Hub. Its stated aim was safer short journeys. The first public meeting was held on Saturday, and Owen collected the comments. Early reports suggested enthusiasm, but the team also heard practical concerns. Most notably, roadworks blocked the usual route. It would have been easy to present this as a minor inconvenience. Instead, the organisers documented it and chose to use the riverside path.\n\nThe revised activity did not follow exactly the original schedule. The organisers tested the change, recorded journey logs from thirty riders, and compared comments made before and after the adjustment. Their report states that travel time fell by twelve minutes. The authors are careful to explain the difference between an observation and a prediction: a positive first month does not guarantee a positive first year.\n\nTwo alternatives were discussed. Some participants supported protected cycle lanes; others preferred more parking spaces. Neither option was dismissed without consideration. The report ultimately recommended a limited further trial rather than an immediate permanent decision. Its main reservation was that the trial took place in dry weather. Owen said that the next stage would be to test the route during winter.\n\nThe report does not give the ages of the visitors, the exact amount of any future grant, or a date for publishing a second edition. Those details may matter later, but a reader should not invent them now. The value of the project lies partly in its willingness to say what remains unknown.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-r4-1",
                "type": "choice",
                "text": "What was the stated aim of the project?",
                "options": [
                  "to replace public transport",
                  "to close the venue",
                  "safer short journeys",
                  "to sell souvenirs"
                ],
                "answers": [
                  "safer short journeys"
                ],
                "explanation": "The opening paragraph states the aim."
              },
              {
                "id": "m2-r4-2",
                "type": "choice",
                "text": "What led the organisers to revise the activity?",
                "options": [
                  "a competition prize",
                  "roadworks blocked the usual route",
                  "a new mayor",
                  "a cancelled newspaper"
                ],
                "answers": [
                  "roadworks blocked the usual route"
                ],
                "explanation": "The reported problem led directly to the adjustment."
              },
              {
                "id": "m2-r4-3",
                "type": "choice",
                "text": "Which action did the organisers take?",
                "options": [
                  "use the riverside path",
                  "stop collecting comments",
                  "claim guaranteed success",
                  "ignore accessibility"
                ],
                "answers": [
                  "use the riverside path"
                ],
                "explanation": "The revised action is explicitly described."
              },
              {
                "id": "m2-r4-4",
                "type": "choice",
                "text": "How do the authors treat the positive early result?",
                "options": [
                  "As proof for every community",
                  "As an error to hide",
                  "As irrelevant to the project",
                  "As useful but limited evidence"
                ],
                "answers": [
                  "As useful but limited evidence"
                ],
                "explanation": "The text distinguishes observation from prediction."
              },
              {
                "id": "m2-r4-5",
                "type": "choice",
                "text": "True / False / Not Given: The team recorded information during the revised activity.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The second paragraph says the team recorded evidence."
              },
              {
                "id": "m2-r4-6",
                "type": "choice",
                "text": "True / False / Not Given: The organisers permanently rejected both alternatives.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "False"
                ],
                "explanation": "Both alternatives were considered; a further trial was recommended."
              },
              {
                "id": "m2-r4-7",
                "type": "choice",
                "text": "True / False / Not Given: Every visitor was younger than eighteen.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No ages are supplied."
              },
              {
                "id": "m2-r4-8",
                "type": "choice",
                "text": "True / False / Not Given: The report identifies a limitation of the trial.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The report acknowledges a limitation."
              },
              {
                "id": "m2-r4-9",
                "type": "choice",
                "text": "True / False / Not Given: A second edition will be published next month.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No date for a second edition is given."
              }
            ]
          },
          {
            "id": "reading-p5",
            "title": "Analysis and inference",
            "text": "The organisers at East Park Hub made a useful distinction between a change that is easy to announce and a change that can be evaluated. Their focus was safer short journeys. During the first stage, roadworks blocked the usual route. The immediate response was to use the riverside path, but the team did not describe this response as a complete solution.\n\nTo check what happened, they collected journey logs from thirty riders. The report highlighted a figure of 30. A short account of the trial was sent to Owen, who asked for more information about the conditions in which it took place. In particular, the trial took place in dry weather. This mattered because an impressive number from a narrow trial can be misleading when removed from its context.\n\nAt the next meeting, participants will compare protected cycle lanes with more parking spaces. They will also consider how to test the route during winter. The discussion is designed to invite disagreement supported by reasons, not to reward the loudest speaker. If the group can repeat the trial and explain its limitations clearly, the result will be more useful to other communities.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-r5-1",
                "type": "text",
                "text": "Which venue hosted the organisers? Write ONE word from the venue name.",
                "options": [],
                "answers": [
                  "East"
                ],
                "explanation": "The venue starts with East."
              },
              {
                "id": "m2-r5-2",
                "type": "text",
                "text": "What figure did the report highlight? Write ONE number.",
                "options": [],
                "answers": [
                  "30"
                ],
                "explanation": "The figure given is 30."
              },
              {
                "id": "m2-r5-3",
                "type": "text",
                "text": "Who requested more information? Write ONE name.",
                "options": [],
                "answers": [
                  "Owen"
                ],
                "explanation": "The text names Owen."
              },
              {
                "id": "m2-r5-4",
                "type": "text",
                "text": "What can be misleading without context? Write ONE word.",
                "options": [],
                "answers": [
                  "number"
                ],
                "explanation": "The passage describes an impressive number from a narrow trial."
              },
              {
                "id": "m2-r5-5",
                "type": "choice",
                "text": "Why does the writer mention the limitation?",
                "options": [
                  "To avoid hearing from participants",
                  "To hide the report",
                  "To prevent an overconfident conclusion",
                  "To argue that evidence is useless"
                ],
                "answers": [
                  "To prevent an overconfident conclusion"
                ],
                "explanation": "The writer warns against removing the result from context."
              },
              {
                "id": "m2-r5-6",
                "type": "choice",
                "text": "What attitude does the final paragraph encourage?",
                "options": [
                  "Competition for attention",
                  "Reasoned disagreement",
                  "Silence at meetings",
                  "Immediate approval of every idea"
                ],
                "answers": [
                  "Reasoned disagreement"
                ],
                "explanation": "The group invites disagreement supported by reasons."
              }
            ]
          }
        ]
      },
      {
        "skill": "writing",
        "minutes": 60,
        "parts": [
          {
            "id": "writing-p1",
            "title": "Tasks 1.1, 1.2 and 2",
            "text": "Write all three responses. Your work is assessed by an administrator.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-w1",
                "type": "writing",
                "text": "You and a friend attended an activity about urban cycling. Write an informal message to your friend. Explain what you enjoyed and suggest one thing to do next. Aim for about 50 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m2-w2",
                "type": "writing",
                "text": "Write to Owen, the organiser at East Park Hub. Explain why you attended, describe the difficulty (“roadworks blocked the usual route”), and suggest a practical improvement. Use a suitable formal tone. Aim for about 120–150 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m2-w3",
                "type": "writing",
                "text": "Some people think communities should invest in protected cycle lanes; others prefer more parking spaces. Discuss both views and explain which approach would better support safer short journeys. Give reasons and examples. Aim for about 180–220 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      },
      {
        "skill": "speaking",
        "minutes": 15,
        "parts": [
          {
            "id": "speaking-p1",
            "title": "Part 1.1 — personal questions",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-s1-1",
                "type": "speaking",
                "text": "What do you enjoy doing in your neighbourhood?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m2-s1-2",
                "type": "speaking",
                "text": "How do you usually learn about local events?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m2-s1-3",
                "type": "speaking",
                "text": "Have you ever visited a place like East Park Hub?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p2",
            "title": "Part 1.2 — compare two scenes",
            "text": "Scene A: a small group working together. Scene B: a large public presentation. Compare the two situations.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-s2-1",
                "type": "speaking",
                "text": "Compare a small group discussion at East Park Hub with a large public meeting. What might each be like?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m2-s2-2",
                "type": "speaking",
                "text": "Which setting would help people discuss urban cycling more effectively, and why?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m2-s2-3",
                "type": "speaking",
                "text": "Would your preference change if you were presenting rather than listening?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p3",
            "title": "Part 2 — extended answer",
            "text": "Prepare for one minute; speak for about two minutes.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-s3-1",
                "type": "speaking",
                "text": "Discuss this issue: should communities prioritise protected cycle lanes or more parking spaces? Give advantages, disadvantages and examples connected with safer short journeys.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p4",
            "title": "Part 3 — argument",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m2-s4-1",
                "type": "speaking",
                "text": "“A small successful trial is enough to justify a permanent public policy.” Discuss both sides of this claim. Refer to the limitation that the trial took place in dry weather.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Multilevel Mock 03 · School gardens",
    "description": "Original mashq varianti: school gardens. 35 Listening, 35 Reading, 3 Writing va 8 Speaking topshirig‘i. Rasmiy test savollari emas.",
    "level": "B1–C1",
    "format": "multilevel",
    "rightsConfirmed": true,
    "seedKey": "sinfquiz-multilevel-3",
    "sections": [
      {
        "skill": "listening",
        "minutes": 45,
        "parts": [
          {
            "id": "listening-p1",
            "title": "Short announcements",
            "text": "Listen to eight short messages. Choose the best answer for each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-3-part-1.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-l1-1",
                "type": "choice",
                "text": "When does the meeting begin?",
                "options": [
                  "14:15",
                  "13:30",
                  "12:00"
                ],
                "answers": [
                  "14:15"
                ],
                "explanation": "The announcement says: The first message said 13:30, but the school gardens meeting now starts at 14:15."
              },
              {
                "id": "m3-l1-2",
                "type": "choice",
                "text": "Where will people meet?",
                "options": [
                  "the town hall",
                  "the railway café",
                  "Willow School"
                ],
                "answers": [
                  "Willow School"
                ],
                "explanation": "The announcement says: We are meeting at Willow School. Please do not wait at the old entrance."
              },
              {
                "id": "m3-l1-3",
                "type": "choice",
                "text": "What should visitors bring?",
                "options": [
                  "a camera",
                  "gardening gloves",
                  "a printed ticket"
                ],
                "answers": [
                  "gardening gloves"
                ],
                "explanation": "The announcement says: Before you leave home, remember to bring gardening gloves. Other equipment is provided."
              },
              {
                "id": "m3-l1-4",
                "type": "choice",
                "text": "What is the last day to register?",
                "options": [
                  "Monday",
                  "the following weekend",
                  "the day after the event"
                ],
                "answers": [
                  "Monday"
                ],
                "explanation": "The announcement says: You can sign up until Monday. We cannot add names at the door."
              },
              {
                "id": "m3-l1-5",
                "type": "choice",
                "text": "How much is admission?",
                "options": [
                  "five pounds",
                  "ten pounds",
                  "free"
                ],
                "answers": [
                  "free"
                ],
                "explanation": "The announcement says: Admission is free. The amount covers the materials, and there is no extra charge."
              },
              {
                "id": "m3-l1-6",
                "type": "choice",
                "text": "Who can answer questions?",
                "options": [
                  "the driver",
                  "Leila",
                  "the caretaker"
                ],
                "answers": [
                  "Leila"
                ],
                "explanation": "The announcement says: If you have a question, ask for Leila at the information desk."
              },
              {
                "id": "m3-l1-7",
                "type": "choice",
                "text": "What did the team decide to do?",
                "options": [
                  "move the trays beside the south window",
                  "cancel the entire project",
                  "ignore the difficulty"
                ],
                "answers": [
                  "move the trays beside the south window"
                ],
                "explanation": "The announcement says: Because the first seedlings received too little light, the team decided to move the trays beside the south window."
              },
              {
                "id": "m3-l1-8",
                "type": "choice",
                "text": "What is the main purpose?",
                "options": [
                  "to sell more tickets",
                  "to replace every volunteer",
                  "growing food in small spaces"
                ],
                "answers": [
                  "growing food in small spaces"
                ],
                "explanation": "The announcement says: We are doing this to support growing food in small spaces, not simply to advertise the event."
              }
            ]
          },
          {
            "id": "listening-p2",
            "title": "Briefing notes",
            "text": "Listen to the briefing. Complete the notes with one word or number.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-3-part-2.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-l2-1",
                "type": "text",
                "text": "Which day is the briefing held? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Tuesday"
                ],
                "explanation": "The briefing explicitly gives Tuesday."
              },
              {
                "id": "m3-l2-2",
                "type": "text",
                "text": "What time does the briefing start? Write ONE word or number.",
                "options": [],
                "answers": [
                  "14:15"
                ],
                "explanation": "The briefing explicitly gives 14:15."
              },
              {
                "id": "m3-l2-3",
                "type": "text",
                "text": "Who leads the first session? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Leila"
                ],
                "explanation": "The briefing explicitly gives Leila."
              },
              {
                "id": "m3-l2-4",
                "type": "text",
                "text": "What is the registration deadline? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Monday"
                ],
                "explanation": "The briefing explicitly gives Monday."
              },
              {
                "id": "m3-l2-5",
                "type": "text",
                "text": "How many entries were recorded? Write ONE word or number.",
                "options": [],
                "answers": [
                  "4"
                ],
                "explanation": "The briefing explicitly gives 4."
              },
              {
                "id": "m3-l2-6",
                "type": "text",
                "text": "Which word describes the main concern? Write ONE word or number.",
                "options": [],
                "answers": [
                  "sunlight"
                ],
                "explanation": "The briefing explicitly gives sunlight."
              }
            ]
          },
          {
            "id": "listening-p3",
            "title": "Four speakers",
            "text": "Match four speakers with the main ideas. Two options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-3-part-3.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-l3-1",
                "type": "choice",
                "text": "Match speaker 1 with the main idea.",
                "options": [
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result"
                ],
                "answers": [
                  "Personal motivation"
                ],
                "explanation": "Speaker 1 focuses on personal motivation."
              },
              {
                "id": "m3-l3-2",
                "type": "choice",
                "text": "Match speaker 2 with the main idea.",
                "options": [
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage"
                ],
                "answers": [
                  "Learning from a setback"
                ],
                "explanation": "Speaker 2 focuses on learning from a setback."
              },
              {
                "id": "m3-l3-3",
                "type": "choice",
                "text": "Match speaker 3 with the main idea.",
                "options": [
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor"
                ],
                "answers": [
                  "Cautious optimism about a result"
                ],
                "explanation": "Speaker 3 focuses on cautious optimism about a result."
              },
              {
                "id": "m3-l3-4",
                "type": "choice",
                "text": "Match speaker 4 with the main idea.",
                "options": [
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project"
                ],
                "answers": [
                  "Planning the next stage"
                ],
                "explanation": "Speaker 4 focuses on planning the next stage."
              }
            ]
          },
          {
            "id": "listening-p4",
            "title": "Responding to requests",
            "text": "Match each request to the response. Three options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-3-part-4.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-l4-1",
                "type": "choice",
                "text": "Which response was given to a visitor who cannot reach the upper floor?",
                "options": [
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session"
                ],
                "answers": [
                  "Move activities to an accessible room"
                ],
                "explanation": "The announcement connects this request with “move activities to an accessible room”."
              },
              {
                "id": "m3-l4-2",
                "type": "choice",
                "text": "Which response was given to a volunteer who needs to know the arrival time?",
                "options": [
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation"
                ],
                "answers": [
                  "Check the revised schedule"
                ],
                "explanation": "The announcement connects this request with “check the revised schedule”."
              },
              {
                "id": "m3-l4-3",
                "type": "choice",
                "text": "Which response was given to someone who wants the project to continue?",
                "options": [
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list"
                ],
                "answers": [
                  "Help plan a follow-up session"
                ],
                "explanation": "The announcement connects this request with “help plan a follow-up session”."
              },
              {
                "id": "m3-l4-4",
                "type": "choice",
                "text": "Which response was given to a researcher questioning the findings?",
                "options": [
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately"
                ],
                "answers": [
                  "Explain the sample limitation"
                ],
                "explanation": "The announcement connects this request with “explain the sample limitation”."
              },
              {
                "id": "m3-l4-5",
                "type": "choice",
                "text": "Which response was given to a participant with an item to bring?",
                "options": [
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper"
                ],
                "answers": [
                  "Read the equipment list"
                ],
                "explanation": "The announcement connects this request with “read the equipment list”."
              }
            ]
          },
          {
            "id": "listening-p5",
            "title": "Three conversations",
            "text": "Listen to three conversations. Answer two questions about each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-3-part-5.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-l5-1",
                "type": "choice",
                "text": "Why is the speaker cautious?",
                "options": [
                  "the project did not measure soil quality",
                  "There was no trial.",
                  "The report was lost."
                ],
                "answers": [
                  "the project did not measure soil quality"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m3-l5-2",
                "type": "choice",
                "text": "What does the speaker recommend?",
                "options": [
                  "closing the project",
                  "buying a larger room",
                  "another trial"
                ],
                "answers": [
                  "another trial"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m3-l5-3",
                "type": "choice",
                "text": "Which option does the second speaker prefer?",
                "options": [
                  "decorative paving",
                  "neither option",
                  "rainwater collection"
                ],
                "answers": [
                  "rainwater collection"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m3-l5-4",
                "type": "choice",
                "text": "Why does the speaker prefer it?",
                "options": [
                  "it needs no volunteers",
                  "growing food in small spaces",
                  "it is the oldest option"
                ],
                "answers": [
                  "growing food in small spaces"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m3-l5-5",
                "type": "choice",
                "text": "Who will speak?",
                "options": [
                  "the caretaker",
                  "Leila",
                  "the driver"
                ],
                "answers": [
                  "Leila"
                ],
                "explanation": "Conversation 3 states this clearly."
              },
              {
                "id": "m3-l5-6",
                "type": "choice",
                "text": "Why did the plan change?",
                "options": [
                  "the first seedlings received too little light",
                  "a lack of interest",
                  "a change in the weather forecast"
                ],
                "answers": [
                  "the first seedlings received too little light"
                ],
                "explanation": "Conversation 3 states this clearly."
              }
            ]
          },
          {
            "id": "listening-p6",
            "title": "Project lecture",
            "text": "Listen to the lecture and write one word or number for each answer.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-3-part-6.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-l6-1",
                "type": "text",
                "text": "What do the collected records form? Write ONE word or number.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "The lecture uses the word evidence."
              },
              {
                "id": "m3-l6-2",
                "type": "text",
                "text": "What is the total highlighted in the report? Write ONE word or number.",
                "options": [],
                "answers": [
                  "4"
                ],
                "explanation": "The lecture uses the word 4."
              },
              {
                "id": "m3-l6-3",
                "type": "text",
                "text": "Which word describes the key idea? Write ONE word or number.",
                "options": [],
                "answers": [
                  "sunlight"
                ],
                "explanation": "The lecture uses the word sunlight."
              },
              {
                "id": "m3-l6-4",
                "type": "text",
                "text": "What did the team ask visitors for? Write ONE word or number.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "The lecture uses the word feedback."
              },
              {
                "id": "m3-l6-5",
                "type": "text",
                "text": "What must be understood behind a result? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conditions"
                ],
                "explanation": "The lecture uses the word conditions."
              },
              {
                "id": "m3-l6-6",
                "type": "text",
                "text": "Which section contains the final interpretation? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conclusions"
                ],
                "explanation": "The lecture uses the word conclusions."
              }
            ]
          }
        ]
      },
      {
        "skill": "reading",
        "minutes": 60,
        "parts": [
          {
            "id": "reading-p1",
            "title": "One-word gaps",
            "text": "The school gardens project depended on (1) ____ who gave their time freely. At first, the team followed a fixed (2) ____, but the first seedlings received too little light. Careful (3) ____ showed exactly when the difficulty appeared. The organisers asked visitors for (4) ____ before changing the plan. They also wanted better (5) ____ for people who could not use the first arrangement. In the end, the strongest (6) ____ came from weekly notes from four classes. None of these observations proves that the same approach would work in every town. Nevertheless, the group learned why small, well-recorded changes can matter. Its next meeting will consider whether share seedlings with nearby schools is practical and who could help.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-r1-1",
                "type": "text",
                "text": "Complete gap 1 with ONE word.",
                "options": [],
                "answers": [
                  "volunteers"
                ],
                "explanation": "“volunteers” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m3-r1-2",
                "type": "text",
                "text": "Complete gap 2 with ONE word.",
                "options": [],
                "answers": [
                  "schedule"
                ],
                "explanation": "“schedule” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m3-r1-3",
                "type": "text",
                "text": "Complete gap 3 with ONE word.",
                "options": [],
                "answers": [
                  "records"
                ],
                "explanation": "“records” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m3-r1-4",
                "type": "text",
                "text": "Complete gap 4 with ONE word.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "“feedback” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m3-r1-5",
                "type": "text",
                "text": "Complete gap 5 with ONE word.",
                "options": [],
                "answers": [
                  "access"
                ],
                "explanation": "“access” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m3-r1-6",
                "type": "text",
                "text": "Complete gap 6 with ONE word.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "“evidence” makes the sentence grammatically and logically complete."
              }
            ]
          },
          {
            "id": "reading-p2",
            "title": "Notices and needs",
            "text": "A. Guided introduction: meet Leila at Willow School on Tuesday.\nB. Quiet hour: a smaller group meets before the main session.\nC. Access help: ask about step-free rooms and larger-print information.\nD. Skills desk: volunteers demonstrate practical methods and tools.\nE. Family visit: activities are planned for adults and children together.\nF. Research corner: examine the report and ask how information was collected.\nG. Follow-up team: help organise share seedlings with nearby schools.\nH. Short briefing: Leila gives a twenty-minute overview.\nI. Merchandise desk: souvenirs are available after the event.\nJ. Private room hire: businesses can book an unrelated meeting.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-r2-1",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants a guided introduction.",
                "options": [
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C"
                ],
                "answers": [
                  "A"
                ],
                "explanation": "Notice A offers exactly this service."
              },
              {
                "id": "m3-r2-2",
                "type": "choice",
                "text": "Which notice suits this person? Someone prefers a smaller, quieter group.",
                "options": [
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D"
                ],
                "answers": [
                  "B"
                ],
                "explanation": "Notice B offers exactly this service."
              },
              {
                "id": "m3-r2-3",
                "type": "choice",
                "text": "Which notice suits this person? A person needs access information.",
                "options": [
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E"
                ],
                "answers": [
                  "C"
                ],
                "explanation": "Notice C offers exactly this service."
              },
              {
                "id": "m3-r2-4",
                "type": "choice",
                "text": "Which notice suits this person? A learner wants a hands-on demonstration.",
                "options": [
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F"
                ],
                "answers": [
                  "D"
                ],
                "explanation": "Notice D offers exactly this service."
              },
              {
                "id": "m3-r2-5",
                "type": "choice",
                "text": "Which notice suits this person? A parent wants to bring a child.",
                "options": [
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G"
                ],
                "answers": [
                  "E"
                ],
                "explanation": "Notice E offers exactly this service."
              },
              {
                "id": "m3-r2-6",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants to inspect the evidence.",
                "options": [
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H"
                ],
                "answers": [
                  "F"
                ],
                "explanation": "Notice F offers exactly this service."
              },
              {
                "id": "m3-r2-7",
                "type": "choice",
                "text": "Which notice suits this person? A resident wants to help with the next event.",
                "options": [
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I"
                ],
                "answers": [
                  "G"
                ],
                "explanation": "Notice G offers exactly this service."
              },
              {
                "id": "m3-r2-8",
                "type": "choice",
                "text": "Which notice suits this person? Someone has only twenty minutes available.",
                "options": [
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J"
                ],
                "answers": [
                  "H"
                ],
                "explanation": "Notice H offers exactly this service."
              }
            ]
          },
          {
            "id": "reading-p3",
            "title": "Paragraph headings",
            "text": "Headings: A. The original difficulty | B. A practical adjustment | C. Collecting information | D. What the figures show | E. A reason for caution | F. The next question | G. A celebrity endorsement | H. An unrelated invention\n\nA. The idea behind school gardens began with growing food in small spaces. People welcomed the aim, but the first arrangement was less reliable than the team expected. In particular, the first seedlings received too little light. Several participants described this as a problem of planning rather than a reason to abandon the work. Their observations were recorded instead of being dismissed.\n\nB. The organisers compared a complicated solution with a manageable one. They chose to move the trays beside the south window. This did not remove every difficulty, yet it made the next session possible without asking volunteers to start again. Leila then explained the revised procedure to participants, including those who had missed the first announcement.\n\nC. Good intentions alone could not tell the team whether the change helped. They gathered weekly notes from four classes and kept notes about the conditions under which each observation was made. When a record was incomplete, they marked it as uncertain rather than filling in a likely answer. This made the report less dramatic but more useful.\n\nD. According to the team, most herbs recovered within three weeks. The figure attracted attention because it described an observable outcome, not merely a prediction. It also encouraged more residents to ask how they could take part. However, a number by itself says little about the people or circumstances behind it.\n\nE. The report acknowledges that the project did not measure soil quality. A different location, season or group of participants might produce a different result. The team therefore resisted a claim that its method was universally successful. This careful interpretation helped readers separate the evidence from the organisers' hopes.\n\nF. The final recommendation was to share seedlings with nearby schools. Before doing so, the organisers want to agree on clear measures of success and an accessible way to collect comments. They also plan to compare rainwater collection with decorative paving rather than assuming one choice will be best for every participant.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-r3-1",
                "type": "choice",
                "text": "Choose a heading for paragraph A.",
                "options": [
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information"
                ],
                "answers": [
                  "The original difficulty"
                ],
                "explanation": "Paragraph A develops the idea “the original difficulty”."
              },
              {
                "id": "m3-r3-2",
                "type": "choice",
                "text": "Choose a heading for paragraph B.",
                "options": [
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show"
                ],
                "answers": [
                  "A practical adjustment"
                ],
                "explanation": "Paragraph B develops the idea “a practical adjustment”."
              },
              {
                "id": "m3-r3-3",
                "type": "choice",
                "text": "Choose a heading for paragraph C.",
                "options": [
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution"
                ],
                "answers": [
                  "Collecting information"
                ],
                "explanation": "Paragraph C develops the idea “collecting information”."
              },
              {
                "id": "m3-r3-4",
                "type": "choice",
                "text": "Choose a heading for paragraph D.",
                "options": [
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question"
                ],
                "answers": [
                  "What the figures show"
                ],
                "explanation": "Paragraph D develops the idea “what the figures show”."
              },
              {
                "id": "m3-r3-5",
                "type": "choice",
                "text": "Choose a heading for paragraph E.",
                "options": [
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement"
                ],
                "answers": [
                  "A reason for caution"
                ],
                "explanation": "Paragraph E develops the idea “a reason for caution”."
              },
              {
                "id": "m3-r3-6",
                "type": "choice",
                "text": "Choose a heading for paragraph F.",
                "options": [
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention"
                ],
                "answers": [
                  "The next question"
                ],
                "explanation": "Paragraph F develops the idea “the next question”."
              }
            ]
          },
          {
            "id": "reading-p4",
            "title": "Detailed article",
            "text": "An invitation to take part in school gardens appeared at Willow School. Its stated aim was growing food in small spaces. The first public meeting was held on Tuesday, and Leila collected the comments. Early reports suggested enthusiasm, but the team also heard practical concerns. Most notably, the first seedlings received too little light. It would have been easy to present this as a minor inconvenience. Instead, the organisers documented it and chose to move the trays beside the south window.\n\nThe revised activity did not follow exactly the original schedule. The organisers tested the change, recorded weekly notes from four classes, and compared comments made before and after the adjustment. Their report states that most herbs recovered within three weeks. The authors are careful to explain the difference between an observation and a prediction: a positive first month does not guarantee a positive first year.\n\nTwo alternatives were discussed. Some participants supported rainwater collection; others preferred decorative paving. Neither option was dismissed without consideration. The report ultimately recommended a limited further trial rather than an immediate permanent decision. Its main reservation was that the project did not measure soil quality. Leila said that the next stage would be to share seedlings with nearby schools.\n\nThe report does not give the ages of the visitors, the exact amount of any future grant, or a date for publishing a second edition. Those details may matter later, but a reader should not invent them now. The value of the project lies partly in its willingness to say what remains unknown.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-r4-1",
                "type": "choice",
                "text": "What was the stated aim of the project?",
                "options": [
                  "to close the venue",
                  "growing food in small spaces",
                  "to sell souvenirs",
                  "to replace public transport"
                ],
                "answers": [
                  "growing food in small spaces"
                ],
                "explanation": "The opening paragraph states the aim."
              },
              {
                "id": "m3-r4-2",
                "type": "choice",
                "text": "What led the organisers to revise the activity?",
                "options": [
                  "the first seedlings received too little light",
                  "a new mayor",
                  "a cancelled newspaper",
                  "a competition prize"
                ],
                "answers": [
                  "the first seedlings received too little light"
                ],
                "explanation": "The reported problem led directly to the adjustment."
              },
              {
                "id": "m3-r4-3",
                "type": "choice",
                "text": "Which action did the organisers take?",
                "options": [
                  "stop collecting comments",
                  "claim guaranteed success",
                  "ignore accessibility",
                  "move the trays beside the south window"
                ],
                "answers": [
                  "move the trays beside the south window"
                ],
                "explanation": "The revised action is explicitly described."
              },
              {
                "id": "m3-r4-4",
                "type": "choice",
                "text": "How do the authors treat the positive early result?",
                "options": [
                  "As an error to hide",
                  "As irrelevant to the project",
                  "As useful but limited evidence",
                  "As proof for every community"
                ],
                "answers": [
                  "As useful but limited evidence"
                ],
                "explanation": "The text distinguishes observation from prediction."
              },
              {
                "id": "m3-r4-5",
                "type": "choice",
                "text": "True / False / Not Given: The team recorded information during the revised activity.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The second paragraph says the team recorded evidence."
              },
              {
                "id": "m3-r4-6",
                "type": "choice",
                "text": "True / False / Not Given: The organisers permanently rejected both alternatives.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "False"
                ],
                "explanation": "Both alternatives were considered; a further trial was recommended."
              },
              {
                "id": "m3-r4-7",
                "type": "choice",
                "text": "True / False / Not Given: Every visitor was younger than eighteen.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No ages are supplied."
              },
              {
                "id": "m3-r4-8",
                "type": "choice",
                "text": "True / False / Not Given: The report identifies a limitation of the trial.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The report acknowledges a limitation."
              },
              {
                "id": "m3-r4-9",
                "type": "choice",
                "text": "True / False / Not Given: A second edition will be published next month.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No date for a second edition is given."
              }
            ]
          },
          {
            "id": "reading-p5",
            "title": "Analysis and inference",
            "text": "The organisers at Willow School made a useful distinction between a change that is easy to announce and a change that can be evaluated. Their focus was growing food in small spaces. During the first stage, the first seedlings received too little light. The immediate response was to move the trays beside the south window, but the team did not describe this response as a complete solution.\n\nTo check what happened, they collected weekly notes from four classes. The report highlighted a figure of 4. A short account of the trial was sent to Leila, who asked for more information about the conditions in which it took place. In particular, the project did not measure soil quality. This mattered because an impressive number from a narrow trial can be misleading when removed from its context.\n\nAt the next meeting, participants will compare rainwater collection with decorative paving. They will also consider how to share seedlings with nearby schools. The discussion is designed to invite disagreement supported by reasons, not to reward the loudest speaker. If the group can repeat the trial and explain its limitations clearly, the result will be more useful to other communities.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-r5-1",
                "type": "text",
                "text": "Which venue hosted the organisers? Write ONE word from the venue name.",
                "options": [],
                "answers": [
                  "Willow"
                ],
                "explanation": "The venue starts with Willow."
              },
              {
                "id": "m3-r5-2",
                "type": "text",
                "text": "What figure did the report highlight? Write ONE number.",
                "options": [],
                "answers": [
                  "4"
                ],
                "explanation": "The figure given is 4."
              },
              {
                "id": "m3-r5-3",
                "type": "text",
                "text": "Who requested more information? Write ONE name.",
                "options": [],
                "answers": [
                  "Leila"
                ],
                "explanation": "The text names Leila."
              },
              {
                "id": "m3-r5-4",
                "type": "text",
                "text": "What can be misleading without context? Write ONE word.",
                "options": [],
                "answers": [
                  "number"
                ],
                "explanation": "The passage describes an impressive number from a narrow trial."
              },
              {
                "id": "m3-r5-5",
                "type": "choice",
                "text": "Why does the writer mention the limitation?",
                "options": [
                  "To hide the report",
                  "To prevent an overconfident conclusion",
                  "To argue that evidence is useless",
                  "To avoid hearing from participants"
                ],
                "answers": [
                  "To prevent an overconfident conclusion"
                ],
                "explanation": "The writer warns against removing the result from context."
              },
              {
                "id": "m3-r5-6",
                "type": "choice",
                "text": "What attitude does the final paragraph encourage?",
                "options": [
                  "Reasoned disagreement",
                  "Silence at meetings",
                  "Immediate approval of every idea",
                  "Competition for attention"
                ],
                "answers": [
                  "Reasoned disagreement"
                ],
                "explanation": "The group invites disagreement supported by reasons."
              }
            ]
          }
        ]
      },
      {
        "skill": "writing",
        "minutes": 60,
        "parts": [
          {
            "id": "writing-p1",
            "title": "Tasks 1.1, 1.2 and 2",
            "text": "Write all three responses. Your work is assessed by an administrator.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-w1",
                "type": "writing",
                "text": "You and a friend attended an activity about school gardens. Write an informal message to your friend. Explain what you enjoyed and suggest one thing to do next. Aim for about 50 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m3-w2",
                "type": "writing",
                "text": "Write to Leila, the organiser at Willow School. Explain why you attended, describe the difficulty (“the first seedlings received too little light”), and suggest a practical improvement. Use a suitable formal tone. Aim for about 120–150 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m3-w3",
                "type": "writing",
                "text": "Some people think communities should invest in rainwater collection; others prefer decorative paving. Discuss both views and explain which approach would better support growing food in small spaces. Give reasons and examples. Aim for about 180–220 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      },
      {
        "skill": "speaking",
        "minutes": 15,
        "parts": [
          {
            "id": "speaking-p1",
            "title": "Part 1.1 — personal questions",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-s1-1",
                "type": "speaking",
                "text": "What do you enjoy doing in your neighbourhood?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m3-s1-2",
                "type": "speaking",
                "text": "How do you usually learn about local events?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m3-s1-3",
                "type": "speaking",
                "text": "Have you ever visited a place like Willow School?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p2",
            "title": "Part 1.2 — compare two scenes",
            "text": "Scene A: a small group working together. Scene B: a large public presentation. Compare the two situations.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-s2-1",
                "type": "speaking",
                "text": "Compare a small group discussion at Willow School with a large public meeting. What might each be like?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m3-s2-2",
                "type": "speaking",
                "text": "Which setting would help people discuss school gardens more effectively, and why?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m3-s2-3",
                "type": "speaking",
                "text": "Would your preference change if you were presenting rather than listening?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p3",
            "title": "Part 2 — extended answer",
            "text": "Prepare for one minute; speak for about two minutes.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-s3-1",
                "type": "speaking",
                "text": "Discuss this issue: should communities prioritise rainwater collection or decorative paving? Give advantages, disadvantages and examples connected with growing food in small spaces.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p4",
            "title": "Part 3 — argument",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m3-s4-1",
                "type": "speaking",
                "text": "“A small successful trial is enough to justify a permanent public policy.” Discuss both sides of this claim. Refer to the limitation that the project did not measure soil quality.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Multilevel Mock 04 · Community radio",
    "description": "Original mashq varianti: community radio. 35 Listening, 35 Reading, 3 Writing va 8 Speaking topshirig‘i. Rasmiy test savollari emas.",
    "level": "B1–C1",
    "format": "multilevel",
    "rightsConfirmed": true,
    "seedKey": "sinfquiz-multilevel-4",
    "sections": [
      {
        "skill": "listening",
        "minutes": 45,
        "parts": [
          {
            "id": "listening-p1",
            "title": "Short announcements",
            "text": "Listen to eight short messages. Choose the best answer for each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-4-part-1.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-l1-1",
                "type": "choice",
                "text": "When does the meeting begin?",
                "options": [
                  "16:40",
                  "16:00",
                  "12:00"
                ],
                "answers": [
                  "16:40"
                ],
                "explanation": "The announcement says: The first message said 16:00, but the community radio meeting now starts at 16:40."
              },
              {
                "id": "m4-l1-2",
                "type": "choice",
                "text": "Where will people meet?",
                "options": [
                  "the town hall",
                  "the railway café",
                  "Harbour Studio"
                ],
                "answers": [
                  "Harbour Studio"
                ],
                "explanation": "The announcement says: We are meeting at Harbour Studio. Please do not wait at the old entrance."
              },
              {
                "id": "m4-l1-3",
                "type": "choice",
                "text": "What should visitors bring?",
                "options": [
                  "a camera",
                  "headphones",
                  "a printed ticket"
                ],
                "answers": [
                  "headphones"
                ],
                "explanation": "The announcement says: Before you leave home, remember to bring headphones. Other equipment is provided."
              },
              {
                "id": "m4-l1-4",
                "type": "choice",
                "text": "What is the last day to register?",
                "options": [
                  "Tuesday",
                  "the following weekend",
                  "the day after the event"
                ],
                "answers": [
                  "Tuesday"
                ],
                "explanation": "The announcement says: You can sign up until Tuesday. We cannot add names at the door."
              },
              {
                "id": "m4-l1-5",
                "type": "choice",
                "text": "How much is admission?",
                "options": [
                  "five pounds",
                  "ten pounds",
                  "free"
                ],
                "answers": [
                  "free"
                ],
                "explanation": "The announcement says: Admission is free. The amount covers the materials, and there is no extra charge."
              },
              {
                "id": "m4-l1-6",
                "type": "choice",
                "text": "Who can answer questions?",
                "options": [
                  "the driver",
                  "Farah",
                  "the caretaker"
                ],
                "answers": [
                  "Farah"
                ],
                "explanation": "The announcement says: If you have a question, ask for Farah at the information desk."
              },
              {
                "id": "m4-l1-7",
                "type": "choice",
                "text": "What did the team decide to do?",
                "options": [
                  "record interviews in a quieter room",
                  "cancel the entire project",
                  "ignore the difficulty"
                ],
                "answers": [
                  "record interviews in a quieter room"
                ],
                "explanation": "The announcement says: Because traffic noise spoiled the first recording, the team decided to record interviews in a quieter room."
              },
              {
                "id": "m4-l1-8",
                "type": "choice",
                "text": "What is the main purpose?",
                "options": [
                  "to sell more tickets",
                  "to replace every volunteer",
                  "local stories told by residents"
                ],
                "answers": [
                  "local stories told by residents"
                ],
                "explanation": "The announcement says: We are doing this to support local stories told by residents, not simply to advertise the event."
              }
            ]
          },
          {
            "id": "listening-p2",
            "title": "Briefing notes",
            "text": "Listen to the briefing. Complete the notes with one word or number.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-4-part-2.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-l2-1",
                "type": "text",
                "text": "Which day is the briefing held? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Wednesday"
                ],
                "explanation": "The briefing explicitly gives Wednesday."
              },
              {
                "id": "m4-l2-2",
                "type": "text",
                "text": "What time does the briefing start? Write ONE word or number.",
                "options": [],
                "answers": [
                  "16:40"
                ],
                "explanation": "The briefing explicitly gives 16:40."
              },
              {
                "id": "m4-l2-3",
                "type": "text",
                "text": "Who leads the first session? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Farah"
                ],
                "explanation": "The briefing explicitly gives Farah."
              },
              {
                "id": "m4-l2-4",
                "type": "text",
                "text": "What is the registration deadline? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Tuesday"
                ],
                "explanation": "The briefing explicitly gives Tuesday."
              },
              {
                "id": "m4-l2-5",
                "type": "text",
                "text": "How many entries were recorded? Write ONE word or number.",
                "options": [],
                "answers": [
                  "40"
                ],
                "explanation": "The briefing explicitly gives 40."
              },
              {
                "id": "m4-l2-6",
                "type": "text",
                "text": "Which word describes the main concern? Write ONE word or number.",
                "options": [],
                "answers": [
                  "soundproofing"
                ],
                "explanation": "The briefing explicitly gives soundproofing."
              }
            ]
          },
          {
            "id": "listening-p3",
            "title": "Four speakers",
            "text": "Match four speakers with the main ideas. Two options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-4-part-3.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-l3-1",
                "type": "choice",
                "text": "Match speaker 1 with the main idea.",
                "options": [
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage"
                ],
                "answers": [
                  "Personal motivation"
                ],
                "explanation": "Speaker 1 focuses on personal motivation."
              },
              {
                "id": "m4-l3-2",
                "type": "choice",
                "text": "Match speaker 2 with the main idea.",
                "options": [
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor"
                ],
                "answers": [
                  "Learning from a setback"
                ],
                "explanation": "Speaker 2 focuses on learning from a setback."
              },
              {
                "id": "m4-l3-3",
                "type": "choice",
                "text": "Match speaker 3 with the main idea.",
                "options": [
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project"
                ],
                "answers": [
                  "Cautious optimism about a result"
                ],
                "explanation": "Speaker 3 focuses on cautious optimism about a result."
              },
              {
                "id": "m4-l3-4",
                "type": "choice",
                "text": "Match speaker 4 with the main idea.",
                "options": [
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation"
                ],
                "answers": [
                  "Planning the next stage"
                ],
                "explanation": "Speaker 4 focuses on planning the next stage."
              }
            ]
          },
          {
            "id": "listening-p4",
            "title": "Responding to requests",
            "text": "Match each request to the response. Three options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-4-part-4.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-l4-1",
                "type": "choice",
                "text": "Which response was given to a visitor who cannot reach the upper floor?",
                "options": [
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation"
                ],
                "answers": [
                  "Move activities to an accessible room"
                ],
                "explanation": "The announcement connects this request with “move activities to an accessible room”."
              },
              {
                "id": "m4-l4-2",
                "type": "choice",
                "text": "Which response was given to a volunteer who needs to know the arrival time?",
                "options": [
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list"
                ],
                "answers": [
                  "Check the revised schedule"
                ],
                "explanation": "The announcement connects this request with “check the revised schedule”."
              },
              {
                "id": "m4-l4-3",
                "type": "choice",
                "text": "Which response was given to someone who wants the project to continue?",
                "options": [
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately"
                ],
                "answers": [
                  "Help plan a follow-up session"
                ],
                "explanation": "The announcement connects this request with “help plan a follow-up session”."
              },
              {
                "id": "m4-l4-4",
                "type": "choice",
                "text": "Which response was given to a researcher questioning the findings?",
                "options": [
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper"
                ],
                "answers": [
                  "Explain the sample limitation"
                ],
                "explanation": "The announcement connects this request with “explain the sample limitation”."
              },
              {
                "id": "m4-l4-5",
                "type": "choice",
                "text": "Which response was given to a participant with an item to bring?",
                "options": [
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers"
                ],
                "answers": [
                  "Read the equipment list"
                ],
                "explanation": "The announcement connects this request with “read the equipment list”."
              }
            ]
          },
          {
            "id": "listening-p5",
            "title": "Three conversations",
            "text": "Listen to three conversations. Answer two questions about each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-4-part-5.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-l5-1",
                "type": "choice",
                "text": "Why is the speaker cautious?",
                "options": [
                  "There was no trial.",
                  "The report was lost.",
                  "downloads do not reveal careful listening"
                ],
                "answers": [
                  "downloads do not reveal careful listening"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m4-l5-2",
                "type": "choice",
                "text": "What does the speaker recommend?",
                "options": [
                  "buying a larger room",
                  "another trial",
                  "closing the project"
                ],
                "answers": [
                  "another trial"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m4-l5-3",
                "type": "choice",
                "text": "Which option does the second speaker prefer?",
                "options": [
                  "neither option",
                  "short interviews",
                  "long scripted lectures"
                ],
                "answers": [
                  "short interviews"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m4-l5-4",
                "type": "choice",
                "text": "Why does the speaker prefer it?",
                "options": [
                  "local stories told by residents",
                  "it is the oldest option",
                  "it needs no volunteers"
                ],
                "answers": [
                  "local stories told by residents"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m4-l5-5",
                "type": "choice",
                "text": "Who will speak?",
                "options": [
                  "Farah",
                  "the driver",
                  "the caretaker"
                ],
                "answers": [
                  "Farah"
                ],
                "explanation": "Conversation 3 states this clearly."
              },
              {
                "id": "m4-l5-6",
                "type": "choice",
                "text": "Why did the plan change?",
                "options": [
                  "a lack of interest",
                  "a change in the weather forecast",
                  "traffic noise spoiled the first recording"
                ],
                "answers": [
                  "traffic noise spoiled the first recording"
                ],
                "explanation": "Conversation 3 states this clearly."
              }
            ]
          },
          {
            "id": "listening-p6",
            "title": "Project lecture",
            "text": "Listen to the lecture and write one word or number for each answer.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-4-part-6.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-l6-1",
                "type": "text",
                "text": "What do the collected records form? Write ONE word or number.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "The lecture uses the word evidence."
              },
              {
                "id": "m4-l6-2",
                "type": "text",
                "text": "What is the total highlighted in the report? Write ONE word or number.",
                "options": [],
                "answers": [
                  "40"
                ],
                "explanation": "The lecture uses the word 40."
              },
              {
                "id": "m4-l6-3",
                "type": "text",
                "text": "Which word describes the key idea? Write ONE word or number.",
                "options": [],
                "answers": [
                  "soundproofing"
                ],
                "explanation": "The lecture uses the word soundproofing."
              },
              {
                "id": "m4-l6-4",
                "type": "text",
                "text": "What did the team ask visitors for? Write ONE word or number.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "The lecture uses the word feedback."
              },
              {
                "id": "m4-l6-5",
                "type": "text",
                "text": "What must be understood behind a result? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conditions"
                ],
                "explanation": "The lecture uses the word conditions."
              },
              {
                "id": "m4-l6-6",
                "type": "text",
                "text": "Which section contains the final interpretation? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conclusions"
                ],
                "explanation": "The lecture uses the word conclusions."
              }
            ]
          }
        ]
      },
      {
        "skill": "reading",
        "minutes": 60,
        "parts": [
          {
            "id": "reading-p1",
            "title": "One-word gaps",
            "text": "The community radio project depended on (1) ____ who gave their time freely. At first, the team followed a fixed (2) ____, but traffic noise spoiled the first recording. Careful (3) ____ showed exactly when the difficulty appeared. The organisers asked visitors for (4) ____ before changing the plan. They also wanted better (5) ____ for people who could not use the first arrangement. In the end, the strongest (6) ____ came from listener messages over six weeks. None of these observations proves that the same approach would work in every town. Nevertheless, the group learned why small, well-recorded changes can matter. Its next meeting will consider whether invite speakers from more age groups is practical and who could help.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-r1-1",
                "type": "text",
                "text": "Complete gap 1 with ONE word.",
                "options": [],
                "answers": [
                  "volunteers"
                ],
                "explanation": "“volunteers” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m4-r1-2",
                "type": "text",
                "text": "Complete gap 2 with ONE word.",
                "options": [],
                "answers": [
                  "schedule"
                ],
                "explanation": "“schedule” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m4-r1-3",
                "type": "text",
                "text": "Complete gap 3 with ONE word.",
                "options": [],
                "answers": [
                  "records"
                ],
                "explanation": "“records” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m4-r1-4",
                "type": "text",
                "text": "Complete gap 4 with ONE word.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "“feedback” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m4-r1-5",
                "type": "text",
                "text": "Complete gap 5 with ONE word.",
                "options": [],
                "answers": [
                  "access"
                ],
                "explanation": "“access” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m4-r1-6",
                "type": "text",
                "text": "Complete gap 6 with ONE word.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "“evidence” makes the sentence grammatically and logically complete."
              }
            ]
          },
          {
            "id": "reading-p2",
            "title": "Notices and needs",
            "text": "A. Guided introduction: meet Farah at Harbour Studio on Wednesday.\nB. Quiet hour: a smaller group meets before the main session.\nC. Access help: ask about step-free rooms and larger-print information.\nD. Skills desk: volunteers demonstrate practical methods and tools.\nE. Family visit: activities are planned for adults and children together.\nF. Research corner: examine the report and ask how information was collected.\nG. Follow-up team: help organise invite speakers from more age groups.\nH. Short briefing: Farah gives a twenty-minute overview.\nI. Merchandise desk: souvenirs are available after the event.\nJ. Private room hire: businesses can book an unrelated meeting.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-r2-1",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants a guided introduction.",
                "options": [
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D"
                ],
                "answers": [
                  "A"
                ],
                "explanation": "Notice A offers exactly this service."
              },
              {
                "id": "m4-r2-2",
                "type": "choice",
                "text": "Which notice suits this person? Someone prefers a smaller, quieter group.",
                "options": [
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E"
                ],
                "answers": [
                  "B"
                ],
                "explanation": "Notice B offers exactly this service."
              },
              {
                "id": "m4-r2-3",
                "type": "choice",
                "text": "Which notice suits this person? A person needs access information.",
                "options": [
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F"
                ],
                "answers": [
                  "C"
                ],
                "explanation": "Notice C offers exactly this service."
              },
              {
                "id": "m4-r2-4",
                "type": "choice",
                "text": "Which notice suits this person? A learner wants a hands-on demonstration.",
                "options": [
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G"
                ],
                "answers": [
                  "D"
                ],
                "explanation": "Notice D offers exactly this service."
              },
              {
                "id": "m4-r2-5",
                "type": "choice",
                "text": "Which notice suits this person? A parent wants to bring a child.",
                "options": [
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H"
                ],
                "answers": [
                  "E"
                ],
                "explanation": "Notice E offers exactly this service."
              },
              {
                "id": "m4-r2-6",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants to inspect the evidence.",
                "options": [
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I"
                ],
                "answers": [
                  "F"
                ],
                "explanation": "Notice F offers exactly this service."
              },
              {
                "id": "m4-r2-7",
                "type": "choice",
                "text": "Which notice suits this person? A resident wants to help with the next event.",
                "options": [
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J"
                ],
                "answers": [
                  "G"
                ],
                "explanation": "Notice G offers exactly this service."
              },
              {
                "id": "m4-r2-8",
                "type": "choice",
                "text": "Which notice suits this person? Someone has only twenty minutes available.",
                "options": [
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A"
                ],
                "answers": [
                  "H"
                ],
                "explanation": "Notice H offers exactly this service."
              }
            ]
          },
          {
            "id": "reading-p3",
            "title": "Paragraph headings",
            "text": "Headings: A. The original difficulty | B. A practical adjustment | C. Collecting information | D. What the figures show | E. A reason for caution | F. The next question | G. A celebrity endorsement | H. An unrelated invention\n\nA. The idea behind community radio began with local stories told by residents. People welcomed the aim, but the first arrangement was less reliable than the team expected. In particular, traffic noise spoiled the first recording. Several participants described this as a problem of planning rather than a reason to abandon the work. Their observations were recorded instead of being dismissed.\n\nB. The organisers compared a complicated solution with a manageable one. They chose to record interviews in a quieter room. This did not remove every difficulty, yet it made the next session possible without asking volunteers to start again. Farah then explained the revised procedure to participants, including those who had missed the first announcement.\n\nC. Good intentions alone could not tell the team whether the change helped. They gathered listener messages over six weeks and kept notes about the conditions under which each observation was made. When a record was incomplete, they marked it as uncertain rather than filling in a likely answer. This made the report less dramatic but more useful.\n\nD. According to the team, the next episode gained forty new listeners. The figure attracted attention because it described an observable outcome, not merely a prediction. It also encouraged more residents to ask how they could take part. However, a number by itself says little about the people or circumstances behind it.\n\nE. The report acknowledges that downloads do not reveal careful listening. A different location, season or group of participants might produce a different result. The team therefore resisted a claim that its method was universally successful. This careful interpretation helped readers separate the evidence from the organisers' hopes.\n\nF. The final recommendation was to invite speakers from more age groups. Before doing so, the organisers want to agree on clear measures of success and an accessible way to collect comments. They also plan to compare short interviews with long scripted lectures rather than assuming one choice will be best for every participant.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-r3-1",
                "type": "choice",
                "text": "Choose a heading for paragraph A.",
                "options": [
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show"
                ],
                "answers": [
                  "The original difficulty"
                ],
                "explanation": "Paragraph A develops the idea “the original difficulty”."
              },
              {
                "id": "m4-r3-2",
                "type": "choice",
                "text": "Choose a heading for paragraph B.",
                "options": [
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution"
                ],
                "answers": [
                  "A practical adjustment"
                ],
                "explanation": "Paragraph B develops the idea “a practical adjustment”."
              },
              {
                "id": "m4-r3-3",
                "type": "choice",
                "text": "Choose a heading for paragraph C.",
                "options": [
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question"
                ],
                "answers": [
                  "Collecting information"
                ],
                "explanation": "Paragraph C develops the idea “collecting information”."
              },
              {
                "id": "m4-r3-4",
                "type": "choice",
                "text": "Choose a heading for paragraph D.",
                "options": [
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement"
                ],
                "answers": [
                  "What the figures show"
                ],
                "explanation": "Paragraph D develops the idea “what the figures show”."
              },
              {
                "id": "m4-r3-5",
                "type": "choice",
                "text": "Choose a heading for paragraph E.",
                "options": [
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention"
                ],
                "answers": [
                  "A reason for caution"
                ],
                "explanation": "Paragraph E develops the idea “a reason for caution”."
              },
              {
                "id": "m4-r3-6",
                "type": "choice",
                "text": "Choose a heading for paragraph F.",
                "options": [
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty"
                ],
                "answers": [
                  "The next question"
                ],
                "explanation": "Paragraph F develops the idea “the next question”."
              }
            ]
          },
          {
            "id": "reading-p4",
            "title": "Detailed article",
            "text": "An invitation to take part in community radio appeared at Harbour Studio. Its stated aim was local stories told by residents. The first public meeting was held on Wednesday, and Farah collected the comments. Early reports suggested enthusiasm, but the team also heard practical concerns. Most notably, traffic noise spoiled the first recording. It would have been easy to present this as a minor inconvenience. Instead, the organisers documented it and chose to record interviews in a quieter room.\n\nThe revised activity did not follow exactly the original schedule. The organisers tested the change, recorded listener messages over six weeks, and compared comments made before and after the adjustment. Their report states that the next episode gained forty new listeners. The authors are careful to explain the difference between an observation and a prediction: a positive first month does not guarantee a positive first year.\n\nTwo alternatives were discussed. Some participants supported short interviews; others preferred long scripted lectures. Neither option was dismissed without consideration. The report ultimately recommended a limited further trial rather than an immediate permanent decision. Its main reservation was that downloads do not reveal careful listening. Farah said that the next stage would be to invite speakers from more age groups.\n\nThe report does not give the ages of the visitors, the exact amount of any future grant, or a date for publishing a second edition. Those details may matter later, but a reader should not invent them now. The value of the project lies partly in its willingness to say what remains unknown.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-r4-1",
                "type": "choice",
                "text": "What was the stated aim of the project?",
                "options": [
                  "local stories told by residents",
                  "to sell souvenirs",
                  "to replace public transport",
                  "to close the venue"
                ],
                "answers": [
                  "local stories told by residents"
                ],
                "explanation": "The opening paragraph states the aim."
              },
              {
                "id": "m4-r4-2",
                "type": "choice",
                "text": "What led the organisers to revise the activity?",
                "options": [
                  "a new mayor",
                  "a cancelled newspaper",
                  "a competition prize",
                  "traffic noise spoiled the first recording"
                ],
                "answers": [
                  "traffic noise spoiled the first recording"
                ],
                "explanation": "The reported problem led directly to the adjustment."
              },
              {
                "id": "m4-r4-3",
                "type": "choice",
                "text": "Which action did the organisers take?",
                "options": [
                  "claim guaranteed success",
                  "ignore accessibility",
                  "record interviews in a quieter room",
                  "stop collecting comments"
                ],
                "answers": [
                  "record interviews in a quieter room"
                ],
                "explanation": "The revised action is explicitly described."
              },
              {
                "id": "m4-r4-4",
                "type": "choice",
                "text": "How do the authors treat the positive early result?",
                "options": [
                  "As irrelevant to the project",
                  "As useful but limited evidence",
                  "As proof for every community",
                  "As an error to hide"
                ],
                "answers": [
                  "As useful but limited evidence"
                ],
                "explanation": "The text distinguishes observation from prediction."
              },
              {
                "id": "m4-r4-5",
                "type": "choice",
                "text": "True / False / Not Given: The team recorded information during the revised activity.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The second paragraph says the team recorded evidence."
              },
              {
                "id": "m4-r4-6",
                "type": "choice",
                "text": "True / False / Not Given: The organisers permanently rejected both alternatives.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "False"
                ],
                "explanation": "Both alternatives were considered; a further trial was recommended."
              },
              {
                "id": "m4-r4-7",
                "type": "choice",
                "text": "True / False / Not Given: Every visitor was younger than eighteen.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No ages are supplied."
              },
              {
                "id": "m4-r4-8",
                "type": "choice",
                "text": "True / False / Not Given: The report identifies a limitation of the trial.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The report acknowledges a limitation."
              },
              {
                "id": "m4-r4-9",
                "type": "choice",
                "text": "True / False / Not Given: A second edition will be published next month.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No date for a second edition is given."
              }
            ]
          },
          {
            "id": "reading-p5",
            "title": "Analysis and inference",
            "text": "The organisers at Harbour Studio made a useful distinction between a change that is easy to announce and a change that can be evaluated. Their focus was local stories told by residents. During the first stage, traffic noise spoiled the first recording. The immediate response was to record interviews in a quieter room, but the team did not describe this response as a complete solution.\n\nTo check what happened, they collected listener messages over six weeks. The report highlighted a figure of 40. A short account of the trial was sent to Farah, who asked for more information about the conditions in which it took place. In particular, downloads do not reveal careful listening. This mattered because an impressive number from a narrow trial can be misleading when removed from its context.\n\nAt the next meeting, participants will compare short interviews with long scripted lectures. They will also consider how to invite speakers from more age groups. The discussion is designed to invite disagreement supported by reasons, not to reward the loudest speaker. If the group can repeat the trial and explain its limitations clearly, the result will be more useful to other communities.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-r5-1",
                "type": "text",
                "text": "Which venue hosted the organisers? Write ONE word from the venue name.",
                "options": [],
                "answers": [
                  "Harbour"
                ],
                "explanation": "The venue starts with Harbour."
              },
              {
                "id": "m4-r5-2",
                "type": "text",
                "text": "What figure did the report highlight? Write ONE number.",
                "options": [],
                "answers": [
                  "40"
                ],
                "explanation": "The figure given is 40."
              },
              {
                "id": "m4-r5-3",
                "type": "text",
                "text": "Who requested more information? Write ONE name.",
                "options": [],
                "answers": [
                  "Farah"
                ],
                "explanation": "The text names Farah."
              },
              {
                "id": "m4-r5-4",
                "type": "text",
                "text": "What can be misleading without context? Write ONE word.",
                "options": [],
                "answers": [
                  "number"
                ],
                "explanation": "The passage describes an impressive number from a narrow trial."
              },
              {
                "id": "m4-r5-5",
                "type": "choice",
                "text": "Why does the writer mention the limitation?",
                "options": [
                  "To prevent an overconfident conclusion",
                  "To argue that evidence is useless",
                  "To avoid hearing from participants",
                  "To hide the report"
                ],
                "answers": [
                  "To prevent an overconfident conclusion"
                ],
                "explanation": "The writer warns against removing the result from context."
              },
              {
                "id": "m4-r5-6",
                "type": "choice",
                "text": "What attitude does the final paragraph encourage?",
                "options": [
                  "Silence at meetings",
                  "Immediate approval of every idea",
                  "Competition for attention",
                  "Reasoned disagreement"
                ],
                "answers": [
                  "Reasoned disagreement"
                ],
                "explanation": "The group invites disagreement supported by reasons."
              }
            ]
          }
        ]
      },
      {
        "skill": "writing",
        "minutes": 60,
        "parts": [
          {
            "id": "writing-p1",
            "title": "Tasks 1.1, 1.2 and 2",
            "text": "Write all three responses. Your work is assessed by an administrator.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-w1",
                "type": "writing",
                "text": "You and a friend attended an activity about community radio. Write an informal message to your friend. Explain what you enjoyed and suggest one thing to do next. Aim for about 50 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m4-w2",
                "type": "writing",
                "text": "Write to Farah, the organiser at Harbour Studio. Explain why you attended, describe the difficulty (“traffic noise spoiled the first recording”), and suggest a practical improvement. Use a suitable formal tone. Aim for about 120–150 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m4-w3",
                "type": "writing",
                "text": "Some people think communities should invest in short interviews; others prefer long scripted lectures. Discuss both views and explain which approach would better support local stories told by residents. Give reasons and examples. Aim for about 180–220 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      },
      {
        "skill": "speaking",
        "minutes": 15,
        "parts": [
          {
            "id": "speaking-p1",
            "title": "Part 1.1 — personal questions",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-s1-1",
                "type": "speaking",
                "text": "What do you enjoy doing in your neighbourhood?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m4-s1-2",
                "type": "speaking",
                "text": "How do you usually learn about local events?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m4-s1-3",
                "type": "speaking",
                "text": "Have you ever visited a place like Harbour Studio?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p2",
            "title": "Part 1.2 — compare two scenes",
            "text": "Scene A: a small group working together. Scene B: a large public presentation. Compare the two situations.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-s2-1",
                "type": "speaking",
                "text": "Compare a small group discussion at Harbour Studio with a large public meeting. What might each be like?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m4-s2-2",
                "type": "speaking",
                "text": "Which setting would help people discuss community radio more effectively, and why?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m4-s2-3",
                "type": "speaking",
                "text": "Would your preference change if you were presenting rather than listening?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p3",
            "title": "Part 2 — extended answer",
            "text": "Prepare for one minute; speak for about two minutes.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-s3-1",
                "type": "speaking",
                "text": "Discuss this issue: should communities prioritise short interviews or long scripted lectures? Give advantages, disadvantages and examples connected with local stories told by residents.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p4",
            "title": "Part 3 — argument",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m4-s4-1",
                "type": "speaking",
                "text": "“A small successful trial is enough to justify a permanent public policy.” Discuss both sides of this claim. Refer to the limitation that downloads do not reveal careful listening.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Multilevel Mock 05 · Museum access",
    "description": "Original mashq varianti: museum access. 35 Listening, 35 Reading, 3 Writing va 8 Speaking topshirig‘i. Rasmiy test savollari emas.",
    "level": "B1–C1",
    "format": "multilevel",
    "rightsConfirmed": true,
    "seedKey": "sinfquiz-multilevel-5",
    "sections": [
      {
        "skill": "listening",
        "minutes": 45,
        "parts": [
          {
            "id": "listening-p1",
            "title": "Short announcements",
            "text": "Listen to eight short messages. Choose the best answer for each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-5-part-1.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-l1-1",
                "type": "choice",
                "text": "When does the meeting begin?",
                "options": [
                  "11:10",
                  "10:30",
                  "12:00"
                ],
                "answers": [
                  "11:10"
                ],
                "explanation": "The announcement says: The first message said 10:30, but the museum access meeting now starts at 11:10."
              },
              {
                "id": "m5-l1-2",
                "type": "choice",
                "text": "Where will people meet?",
                "options": [
                  "the town hall",
                  "the railway café",
                  "Old Mill Museum"
                ],
                "answers": [
                  "Old Mill Museum"
                ],
                "explanation": "The announcement says: We are meeting at Old Mill Museum. Please do not wait at the old entrance."
              },
              {
                "id": "m5-l1-3",
                "type": "choice",
                "text": "What should visitors bring?",
                "options": [
                  "a camera",
                  "a reusable water bottle",
                  "a printed ticket"
                ],
                "answers": [
                  "a reusable water bottle"
                ],
                "explanation": "The announcement says: Before you leave home, remember to bring a reusable water bottle. Other equipment is provided."
              },
              {
                "id": "m5-l1-4",
                "type": "choice",
                "text": "What is the last day to register?",
                "options": [
                  "Saturday",
                  "the following weekend",
                  "the day after the event"
                ],
                "answers": [
                  "Saturday"
                ],
                "explanation": "The announcement says: You can sign up until Saturday. We cannot add names at the door."
              },
              {
                "id": "m5-l1-5",
                "type": "choice",
                "text": "How much is admission?",
                "options": [
                  "five pounds",
                  "ten pounds",
                  "three pounds"
                ],
                "answers": [
                  "three pounds"
                ],
                "explanation": "The announcement says: Admission is three pounds. The amount covers the materials, and there is no extra charge."
              },
              {
                "id": "m5-l1-6",
                "type": "choice",
                "text": "Who can answer questions?",
                "options": [
                  "the driver",
                  "Hassan",
                  "the caretaker"
                ],
                "answers": [
                  "Hassan"
                ],
                "explanation": "The announcement says: If you have a question, ask for Hassan at the information desk."
              },
              {
                "id": "m5-l1-7",
                "type": "choice",
                "text": "What did the team decide to do?",
                "options": [
                  "offer large-print guides",
                  "cancel the entire project",
                  "ignore the difficulty"
                ],
                "answers": [
                  "offer large-print guides"
                ],
                "explanation": "The announcement says: Because visitors missed labels printed in small type, the team decided to offer large-print guides."
              },
              {
                "id": "m5-l1-8",
                "type": "choice",
                "text": "What is the main purpose?",
                "options": [
                  "to sell more tickets",
                  "to replace every volunteer",
                  "making local history easier to explore"
                ],
                "answers": [
                  "making local history easier to explore"
                ],
                "explanation": "The announcement says: We are doing this to support making local history easier to explore, not simply to advertise the event."
              }
            ]
          },
          {
            "id": "listening-p2",
            "title": "Briefing notes",
            "text": "Listen to the briefing. Complete the notes with one word or number.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-5-part-2.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-l2-1",
                "type": "text",
                "text": "Which day is the briefing held? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Sunday"
                ],
                "explanation": "The briefing explicitly gives Sunday."
              },
              {
                "id": "m5-l2-2",
                "type": "text",
                "text": "What time does the briefing start? Write ONE word or number.",
                "options": [],
                "answers": [
                  "11:10"
                ],
                "explanation": "The briefing explicitly gives 11:10."
              },
              {
                "id": "m5-l2-3",
                "type": "text",
                "text": "Who leads the first session? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Hassan"
                ],
                "explanation": "The briefing explicitly gives Hassan."
              },
              {
                "id": "m5-l2-4",
                "type": "text",
                "text": "What is the registration deadline? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Saturday"
                ],
                "explanation": "The briefing explicitly gives Saturday."
              },
              {
                "id": "m5-l2-5",
                "type": "text",
                "text": "How many entries were recorded? Write ONE word or number.",
                "options": [],
                "answers": [
                  "15"
                ],
                "explanation": "The briefing explicitly gives 15."
              },
              {
                "id": "m5-l2-6",
                "type": "text",
                "text": "Which word describes the main concern? Write ONE word or number.",
                "options": [],
                "answers": [
                  "legibility"
                ],
                "explanation": "The briefing explicitly gives legibility."
              }
            ]
          },
          {
            "id": "listening-p3",
            "title": "Four speakers",
            "text": "Match four speakers with the main ideas. Two options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-5-part-3.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-l3-1",
                "type": "choice",
                "text": "Match speaker 1 with the main idea.",
                "options": [
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor"
                ],
                "answers": [
                  "Personal motivation"
                ],
                "explanation": "Speaker 1 focuses on personal motivation."
              },
              {
                "id": "m5-l3-2",
                "type": "choice",
                "text": "Match speaker 2 with the main idea.",
                "options": [
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project"
                ],
                "answers": [
                  "Learning from a setback"
                ],
                "explanation": "Speaker 2 focuses on learning from a setback."
              },
              {
                "id": "m5-l3-3",
                "type": "choice",
                "text": "Match speaker 3 with the main idea.",
                "options": [
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation"
                ],
                "answers": [
                  "Cautious optimism about a result"
                ],
                "explanation": "Speaker 3 focuses on cautious optimism about a result."
              },
              {
                "id": "m5-l3-4",
                "type": "choice",
                "text": "Match speaker 4 with the main idea.",
                "options": [
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback"
                ],
                "answers": [
                  "Planning the next stage"
                ],
                "explanation": "Speaker 4 focuses on planning the next stage."
              }
            ]
          },
          {
            "id": "listening-p4",
            "title": "Responding to requests",
            "text": "Match each request to the response. Three options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-5-part-4.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-l4-1",
                "type": "choice",
                "text": "Which response was given to a visitor who cannot reach the upper floor?",
                "options": [
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list"
                ],
                "answers": [
                  "Move activities to an accessible room"
                ],
                "explanation": "The announcement connects this request with “move activities to an accessible room”."
              },
              {
                "id": "m5-l4-2",
                "type": "choice",
                "text": "Which response was given to a volunteer who needs to know the arrival time?",
                "options": [
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately"
                ],
                "answers": [
                  "Check the revised schedule"
                ],
                "explanation": "The announcement connects this request with “check the revised schedule”."
              },
              {
                "id": "m5-l4-3",
                "type": "choice",
                "text": "Which response was given to someone who wants the project to continue?",
                "options": [
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper"
                ],
                "answers": [
                  "Help plan a follow-up session"
                ],
                "explanation": "The announcement connects this request with “help plan a follow-up session”."
              },
              {
                "id": "m5-l4-4",
                "type": "choice",
                "text": "Which response was given to a researcher questioning the findings?",
                "options": [
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers"
                ],
                "answers": [
                  "Explain the sample limitation"
                ],
                "explanation": "The announcement connects this request with “explain the sample limitation”."
              },
              {
                "id": "m5-l4-5",
                "type": "choice",
                "text": "Which response was given to a participant with an item to bring?",
                "options": [
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room"
                ],
                "answers": [
                  "Read the equipment list"
                ],
                "explanation": "The announcement connects this request with “read the equipment list”."
              }
            ]
          },
          {
            "id": "listening-p5",
            "title": "Three conversations",
            "text": "Listen to three conversations. Answer two questions about each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-5-part-5.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-l5-1",
                "type": "choice",
                "text": "Why is the speaker cautious?",
                "options": [
                  "The report was lost.",
                  "the museum did not interview every visitor",
                  "There was no trial."
                ],
                "answers": [
                  "the museum did not interview every visitor"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m5-l5-2",
                "type": "choice",
                "text": "What does the speaker recommend?",
                "options": [
                  "another trial",
                  "closing the project",
                  "buying a larger room"
                ],
                "answers": [
                  "another trial"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m5-l5-3",
                "type": "choice",
                "text": "Which option does the second speaker prefer?",
                "options": [
                  "audio descriptions",
                  "an extra souvenir counter",
                  "neither option"
                ],
                "answers": [
                  "audio descriptions"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m5-l5-4",
                "type": "choice",
                "text": "Why does the speaker prefer it?",
                "options": [
                  "it is the oldest option",
                  "it needs no volunteers",
                  "making local history easier to explore"
                ],
                "answers": [
                  "making local history easier to explore"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m5-l5-5",
                "type": "choice",
                "text": "Who will speak?",
                "options": [
                  "the driver",
                  "the caretaker",
                  "Hassan"
                ],
                "answers": [
                  "Hassan"
                ],
                "explanation": "Conversation 3 states this clearly."
              },
              {
                "id": "m5-l5-6",
                "type": "choice",
                "text": "Why did the plan change?",
                "options": [
                  "a change in the weather forecast",
                  "visitors missed labels printed in small type",
                  "a lack of interest"
                ],
                "answers": [
                  "visitors missed labels printed in small type"
                ],
                "explanation": "Conversation 3 states this clearly."
              }
            ]
          },
          {
            "id": "listening-p6",
            "title": "Project lecture",
            "text": "Listen to the lecture and write one word or number for each answer.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-5-part-6.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-l6-1",
                "type": "text",
                "text": "What do the collected records form? Write ONE word or number.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "The lecture uses the word evidence."
              },
              {
                "id": "m5-l6-2",
                "type": "text",
                "text": "What is the total highlighted in the report? Write ONE word or number.",
                "options": [],
                "answers": [
                  "15"
                ],
                "explanation": "The lecture uses the word 15."
              },
              {
                "id": "m5-l6-3",
                "type": "text",
                "text": "Which word describes the key idea? Write ONE word or number.",
                "options": [],
                "answers": [
                  "legibility"
                ],
                "explanation": "The lecture uses the word legibility."
              },
              {
                "id": "m5-l6-4",
                "type": "text",
                "text": "What did the team ask visitors for? Write ONE word or number.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "The lecture uses the word feedback."
              },
              {
                "id": "m5-l6-5",
                "type": "text",
                "text": "What must be understood behind a result? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conditions"
                ],
                "explanation": "The lecture uses the word conditions."
              },
              {
                "id": "m5-l6-6",
                "type": "text",
                "text": "Which section contains the final interpretation? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conclusions"
                ],
                "explanation": "The lecture uses the word conclusions."
              }
            ]
          }
        ]
      },
      {
        "skill": "reading",
        "minutes": 60,
        "parts": [
          {
            "id": "reading-p1",
            "title": "One-word gaps",
            "text": "The museum access project depended on (1) ____ who gave their time freely. At first, the team followed a fixed (2) ____, but visitors missed labels printed in small type. Careful (3) ____ showed exactly when the difficulty appeared. The organisers asked visitors for (4) ____ before changing the plan. They also wanted better (5) ____ for people who could not use the first arrangement. In the end, the strongest (6) ____ came from observations during three weekend tours. None of these observations proves that the same approach would work in every town. Nevertheless, the group learned why small, well-recorded changes can matter. Its next meeting will consider whether translate guides into more languages is practical and who could help.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-r1-1",
                "type": "text",
                "text": "Complete gap 1 with ONE word.",
                "options": [],
                "answers": [
                  "volunteers"
                ],
                "explanation": "“volunteers” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m5-r1-2",
                "type": "text",
                "text": "Complete gap 2 with ONE word.",
                "options": [],
                "answers": [
                  "schedule"
                ],
                "explanation": "“schedule” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m5-r1-3",
                "type": "text",
                "text": "Complete gap 3 with ONE word.",
                "options": [],
                "answers": [
                  "records"
                ],
                "explanation": "“records” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m5-r1-4",
                "type": "text",
                "text": "Complete gap 4 with ONE word.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "“feedback” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m5-r1-5",
                "type": "text",
                "text": "Complete gap 5 with ONE word.",
                "options": [],
                "answers": [
                  "access"
                ],
                "explanation": "“access” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m5-r1-6",
                "type": "text",
                "text": "Complete gap 6 with ONE word.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "“evidence” makes the sentence grammatically and logically complete."
              }
            ]
          },
          {
            "id": "reading-p2",
            "title": "Notices and needs",
            "text": "A. Guided introduction: meet Hassan at Old Mill Museum on Sunday.\nB. Quiet hour: a smaller group meets before the main session.\nC. Access help: ask about step-free rooms and larger-print information.\nD. Skills desk: volunteers demonstrate practical methods and tools.\nE. Family visit: activities are planned for adults and children together.\nF. Research corner: examine the report and ask how information was collected.\nG. Follow-up team: help organise translate guides into more languages.\nH. Short briefing: Hassan gives a twenty-minute overview.\nI. Merchandise desk: souvenirs are available after the event.\nJ. Private room hire: businesses can book an unrelated meeting.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-r2-1",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants a guided introduction.",
                "options": [
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E"
                ],
                "answers": [
                  "A"
                ],
                "explanation": "Notice A offers exactly this service."
              },
              {
                "id": "m5-r2-2",
                "type": "choice",
                "text": "Which notice suits this person? Someone prefers a smaller, quieter group.",
                "options": [
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F"
                ],
                "answers": [
                  "B"
                ],
                "explanation": "Notice B offers exactly this service."
              },
              {
                "id": "m5-r2-3",
                "type": "choice",
                "text": "Which notice suits this person? A person needs access information.",
                "options": [
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G"
                ],
                "answers": [
                  "C"
                ],
                "explanation": "Notice C offers exactly this service."
              },
              {
                "id": "m5-r2-4",
                "type": "choice",
                "text": "Which notice suits this person? A learner wants a hands-on demonstration.",
                "options": [
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H"
                ],
                "answers": [
                  "D"
                ],
                "explanation": "Notice D offers exactly this service."
              },
              {
                "id": "m5-r2-5",
                "type": "choice",
                "text": "Which notice suits this person? A parent wants to bring a child.",
                "options": [
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I"
                ],
                "answers": [
                  "E"
                ],
                "explanation": "Notice E offers exactly this service."
              },
              {
                "id": "m5-r2-6",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants to inspect the evidence.",
                "options": [
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J"
                ],
                "answers": [
                  "F"
                ],
                "explanation": "Notice F offers exactly this service."
              },
              {
                "id": "m5-r2-7",
                "type": "choice",
                "text": "Which notice suits this person? A resident wants to help with the next event.",
                "options": [
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A"
                ],
                "answers": [
                  "G"
                ],
                "explanation": "Notice G offers exactly this service."
              },
              {
                "id": "m5-r2-8",
                "type": "choice",
                "text": "Which notice suits this person? Someone has only twenty minutes available.",
                "options": [
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B"
                ],
                "answers": [
                  "H"
                ],
                "explanation": "Notice H offers exactly this service."
              }
            ]
          },
          {
            "id": "reading-p3",
            "title": "Paragraph headings",
            "text": "Headings: A. The original difficulty | B. A practical adjustment | C. Collecting information | D. What the figures show | E. A reason for caution | F. The next question | G. A celebrity endorsement | H. An unrelated invention\n\nA. The idea behind museum access began with making local history easier to explore. People welcomed the aim, but the first arrangement was less reliable than the team expected. In particular, visitors missed labels printed in small type. Several participants described this as a problem of planning rather than a reason to abandon the work. Their observations were recorded instead of being dismissed.\n\nB. The organisers compared a complicated solution with a manageable one. They chose to offer large-print guides. This did not remove every difficulty, yet it made the next session possible without asking volunteers to start again. Hassan then explained the revised procedure to participants, including those who had missed the first announcement.\n\nC. Good intentions alone could not tell the team whether the change helped. They gathered observations during three weekend tours and kept notes about the conditions under which each observation was made. When a record was incomplete, they marked it as uncertain rather than filling in a likely answer. This made the report less dramatic but more useful.\n\nD. According to the team, visitors stayed an average of fifteen minutes longer. The figure attracted attention because it described an observable outcome, not merely a prediction. It also encouraged more residents to ask how they could take part. However, a number by itself says little about the people or circumstances behind it.\n\nE. The report acknowledges that the museum did not interview every visitor. A different location, season or group of participants might produce a different result. The team therefore resisted a claim that its method was universally successful. This careful interpretation helped readers separate the evidence from the organisers' hopes.\n\nF. The final recommendation was to translate guides into more languages. Before doing so, the organisers want to agree on clear measures of success and an accessible way to collect comments. They also plan to compare audio descriptions with an extra souvenir counter rather than assuming one choice will be best for every participant.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-r3-1",
                "type": "choice",
                "text": "Choose a heading for paragraph A.",
                "options": [
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution"
                ],
                "answers": [
                  "The original difficulty"
                ],
                "explanation": "Paragraph A develops the idea “the original difficulty”."
              },
              {
                "id": "m5-r3-2",
                "type": "choice",
                "text": "Choose a heading for paragraph B.",
                "options": [
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question"
                ],
                "answers": [
                  "A practical adjustment"
                ],
                "explanation": "Paragraph B develops the idea “a practical adjustment”."
              },
              {
                "id": "m5-r3-3",
                "type": "choice",
                "text": "Choose a heading for paragraph C.",
                "options": [
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement"
                ],
                "answers": [
                  "Collecting information"
                ],
                "explanation": "Paragraph C develops the idea “collecting information”."
              },
              {
                "id": "m5-r3-4",
                "type": "choice",
                "text": "Choose a heading for paragraph D.",
                "options": [
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention"
                ],
                "answers": [
                  "What the figures show"
                ],
                "explanation": "Paragraph D develops the idea “what the figures show”."
              },
              {
                "id": "m5-r3-5",
                "type": "choice",
                "text": "Choose a heading for paragraph E.",
                "options": [
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty"
                ],
                "answers": [
                  "A reason for caution"
                ],
                "explanation": "Paragraph E develops the idea “a reason for caution”."
              },
              {
                "id": "m5-r3-6",
                "type": "choice",
                "text": "Choose a heading for paragraph F.",
                "options": [
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment"
                ],
                "answers": [
                  "The next question"
                ],
                "explanation": "Paragraph F develops the idea “the next question”."
              }
            ]
          },
          {
            "id": "reading-p4",
            "title": "Detailed article",
            "text": "An invitation to take part in museum access appeared at Old Mill Museum. Its stated aim was making local history easier to explore. The first public meeting was held on Sunday, and Hassan collected the comments. Early reports suggested enthusiasm, but the team also heard practical concerns. Most notably, visitors missed labels printed in small type. It would have been easy to present this as a minor inconvenience. Instead, the organisers documented it and chose to offer large-print guides.\n\nThe revised activity did not follow exactly the original schedule. The organisers tested the change, recorded observations during three weekend tours, and compared comments made before and after the adjustment. Their report states that visitors stayed an average of fifteen minutes longer. The authors are careful to explain the difference between an observation and a prediction: a positive first month does not guarantee a positive first year.\n\nTwo alternatives were discussed. Some participants supported audio descriptions; others preferred an extra souvenir counter. Neither option was dismissed without consideration. The report ultimately recommended a limited further trial rather than an immediate permanent decision. Its main reservation was that the museum did not interview every visitor. Hassan said that the next stage would be to translate guides into more languages.\n\nThe report does not give the ages of the visitors, the exact amount of any future grant, or a date for publishing a second edition. Those details may matter later, but a reader should not invent them now. The value of the project lies partly in its willingness to say what remains unknown.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-r4-1",
                "type": "choice",
                "text": "What was the stated aim of the project?",
                "options": [
                  "to sell souvenirs",
                  "to replace public transport",
                  "to close the venue",
                  "making local history easier to explore"
                ],
                "answers": [
                  "making local history easier to explore"
                ],
                "explanation": "The opening paragraph states the aim."
              },
              {
                "id": "m5-r4-2",
                "type": "choice",
                "text": "What led the organisers to revise the activity?",
                "options": [
                  "a cancelled newspaper",
                  "a competition prize",
                  "visitors missed labels printed in small type",
                  "a new mayor"
                ],
                "answers": [
                  "visitors missed labels printed in small type"
                ],
                "explanation": "The reported problem led directly to the adjustment."
              },
              {
                "id": "m5-r4-3",
                "type": "choice",
                "text": "Which action did the organisers take?",
                "options": [
                  "ignore accessibility",
                  "offer large-print guides",
                  "stop collecting comments",
                  "claim guaranteed success"
                ],
                "answers": [
                  "offer large-print guides"
                ],
                "explanation": "The revised action is explicitly described."
              },
              {
                "id": "m5-r4-4",
                "type": "choice",
                "text": "How do the authors treat the positive early result?",
                "options": [
                  "As useful but limited evidence",
                  "As proof for every community",
                  "As an error to hide",
                  "As irrelevant to the project"
                ],
                "answers": [
                  "As useful but limited evidence"
                ],
                "explanation": "The text distinguishes observation from prediction."
              },
              {
                "id": "m5-r4-5",
                "type": "choice",
                "text": "True / False / Not Given: The team recorded information during the revised activity.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The second paragraph says the team recorded evidence."
              },
              {
                "id": "m5-r4-6",
                "type": "choice",
                "text": "True / False / Not Given: The organisers permanently rejected both alternatives.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "False"
                ],
                "explanation": "Both alternatives were considered; a further trial was recommended."
              },
              {
                "id": "m5-r4-7",
                "type": "choice",
                "text": "True / False / Not Given: Every visitor was younger than eighteen.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No ages are supplied."
              },
              {
                "id": "m5-r4-8",
                "type": "choice",
                "text": "True / False / Not Given: The report identifies a limitation of the trial.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The report acknowledges a limitation."
              },
              {
                "id": "m5-r4-9",
                "type": "choice",
                "text": "True / False / Not Given: A second edition will be published next month.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No date for a second edition is given."
              }
            ]
          },
          {
            "id": "reading-p5",
            "title": "Analysis and inference",
            "text": "The organisers at Old Mill Museum made a useful distinction between a change that is easy to announce and a change that can be evaluated. Their focus was making local history easier to explore. During the first stage, visitors missed labels printed in small type. The immediate response was to offer large-print guides, but the team did not describe this response as a complete solution.\n\nTo check what happened, they collected observations during three weekend tours. The report highlighted a figure of 15. A short account of the trial was sent to Hassan, who asked for more information about the conditions in which it took place. In particular, the museum did not interview every visitor. This mattered because an impressive number from a narrow trial can be misleading when removed from its context.\n\nAt the next meeting, participants will compare audio descriptions with an extra souvenir counter. They will also consider how to translate guides into more languages. The discussion is designed to invite disagreement supported by reasons, not to reward the loudest speaker. If the group can repeat the trial and explain its limitations clearly, the result will be more useful to other communities.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-r5-1",
                "type": "text",
                "text": "Which venue hosted the organisers? Write ONE word from the venue name.",
                "options": [],
                "answers": [
                  "Old"
                ],
                "explanation": "The venue starts with Old."
              },
              {
                "id": "m5-r5-2",
                "type": "text",
                "text": "What figure did the report highlight? Write ONE number.",
                "options": [],
                "answers": [
                  "15"
                ],
                "explanation": "The figure given is 15."
              },
              {
                "id": "m5-r5-3",
                "type": "text",
                "text": "Who requested more information? Write ONE name.",
                "options": [],
                "answers": [
                  "Hassan"
                ],
                "explanation": "The text names Hassan."
              },
              {
                "id": "m5-r5-4",
                "type": "text",
                "text": "What can be misleading without context? Write ONE word.",
                "options": [],
                "answers": [
                  "number"
                ],
                "explanation": "The passage describes an impressive number from a narrow trial."
              },
              {
                "id": "m5-r5-5",
                "type": "choice",
                "text": "Why does the writer mention the limitation?",
                "options": [
                  "To argue that evidence is useless",
                  "To avoid hearing from participants",
                  "To hide the report",
                  "To prevent an overconfident conclusion"
                ],
                "answers": [
                  "To prevent an overconfident conclusion"
                ],
                "explanation": "The writer warns against removing the result from context."
              },
              {
                "id": "m5-r5-6",
                "type": "choice",
                "text": "What attitude does the final paragraph encourage?",
                "options": [
                  "Immediate approval of every idea",
                  "Competition for attention",
                  "Reasoned disagreement",
                  "Silence at meetings"
                ],
                "answers": [
                  "Reasoned disagreement"
                ],
                "explanation": "The group invites disagreement supported by reasons."
              }
            ]
          }
        ]
      },
      {
        "skill": "writing",
        "minutes": 60,
        "parts": [
          {
            "id": "writing-p1",
            "title": "Tasks 1.1, 1.2 and 2",
            "text": "Write all three responses. Your work is assessed by an administrator.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-w1",
                "type": "writing",
                "text": "You and a friend attended an activity about museum access. Write an informal message to your friend. Explain what you enjoyed and suggest one thing to do next. Aim for about 50 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m5-w2",
                "type": "writing",
                "text": "Write to Hassan, the organiser at Old Mill Museum. Explain why you attended, describe the difficulty (“visitors missed labels printed in small type”), and suggest a practical improvement. Use a suitable formal tone. Aim for about 120–150 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m5-w3",
                "type": "writing",
                "text": "Some people think communities should invest in audio descriptions; others prefer an extra souvenir counter. Discuss both views and explain which approach would better support making local history easier to explore. Give reasons and examples. Aim for about 180–220 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      },
      {
        "skill": "speaking",
        "minutes": 15,
        "parts": [
          {
            "id": "speaking-p1",
            "title": "Part 1.1 — personal questions",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-s1-1",
                "type": "speaking",
                "text": "What do you enjoy doing in your neighbourhood?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m5-s1-2",
                "type": "speaking",
                "text": "How do you usually learn about local events?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m5-s1-3",
                "type": "speaking",
                "text": "Have you ever visited a place like Old Mill Museum?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p2",
            "title": "Part 1.2 — compare two scenes",
            "text": "Scene A: a small group working together. Scene B: a large public presentation. Compare the two situations.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-s2-1",
                "type": "speaking",
                "text": "Compare a small group discussion at Old Mill Museum with a large public meeting. What might each be like?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m5-s2-2",
                "type": "speaking",
                "text": "Which setting would help people discuss museum access more effectively, and why?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m5-s2-3",
                "type": "speaking",
                "text": "Would your preference change if you were presenting rather than listening?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p3",
            "title": "Part 2 — extended answer",
            "text": "Prepare for one minute; speak for about two minutes.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-s3-1",
                "type": "speaking",
                "text": "Discuss this issue: should communities prioritise audio descriptions or an extra souvenir counter? Give advantages, disadvantages and examples connected with making local history easier to explore.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p4",
            "title": "Part 3 — argument",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m5-s4-1",
                "type": "speaking",
                "text": "“A small successful trial is enough to justify a permanent public policy.” Discuss both sides of this claim. Refer to the limitation that the museum did not interview every visitor.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Multilevel Mock 06 · Repair workshop",
    "description": "Original mashq varianti: repair workshop. 35 Listening, 35 Reading, 3 Writing va 8 Speaking topshirig‘i. Rasmiy test savollari emas.",
    "level": "B1–C1",
    "format": "multilevel",
    "rightsConfirmed": true,
    "seedKey": "sinfquiz-multilevel-6",
    "sections": [
      {
        "skill": "listening",
        "minutes": 45,
        "parts": [
          {
            "id": "listening-p1",
            "title": "Short announcements",
            "text": "Listen to eight short messages. Choose the best answer for each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-6-part-1.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-l1-1",
                "type": "choice",
                "text": "When does the meeting begin?",
                "options": [
                  "17:25",
                  "17:00",
                  "12:00"
                ],
                "answers": [
                  "17:25"
                ],
                "explanation": "The announcement says: The first message said 17:00, but the repair workshop meeting now starts at 17:25."
              },
              {
                "id": "m6-l1-2",
                "type": "choice",
                "text": "Where will people meet?",
                "options": [
                  "the town hall",
                  "the railway café",
                  "Maple Community Hall"
                ],
                "answers": [
                  "Maple Community Hall"
                ],
                "explanation": "The announcement says: We are meeting at Maple Community Hall. Please do not wait at the old entrance."
              },
              {
                "id": "m6-l1-3",
                "type": "choice",
                "text": "What should visitors bring?",
                "options": [
                  "a camera",
                  "a small broken appliance",
                  "a printed ticket"
                ],
                "answers": [
                  "a small broken appliance"
                ],
                "explanation": "The announcement says: Before you leave home, remember to bring a small broken appliance. Other equipment is provided."
              },
              {
                "id": "m6-l1-4",
                "type": "choice",
                "text": "What is the last day to register?",
                "options": [
                  "Thursday",
                  "the following weekend",
                  "the day after the event"
                ],
                "answers": [
                  "Thursday"
                ],
                "explanation": "The announcement says: You can sign up until Thursday. We cannot add names at the door."
              },
              {
                "id": "m6-l1-5",
                "type": "choice",
                "text": "How much is admission?",
                "options": [
                  "five pounds",
                  "ten pounds",
                  "free"
                ],
                "answers": [
                  "free"
                ],
                "explanation": "The announcement says: Admission is free. The amount covers the materials, and there is no extra charge."
              },
              {
                "id": "m6-l1-6",
                "type": "choice",
                "text": "Who can answer questions?",
                "options": [
                  "the driver",
                  "Rosa",
                  "the caretaker"
                ],
                "answers": [
                  "Rosa"
                ],
                "explanation": "The announcement says: If you have a question, ask for Rosa at the information desk."
              },
              {
                "id": "m6-l1-7",
                "type": "choice",
                "text": "What did the team decide to do?",
                "options": [
                  "collect model details before the event",
                  "cancel the entire project",
                  "ignore the difficulty"
                ],
                "answers": [
                  "collect model details before the event"
                ],
                "explanation": "The announcement says: Because participants brought items needing specialist parts, the team decided to collect model details before the event."
              },
              {
                "id": "m6-l1-8",
                "type": "choice",
                "text": "What is the main purpose?",
                "options": [
                  "to sell more tickets",
                  "to replace every volunteer",
                  "repairing rather than replacing everyday objects"
                ],
                "answers": [
                  "repairing rather than replacing everyday objects"
                ],
                "explanation": "The announcement says: We are doing this to support repairing rather than replacing everyday objects, not simply to advertise the event."
              }
            ]
          },
          {
            "id": "listening-p2",
            "title": "Briefing notes",
            "text": "Listen to the briefing. Complete the notes with one word or number.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-6-part-2.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-l2-1",
                "type": "text",
                "text": "Which day is the briefing held? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Friday"
                ],
                "explanation": "The briefing explicitly gives Friday."
              },
              {
                "id": "m6-l2-2",
                "type": "text",
                "text": "What time does the briefing start? Write ONE word or number.",
                "options": [],
                "answers": [
                  "17:25"
                ],
                "explanation": "The briefing explicitly gives 17:25."
              },
              {
                "id": "m6-l2-3",
                "type": "text",
                "text": "Who leads the first session? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Rosa"
                ],
                "explanation": "The briefing explicitly gives Rosa."
              },
              {
                "id": "m6-l2-4",
                "type": "text",
                "text": "What is the registration deadline? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Thursday"
                ],
                "explanation": "The briefing explicitly gives Thursday."
              },
              {
                "id": "m6-l2-5",
                "type": "text",
                "text": "How many entries were recorded? Write ONE word or number.",
                "options": [],
                "answers": [
                  "14"
                ],
                "explanation": "The briefing explicitly gives 14."
              },
              {
                "id": "m6-l2-6",
                "type": "text",
                "text": "Which word describes the main concern? Write ONE word or number.",
                "options": [],
                "answers": [
                  "maintenance"
                ],
                "explanation": "The briefing explicitly gives maintenance."
              }
            ]
          },
          {
            "id": "listening-p3",
            "title": "Four speakers",
            "text": "Match four speakers with the main ideas. Two options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-6-part-3.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-l3-1",
                "type": "choice",
                "text": "Match speaker 1 with the main idea.",
                "options": [
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project"
                ],
                "answers": [
                  "Personal motivation"
                ],
                "explanation": "Speaker 1 focuses on personal motivation."
              },
              {
                "id": "m6-l3-2",
                "type": "choice",
                "text": "Match speaker 2 with the main idea.",
                "options": [
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation"
                ],
                "answers": [
                  "Learning from a setback"
                ],
                "explanation": "Speaker 2 focuses on learning from a setback."
              },
              {
                "id": "m6-l3-3",
                "type": "choice",
                "text": "Match speaker 3 with the main idea.",
                "options": [
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback"
                ],
                "answers": [
                  "Cautious optimism about a result"
                ],
                "explanation": "Speaker 3 focuses on cautious optimism about a result."
              },
              {
                "id": "m6-l3-4",
                "type": "choice",
                "text": "Match speaker 4 with the main idea.",
                "options": [
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result"
                ],
                "answers": [
                  "Planning the next stage"
                ],
                "explanation": "Speaker 4 focuses on planning the next stage."
              }
            ]
          },
          {
            "id": "listening-p4",
            "title": "Responding to requests",
            "text": "Match each request to the response. Three options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-6-part-4.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-l4-1",
                "type": "choice",
                "text": "Which response was given to a visitor who cannot reach the upper floor?",
                "options": [
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately"
                ],
                "answers": [
                  "Move activities to an accessible room"
                ],
                "explanation": "The announcement connects this request with “move activities to an accessible room”."
              },
              {
                "id": "m6-l4-2",
                "type": "choice",
                "text": "Which response was given to a volunteer who needs to know the arrival time?",
                "options": [
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper"
                ],
                "answers": [
                  "Check the revised schedule"
                ],
                "explanation": "The announcement connects this request with “check the revised schedule”."
              },
              {
                "id": "m6-l4-3",
                "type": "choice",
                "text": "Which response was given to someone who wants the project to continue?",
                "options": [
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers"
                ],
                "answers": [
                  "Help plan a follow-up session"
                ],
                "explanation": "The announcement connects this request with “help plan a follow-up session”."
              },
              {
                "id": "m6-l4-4",
                "type": "choice",
                "text": "Which response was given to a researcher questioning the findings?",
                "options": [
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room"
                ],
                "answers": [
                  "Explain the sample limitation"
                ],
                "explanation": "The announcement connects this request with “explain the sample limitation”."
              },
              {
                "id": "m6-l4-5",
                "type": "choice",
                "text": "Which response was given to a participant with an item to bring?",
                "options": [
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule"
                ],
                "answers": [
                  "Read the equipment list"
                ],
                "explanation": "The announcement connects this request with “read the equipment list”."
              }
            ]
          },
          {
            "id": "listening-p5",
            "title": "Three conversations",
            "text": "Listen to three conversations. Answer two questions about each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-6-part-5.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-l5-1",
                "type": "choice",
                "text": "Why is the speaker cautious?",
                "options": [
                  "the team did not track how long repairs lasted",
                  "There was no trial.",
                  "The report was lost."
                ],
                "answers": [
                  "the team did not track how long repairs lasted"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m6-l5-2",
                "type": "choice",
                "text": "What does the speaker recommend?",
                "options": [
                  "closing the project",
                  "buying a larger room",
                  "another trial"
                ],
                "answers": [
                  "another trial"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m6-l5-3",
                "type": "choice",
                "text": "Which option does the second speaker prefer?",
                "options": [
                  "discounted new products",
                  "neither option",
                  "tool sharing"
                ],
                "answers": [
                  "tool sharing"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m6-l5-4",
                "type": "choice",
                "text": "Why does the speaker prefer it?",
                "options": [
                  "it needs no volunteers",
                  "repairing rather than replacing everyday objects",
                  "it is the oldest option"
                ],
                "answers": [
                  "repairing rather than replacing everyday objects"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m6-l5-5",
                "type": "choice",
                "text": "Who will speak?",
                "options": [
                  "the caretaker",
                  "Rosa",
                  "the driver"
                ],
                "answers": [
                  "Rosa"
                ],
                "explanation": "Conversation 3 states this clearly."
              },
              {
                "id": "m6-l5-6",
                "type": "choice",
                "text": "Why did the plan change?",
                "options": [
                  "participants brought items needing specialist parts",
                  "a lack of interest",
                  "a change in the weather forecast"
                ],
                "answers": [
                  "participants brought items needing specialist parts"
                ],
                "explanation": "Conversation 3 states this clearly."
              }
            ]
          },
          {
            "id": "listening-p6",
            "title": "Project lecture",
            "text": "Listen to the lecture and write one word or number for each answer.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-6-part-6.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-l6-1",
                "type": "text",
                "text": "What do the collected records form? Write ONE word or number.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "The lecture uses the word evidence."
              },
              {
                "id": "m6-l6-2",
                "type": "text",
                "text": "What is the total highlighted in the report? Write ONE word or number.",
                "options": [],
                "answers": [
                  "14"
                ],
                "explanation": "The lecture uses the word 14."
              },
              {
                "id": "m6-l6-3",
                "type": "text",
                "text": "Which word describes the key idea? Write ONE word or number.",
                "options": [],
                "answers": [
                  "maintenance"
                ],
                "explanation": "The lecture uses the word maintenance."
              },
              {
                "id": "m6-l6-4",
                "type": "text",
                "text": "What did the team ask visitors for? Write ONE word or number.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "The lecture uses the word feedback."
              },
              {
                "id": "m6-l6-5",
                "type": "text",
                "text": "What must be understood behind a result? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conditions"
                ],
                "explanation": "The lecture uses the word conditions."
              },
              {
                "id": "m6-l6-6",
                "type": "text",
                "text": "Which section contains the final interpretation? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conclusions"
                ],
                "explanation": "The lecture uses the word conclusions."
              }
            ]
          }
        ]
      },
      {
        "skill": "reading",
        "minutes": 60,
        "parts": [
          {
            "id": "reading-p1",
            "title": "One-word gaps",
            "text": "The repair workshop project depended on (1) ____ who gave their time freely. At first, the team followed a fixed (2) ____, but participants brought items needing specialist parts. Careful (3) ____ showed exactly when the difficulty appeared. The organisers asked visitors for (4) ____ before changing the plan. They also wanted better (5) ____ for people who could not use the first arrangement. In the end, the strongest (6) ____ came from repair records from fourteen households. None of these observations proves that the same approach would work in every town. Nevertheless, the group learned why small, well-recorded changes can matter. Its next meeting will consider whether start a monthly spare-parts exchange is practical and who could help.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-r1-1",
                "type": "text",
                "text": "Complete gap 1 with ONE word.",
                "options": [],
                "answers": [
                  "volunteers"
                ],
                "explanation": "“volunteers” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m6-r1-2",
                "type": "text",
                "text": "Complete gap 2 with ONE word.",
                "options": [],
                "answers": [
                  "schedule"
                ],
                "explanation": "“schedule” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m6-r1-3",
                "type": "text",
                "text": "Complete gap 3 with ONE word.",
                "options": [],
                "answers": [
                  "records"
                ],
                "explanation": "“records” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m6-r1-4",
                "type": "text",
                "text": "Complete gap 4 with ONE word.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "“feedback” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m6-r1-5",
                "type": "text",
                "text": "Complete gap 5 with ONE word.",
                "options": [],
                "answers": [
                  "access"
                ],
                "explanation": "“access” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m6-r1-6",
                "type": "text",
                "text": "Complete gap 6 with ONE word.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "“evidence” makes the sentence grammatically and logically complete."
              }
            ]
          },
          {
            "id": "reading-p2",
            "title": "Notices and needs",
            "text": "A. Guided introduction: meet Rosa at Maple Community Hall on Friday.\nB. Quiet hour: a smaller group meets before the main session.\nC. Access help: ask about step-free rooms and larger-print information.\nD. Skills desk: volunteers demonstrate practical methods and tools.\nE. Family visit: activities are planned for adults and children together.\nF. Research corner: examine the report and ask how information was collected.\nG. Follow-up team: help organise start a monthly spare-parts exchange.\nH. Short briefing: Rosa gives a twenty-minute overview.\nI. Merchandise desk: souvenirs are available after the event.\nJ. Private room hire: businesses can book an unrelated meeting.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-r2-1",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants a guided introduction.",
                "options": [
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F"
                ],
                "answers": [
                  "A"
                ],
                "explanation": "Notice A offers exactly this service."
              },
              {
                "id": "m6-r2-2",
                "type": "choice",
                "text": "Which notice suits this person? Someone prefers a smaller, quieter group.",
                "options": [
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G"
                ],
                "answers": [
                  "B"
                ],
                "explanation": "Notice B offers exactly this service."
              },
              {
                "id": "m6-r2-3",
                "type": "choice",
                "text": "Which notice suits this person? A person needs access information.",
                "options": [
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H"
                ],
                "answers": [
                  "C"
                ],
                "explanation": "Notice C offers exactly this service."
              },
              {
                "id": "m6-r2-4",
                "type": "choice",
                "text": "Which notice suits this person? A learner wants a hands-on demonstration.",
                "options": [
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I"
                ],
                "answers": [
                  "D"
                ],
                "explanation": "Notice D offers exactly this service."
              },
              {
                "id": "m6-r2-5",
                "type": "choice",
                "text": "Which notice suits this person? A parent wants to bring a child.",
                "options": [
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J"
                ],
                "answers": [
                  "E"
                ],
                "explanation": "Notice E offers exactly this service."
              },
              {
                "id": "m6-r2-6",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants to inspect the evidence.",
                "options": [
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A"
                ],
                "answers": [
                  "F"
                ],
                "explanation": "Notice F offers exactly this service."
              },
              {
                "id": "m6-r2-7",
                "type": "choice",
                "text": "Which notice suits this person? A resident wants to help with the next event.",
                "options": [
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B"
                ],
                "answers": [
                  "G"
                ],
                "explanation": "Notice G offers exactly this service."
              },
              {
                "id": "m6-r2-8",
                "type": "choice",
                "text": "Which notice suits this person? Someone has only twenty minutes available.",
                "options": [
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C"
                ],
                "answers": [
                  "H"
                ],
                "explanation": "Notice H offers exactly this service."
              }
            ]
          },
          {
            "id": "reading-p3",
            "title": "Paragraph headings",
            "text": "Headings: A. The original difficulty | B. A practical adjustment | C. Collecting information | D. What the figures show | E. A reason for caution | F. The next question | G. A celebrity endorsement | H. An unrelated invention\n\nA. The idea behind repair workshop began with repairing rather than replacing everyday objects. People welcomed the aim, but the first arrangement was less reliable than the team expected. In particular, participants brought items needing specialist parts. Several participants described this as a problem of planning rather than a reason to abandon the work. Their observations were recorded instead of being dismissed.\n\nB. The organisers compared a complicated solution with a manageable one. They chose to collect model details before the event. This did not remove every difficulty, yet it made the next session possible without asking volunteers to start again. Rosa then explained the revised procedure to participants, including those who had missed the first announcement.\n\nC. Good intentions alone could not tell the team whether the change helped. They gathered repair records from fourteen households and kept notes about the conditions under which each observation was made. When a record was incomplete, they marked it as uncertain rather than filling in a likely answer. This made the report less dramatic but more useful.\n\nD. According to the team, nine of fourteen items were repaired. The figure attracted attention because it described an observable outcome, not merely a prediction. It also encouraged more residents to ask how they could take part. However, a number by itself says little about the people or circumstances behind it.\n\nE. The report acknowledges that the team did not track how long repairs lasted. A different location, season or group of participants might produce a different result. The team therefore resisted a claim that its method was universally successful. This careful interpretation helped readers separate the evidence from the organisers' hopes.\n\nF. The final recommendation was to start a monthly spare-parts exchange. Before doing so, the organisers want to agree on clear measures of success and an accessible way to collect comments. They also plan to compare tool sharing with discounted new products rather than assuming one choice will be best for every participant.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-r3-1",
                "type": "choice",
                "text": "Choose a heading for paragraph A.",
                "options": [
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question"
                ],
                "answers": [
                  "The original difficulty"
                ],
                "explanation": "Paragraph A develops the idea “the original difficulty”."
              },
              {
                "id": "m6-r3-2",
                "type": "choice",
                "text": "Choose a heading for paragraph B.",
                "options": [
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement"
                ],
                "answers": [
                  "A practical adjustment"
                ],
                "explanation": "Paragraph B develops the idea “a practical adjustment”."
              },
              {
                "id": "m6-r3-3",
                "type": "choice",
                "text": "Choose a heading for paragraph C.",
                "options": [
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention"
                ],
                "answers": [
                  "Collecting information"
                ],
                "explanation": "Paragraph C develops the idea “collecting information”."
              },
              {
                "id": "m6-r3-4",
                "type": "choice",
                "text": "Choose a heading for paragraph D.",
                "options": [
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty"
                ],
                "answers": [
                  "What the figures show"
                ],
                "explanation": "Paragraph D develops the idea “what the figures show”."
              },
              {
                "id": "m6-r3-5",
                "type": "choice",
                "text": "Choose a heading for paragraph E.",
                "options": [
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment"
                ],
                "answers": [
                  "A reason for caution"
                ],
                "explanation": "Paragraph E develops the idea “a reason for caution”."
              },
              {
                "id": "m6-r3-6",
                "type": "choice",
                "text": "Choose a heading for paragraph F.",
                "options": [
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information"
                ],
                "answers": [
                  "The next question"
                ],
                "explanation": "Paragraph F develops the idea “the next question”."
              }
            ]
          },
          {
            "id": "reading-p4",
            "title": "Detailed article",
            "text": "An invitation to take part in repair workshop appeared at Maple Community Hall. Its stated aim was repairing rather than replacing everyday objects. The first public meeting was held on Friday, and Rosa collected the comments. Early reports suggested enthusiasm, but the team also heard practical concerns. Most notably, participants brought items needing specialist parts. It would have been easy to present this as a minor inconvenience. Instead, the organisers documented it and chose to collect model details before the event.\n\nThe revised activity did not follow exactly the original schedule. The organisers tested the change, recorded repair records from fourteen households, and compared comments made before and after the adjustment. Their report states that nine of fourteen items were repaired. The authors are careful to explain the difference between an observation and a prediction: a positive first month does not guarantee a positive first year.\n\nTwo alternatives were discussed. Some participants supported tool sharing; others preferred discounted new products. Neither option was dismissed without consideration. The report ultimately recommended a limited further trial rather than an immediate permanent decision. Its main reservation was that the team did not track how long repairs lasted. Rosa said that the next stage would be to start a monthly spare-parts exchange.\n\nThe report does not give the ages of the visitors, the exact amount of any future grant, or a date for publishing a second edition. Those details may matter later, but a reader should not invent them now. The value of the project lies partly in its willingness to say what remains unknown.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-r4-1",
                "type": "choice",
                "text": "What was the stated aim of the project?",
                "options": [
                  "to replace public transport",
                  "to close the venue",
                  "repairing rather than replacing everyday objects",
                  "to sell souvenirs"
                ],
                "answers": [
                  "repairing rather than replacing everyday objects"
                ],
                "explanation": "The opening paragraph states the aim."
              },
              {
                "id": "m6-r4-2",
                "type": "choice",
                "text": "What led the organisers to revise the activity?",
                "options": [
                  "a competition prize",
                  "participants brought items needing specialist parts",
                  "a new mayor",
                  "a cancelled newspaper"
                ],
                "answers": [
                  "participants brought items needing specialist parts"
                ],
                "explanation": "The reported problem led directly to the adjustment."
              },
              {
                "id": "m6-r4-3",
                "type": "choice",
                "text": "Which action did the organisers take?",
                "options": [
                  "collect model details before the event",
                  "stop collecting comments",
                  "claim guaranteed success",
                  "ignore accessibility"
                ],
                "answers": [
                  "collect model details before the event"
                ],
                "explanation": "The revised action is explicitly described."
              },
              {
                "id": "m6-r4-4",
                "type": "choice",
                "text": "How do the authors treat the positive early result?",
                "options": [
                  "As proof for every community",
                  "As an error to hide",
                  "As irrelevant to the project",
                  "As useful but limited evidence"
                ],
                "answers": [
                  "As useful but limited evidence"
                ],
                "explanation": "The text distinguishes observation from prediction."
              },
              {
                "id": "m6-r4-5",
                "type": "choice",
                "text": "True / False / Not Given: The team recorded information during the revised activity.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The second paragraph says the team recorded evidence."
              },
              {
                "id": "m6-r4-6",
                "type": "choice",
                "text": "True / False / Not Given: The organisers permanently rejected both alternatives.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "False"
                ],
                "explanation": "Both alternatives were considered; a further trial was recommended."
              },
              {
                "id": "m6-r4-7",
                "type": "choice",
                "text": "True / False / Not Given: Every visitor was younger than eighteen.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No ages are supplied."
              },
              {
                "id": "m6-r4-8",
                "type": "choice",
                "text": "True / False / Not Given: The report identifies a limitation of the trial.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The report acknowledges a limitation."
              },
              {
                "id": "m6-r4-9",
                "type": "choice",
                "text": "True / False / Not Given: A second edition will be published next month.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No date for a second edition is given."
              }
            ]
          },
          {
            "id": "reading-p5",
            "title": "Analysis and inference",
            "text": "The organisers at Maple Community Hall made a useful distinction between a change that is easy to announce and a change that can be evaluated. Their focus was repairing rather than replacing everyday objects. During the first stage, participants brought items needing specialist parts. The immediate response was to collect model details before the event, but the team did not describe this response as a complete solution.\n\nTo check what happened, they collected repair records from fourteen households. The report highlighted a figure of 14. A short account of the trial was sent to Rosa, who asked for more information about the conditions in which it took place. In particular, the team did not track how long repairs lasted. This mattered because an impressive number from a narrow trial can be misleading when removed from its context.\n\nAt the next meeting, participants will compare tool sharing with discounted new products. They will also consider how to start a monthly spare-parts exchange. The discussion is designed to invite disagreement supported by reasons, not to reward the loudest speaker. If the group can repeat the trial and explain its limitations clearly, the result will be more useful to other communities.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-r5-1",
                "type": "text",
                "text": "Which venue hosted the organisers? Write ONE word from the venue name.",
                "options": [],
                "answers": [
                  "Maple"
                ],
                "explanation": "The venue starts with Maple."
              },
              {
                "id": "m6-r5-2",
                "type": "text",
                "text": "What figure did the report highlight? Write ONE number.",
                "options": [],
                "answers": [
                  "14"
                ],
                "explanation": "The figure given is 14."
              },
              {
                "id": "m6-r5-3",
                "type": "text",
                "text": "Who requested more information? Write ONE name.",
                "options": [],
                "answers": [
                  "Rosa"
                ],
                "explanation": "The text names Rosa."
              },
              {
                "id": "m6-r5-4",
                "type": "text",
                "text": "What can be misleading without context? Write ONE word.",
                "options": [],
                "answers": [
                  "number"
                ],
                "explanation": "The passage describes an impressive number from a narrow trial."
              },
              {
                "id": "m6-r5-5",
                "type": "choice",
                "text": "Why does the writer mention the limitation?",
                "options": [
                  "To avoid hearing from participants",
                  "To hide the report",
                  "To prevent an overconfident conclusion",
                  "To argue that evidence is useless"
                ],
                "answers": [
                  "To prevent an overconfident conclusion"
                ],
                "explanation": "The writer warns against removing the result from context."
              },
              {
                "id": "m6-r5-6",
                "type": "choice",
                "text": "What attitude does the final paragraph encourage?",
                "options": [
                  "Competition for attention",
                  "Reasoned disagreement",
                  "Silence at meetings",
                  "Immediate approval of every idea"
                ],
                "answers": [
                  "Reasoned disagreement"
                ],
                "explanation": "The group invites disagreement supported by reasons."
              }
            ]
          }
        ]
      },
      {
        "skill": "writing",
        "minutes": 60,
        "parts": [
          {
            "id": "writing-p1",
            "title": "Tasks 1.1, 1.2 and 2",
            "text": "Write all three responses. Your work is assessed by an administrator.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-w1",
                "type": "writing",
                "text": "You and a friend attended an activity about repair workshop. Write an informal message to your friend. Explain what you enjoyed and suggest one thing to do next. Aim for about 50 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m6-w2",
                "type": "writing",
                "text": "Write to Rosa, the organiser at Maple Community Hall. Explain why you attended, describe the difficulty (“participants brought items needing specialist parts”), and suggest a practical improvement. Use a suitable formal tone. Aim for about 120–150 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m6-w3",
                "type": "writing",
                "text": "Some people think communities should invest in tool sharing; others prefer discounted new products. Discuss both views and explain which approach would better support repairing rather than replacing everyday objects. Give reasons and examples. Aim for about 180–220 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      },
      {
        "skill": "speaking",
        "minutes": 15,
        "parts": [
          {
            "id": "speaking-p1",
            "title": "Part 1.1 — personal questions",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-s1-1",
                "type": "speaking",
                "text": "What do you enjoy doing in your neighbourhood?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m6-s1-2",
                "type": "speaking",
                "text": "How do you usually learn about local events?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m6-s1-3",
                "type": "speaking",
                "text": "Have you ever visited a place like Maple Community Hall?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p2",
            "title": "Part 1.2 — compare two scenes",
            "text": "Scene A: a small group working together. Scene B: a large public presentation. Compare the two situations.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-s2-1",
                "type": "speaking",
                "text": "Compare a small group discussion at Maple Community Hall with a large public meeting. What might each be like?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m6-s2-2",
                "type": "speaking",
                "text": "Which setting would help people discuss repair workshop more effectively, and why?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m6-s2-3",
                "type": "speaking",
                "text": "Would your preference change if you were presenting rather than listening?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p3",
            "title": "Part 2 — extended answer",
            "text": "Prepare for one minute; speak for about two minutes.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-s3-1",
                "type": "speaking",
                "text": "Discuss this issue: should communities prioritise tool sharing or discounted new products? Give advantages, disadvantages and examples connected with repairing rather than replacing everyday objects.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p4",
            "title": "Part 3 — argument",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m6-s4-1",
                "type": "speaking",
                "text": "“A small successful trial is enough to justify a permanent public policy.” Discuss both sides of this claim. Refer to the limitation that the team did not track how long repairs lasted.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Multilevel Mock 07 · Coastal science",
    "description": "Original mashq varianti: coastal science. 35 Listening, 35 Reading, 3 Writing va 8 Speaking topshirig‘i. Rasmiy test savollari emas.",
    "level": "B1–C1",
    "format": "multilevel",
    "rightsConfirmed": true,
    "seedKey": "sinfquiz-multilevel-7",
    "sections": [
      {
        "skill": "listening",
        "minutes": 45,
        "parts": [
          {
            "id": "listening-p1",
            "title": "Short announcements",
            "text": "Listen to eight short messages. Choose the best answer for each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-7-part-1.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-l1-1",
                "type": "choice",
                "text": "When does the meeting begin?",
                "options": [
                  "12:05",
                  "11:30",
                  "12:00"
                ],
                "answers": [
                  "12:05"
                ],
                "explanation": "The announcement says: The first message said 11:30, but the coastal science meeting now starts at 12:05."
              },
              {
                "id": "m7-l1-2",
                "type": "choice",
                "text": "Where will people meet?",
                "options": [
                  "the town hall",
                  "the railway café",
                  "Bay Research Centre"
                ],
                "answers": [
                  "Bay Research Centre"
                ],
                "explanation": "The announcement says: We are meeting at Bay Research Centre. Please do not wait at the old entrance."
              },
              {
                "id": "m7-l1-3",
                "type": "choice",
                "text": "What should visitors bring?",
                "options": [
                  "a camera",
                  "a pair of boots",
                  "a printed ticket"
                ],
                "answers": [
                  "a pair of boots"
                ],
                "explanation": "The announcement says: Before you leave home, remember to bring a pair of boots. Other equipment is provided."
              },
              {
                "id": "m7-l1-4",
                "type": "choice",
                "text": "What is the last day to register?",
                "options": [
                  "Sunday",
                  "the following weekend",
                  "the day after the event"
                ],
                "answers": [
                  "Sunday"
                ],
                "explanation": "The announcement says: You can sign up until Sunday. We cannot add names at the door."
              },
              {
                "id": "m7-l1-5",
                "type": "choice",
                "text": "How much is admission?",
                "options": [
                  "five pounds",
                  "ten pounds",
                  "four pounds"
                ],
                "answers": [
                  "four pounds"
                ],
                "explanation": "The announcement says: Admission is four pounds. The amount covers the materials, and there is no extra charge."
              },
              {
                "id": "m7-l1-6",
                "type": "choice",
                "text": "Who can answer questions?",
                "options": [
                  "the driver",
                  "Nadia",
                  "the caretaker"
                ],
                "answers": [
                  "Nadia"
                ],
                "explanation": "The announcement says: If you have a question, ask for Nadia at the information desk."
              },
              {
                "id": "m7-l1-7",
                "type": "choice",
                "text": "What did the team decide to do?",
                "options": [
                  "collect samples from the sheltered inlet",
                  "cancel the entire project",
                  "ignore the difficulty"
                ],
                "answers": [
                  "collect samples from the sheltered inlet"
                ],
                "explanation": "The announcement says: Because strong winds delayed a planned boat survey, the team decided to collect samples from the sheltered inlet."
              },
              {
                "id": "m7-l1-8",
                "type": "choice",
                "text": "What is the main purpose?",
                "options": [
                  "to sell more tickets",
                  "to replace every volunteer",
                  "monitoring changes along the shoreline"
                ],
                "answers": [
                  "monitoring changes along the shoreline"
                ],
                "explanation": "The announcement says: We are doing this to support monitoring changes along the shoreline, not simply to advertise the event."
              }
            ]
          },
          {
            "id": "listening-p2",
            "title": "Briefing notes",
            "text": "Listen to the briefing. Complete the notes with one word or number.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-7-part-2.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-l2-1",
                "type": "text",
                "text": "Which day is the briefing held? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Monday"
                ],
                "explanation": "The briefing explicitly gives Monday."
              },
              {
                "id": "m7-l2-2",
                "type": "text",
                "text": "What time does the briefing start? Write ONE word or number.",
                "options": [],
                "answers": [
                  "12:05"
                ],
                "explanation": "The briefing explicitly gives 12:05."
              },
              {
                "id": "m7-l2-3",
                "type": "text",
                "text": "Who leads the first session? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Nadia"
                ],
                "explanation": "The briefing explicitly gives Nadia."
              },
              {
                "id": "m7-l2-4",
                "type": "text",
                "text": "What is the registration deadline? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Sunday"
                ],
                "explanation": "The briefing explicitly gives Sunday."
              },
              {
                "id": "m7-l2-5",
                "type": "text",
                "text": "How many entries were recorded? Write ONE word or number.",
                "options": [],
                "answers": [
                  "5"
                ],
                "explanation": "The briefing explicitly gives 5."
              },
              {
                "id": "m7-l2-6",
                "type": "text",
                "text": "Which word describes the main concern? Write ONE word or number.",
                "options": [],
                "answers": [
                  "sampling"
                ],
                "explanation": "The briefing explicitly gives sampling."
              }
            ]
          },
          {
            "id": "listening-p3",
            "title": "Four speakers",
            "text": "Match four speakers with the main ideas. Two options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-7-part-3.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-l3-1",
                "type": "choice",
                "text": "Match speaker 1 with the main idea.",
                "options": [
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation"
                ],
                "answers": [
                  "Personal motivation"
                ],
                "explanation": "Speaker 1 focuses on personal motivation."
              },
              {
                "id": "m7-l3-2",
                "type": "choice",
                "text": "Match speaker 2 with the main idea.",
                "options": [
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback"
                ],
                "answers": [
                  "Learning from a setback"
                ],
                "explanation": "Speaker 2 focuses on learning from a setback."
              },
              {
                "id": "m7-l3-3",
                "type": "choice",
                "text": "Match speaker 3 with the main idea.",
                "options": [
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result"
                ],
                "answers": [
                  "Cautious optimism about a result"
                ],
                "explanation": "Speaker 3 focuses on cautious optimism about a result."
              },
              {
                "id": "m7-l3-4",
                "type": "choice",
                "text": "Match speaker 4 with the main idea.",
                "options": [
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage"
                ],
                "answers": [
                  "Planning the next stage"
                ],
                "explanation": "Speaker 4 focuses on planning the next stage."
              }
            ]
          },
          {
            "id": "listening-p4",
            "title": "Responding to requests",
            "text": "Match each request to the response. Three options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-7-part-4.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-l4-1",
                "type": "choice",
                "text": "Which response was given to a visitor who cannot reach the upper floor?",
                "options": [
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper"
                ],
                "answers": [
                  "Move activities to an accessible room"
                ],
                "explanation": "The announcement connects this request with “move activities to an accessible room”."
              },
              {
                "id": "m7-l4-2",
                "type": "choice",
                "text": "Which response was given to a volunteer who needs to know the arrival time?",
                "options": [
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers"
                ],
                "answers": [
                  "Check the revised schedule"
                ],
                "explanation": "The announcement connects this request with “check the revised schedule”."
              },
              {
                "id": "m7-l4-3",
                "type": "choice",
                "text": "Which response was given to someone who wants the project to continue?",
                "options": [
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room"
                ],
                "answers": [
                  "Help plan a follow-up session"
                ],
                "explanation": "The announcement connects this request with “help plan a follow-up session”."
              },
              {
                "id": "m7-l4-4",
                "type": "choice",
                "text": "Which response was given to a researcher questioning the findings?",
                "options": [
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule"
                ],
                "answers": [
                  "Explain the sample limitation"
                ],
                "explanation": "The announcement connects this request with “explain the sample limitation”."
              },
              {
                "id": "m7-l4-5",
                "type": "choice",
                "text": "Which response was given to a participant with an item to bring?",
                "options": [
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session"
                ],
                "answers": [
                  "Read the equipment list"
                ],
                "explanation": "The announcement connects this request with “read the equipment list”."
              }
            ]
          },
          {
            "id": "listening-p5",
            "title": "Three conversations",
            "text": "Listen to three conversations. Answer two questions about each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-7-part-5.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-l5-1",
                "type": "choice",
                "text": "Why is the speaker cautious?",
                "options": [
                  "There was no trial.",
                  "The report was lost.",
                  "one season cannot establish a long-term trend"
                ],
                "answers": [
                  "one season cannot establish a long-term trend"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m7-l5-2",
                "type": "choice",
                "text": "What does the speaker recommend?",
                "options": [
                  "buying a larger room",
                  "another trial",
                  "closing the project"
                ],
                "answers": [
                  "another trial"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m7-l5-3",
                "type": "choice",
                "text": "Which option does the second speaker prefer?",
                "options": [
                  "neither option",
                  "citizen observations",
                  "one-off publicity campaigns"
                ],
                "answers": [
                  "citizen observations"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m7-l5-4",
                "type": "choice",
                "text": "Why does the speaker prefer it?",
                "options": [
                  "monitoring changes along the shoreline",
                  "it is the oldest option",
                  "it needs no volunteers"
                ],
                "answers": [
                  "monitoring changes along the shoreline"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m7-l5-5",
                "type": "choice",
                "text": "Who will speak?",
                "options": [
                  "Nadia",
                  "the driver",
                  "the caretaker"
                ],
                "answers": [
                  "Nadia"
                ],
                "explanation": "Conversation 3 states this clearly."
              },
              {
                "id": "m7-l5-6",
                "type": "choice",
                "text": "Why did the plan change?",
                "options": [
                  "a lack of interest",
                  "a change in the weather forecast",
                  "strong winds delayed a planned boat survey"
                ],
                "answers": [
                  "strong winds delayed a planned boat survey"
                ],
                "explanation": "Conversation 3 states this clearly."
              }
            ]
          },
          {
            "id": "listening-p6",
            "title": "Project lecture",
            "text": "Listen to the lecture and write one word or number for each answer.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-7-part-6.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-l6-1",
                "type": "text",
                "text": "What do the collected records form? Write ONE word or number.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "The lecture uses the word evidence."
              },
              {
                "id": "m7-l6-2",
                "type": "text",
                "text": "What is the total highlighted in the report? Write ONE word or number.",
                "options": [],
                "answers": [
                  "5"
                ],
                "explanation": "The lecture uses the word 5."
              },
              {
                "id": "m7-l6-3",
                "type": "text",
                "text": "Which word describes the key idea? Write ONE word or number.",
                "options": [],
                "answers": [
                  "sampling"
                ],
                "explanation": "The lecture uses the word sampling."
              },
              {
                "id": "m7-l6-4",
                "type": "text",
                "text": "What did the team ask visitors for? Write ONE word or number.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "The lecture uses the word feedback."
              },
              {
                "id": "m7-l6-5",
                "type": "text",
                "text": "What must be understood behind a result? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conditions"
                ],
                "explanation": "The lecture uses the word conditions."
              },
              {
                "id": "m7-l6-6",
                "type": "text",
                "text": "Which section contains the final interpretation? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conclusions"
                ],
                "explanation": "The lecture uses the word conclusions."
              }
            ]
          }
        ]
      },
      {
        "skill": "reading",
        "minutes": 60,
        "parts": [
          {
            "id": "reading-p1",
            "title": "One-word gaps",
            "text": "The coastal science project depended on (1) ____ who gave their time freely. At first, the team followed a fixed (2) ____, but strong winds delayed a planned boat survey. Careful (3) ____ showed exactly when the difficulty appeared. The organisers asked visitors for (4) ____ before changing the plan. They also wanted better (5) ____ for people who could not use the first arrangement. In the end, the strongest (6) ____ came from photographs checked by two researchers. None of these observations proves that the same approach would work in every town. Nevertheless, the group learned why small, well-recorded changes can matter. Its next meeting will consider whether repeat sampling every spring is practical and who could help.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-r1-1",
                "type": "text",
                "text": "Complete gap 1 with ONE word.",
                "options": [],
                "answers": [
                  "volunteers"
                ],
                "explanation": "“volunteers” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m7-r1-2",
                "type": "text",
                "text": "Complete gap 2 with ONE word.",
                "options": [],
                "answers": [
                  "schedule"
                ],
                "explanation": "“schedule” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m7-r1-3",
                "type": "text",
                "text": "Complete gap 3 with ONE word.",
                "options": [],
                "answers": [
                  "records"
                ],
                "explanation": "“records” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m7-r1-4",
                "type": "text",
                "text": "Complete gap 4 with ONE word.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "“feedback” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m7-r1-5",
                "type": "text",
                "text": "Complete gap 5 with ONE word.",
                "options": [],
                "answers": [
                  "access"
                ],
                "explanation": "“access” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m7-r1-6",
                "type": "text",
                "text": "Complete gap 6 with ONE word.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "“evidence” makes the sentence grammatically and logically complete."
              }
            ]
          },
          {
            "id": "reading-p2",
            "title": "Notices and needs",
            "text": "A. Guided introduction: meet Nadia at Bay Research Centre on Monday.\nB. Quiet hour: a smaller group meets before the main session.\nC. Access help: ask about step-free rooms and larger-print information.\nD. Skills desk: volunteers demonstrate practical methods and tools.\nE. Family visit: activities are planned for adults and children together.\nF. Research corner: examine the report and ask how information was collected.\nG. Follow-up team: help organise repeat sampling every spring.\nH. Short briefing: Nadia gives a twenty-minute overview.\nI. Merchandise desk: souvenirs are available after the event.\nJ. Private room hire: businesses can book an unrelated meeting.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-r2-1",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants a guided introduction.",
                "options": [
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G"
                ],
                "answers": [
                  "A"
                ],
                "explanation": "Notice A offers exactly this service."
              },
              {
                "id": "m7-r2-2",
                "type": "choice",
                "text": "Which notice suits this person? Someone prefers a smaller, quieter group.",
                "options": [
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H"
                ],
                "answers": [
                  "B"
                ],
                "explanation": "Notice B offers exactly this service."
              },
              {
                "id": "m7-r2-3",
                "type": "choice",
                "text": "Which notice suits this person? A person needs access information.",
                "options": [
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I"
                ],
                "answers": [
                  "C"
                ],
                "explanation": "Notice C offers exactly this service."
              },
              {
                "id": "m7-r2-4",
                "type": "choice",
                "text": "Which notice suits this person? A learner wants a hands-on demonstration.",
                "options": [
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J"
                ],
                "answers": [
                  "D"
                ],
                "explanation": "Notice D offers exactly this service."
              },
              {
                "id": "m7-r2-5",
                "type": "choice",
                "text": "Which notice suits this person? A parent wants to bring a child.",
                "options": [
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A"
                ],
                "answers": [
                  "E"
                ],
                "explanation": "Notice E offers exactly this service."
              },
              {
                "id": "m7-r2-6",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants to inspect the evidence.",
                "options": [
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B"
                ],
                "answers": [
                  "F"
                ],
                "explanation": "Notice F offers exactly this service."
              },
              {
                "id": "m7-r2-7",
                "type": "choice",
                "text": "Which notice suits this person? A resident wants to help with the next event.",
                "options": [
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C"
                ],
                "answers": [
                  "G"
                ],
                "explanation": "Notice G offers exactly this service."
              },
              {
                "id": "m7-r2-8",
                "type": "choice",
                "text": "Which notice suits this person? Someone has only twenty minutes available.",
                "options": [
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D"
                ],
                "answers": [
                  "H"
                ],
                "explanation": "Notice H offers exactly this service."
              }
            ]
          },
          {
            "id": "reading-p3",
            "title": "Paragraph headings",
            "text": "Headings: A. The original difficulty | B. A practical adjustment | C. Collecting information | D. What the figures show | E. A reason for caution | F. The next question | G. A celebrity endorsement | H. An unrelated invention\n\nA. The idea behind coastal science began with monitoring changes along the shoreline. People welcomed the aim, but the first arrangement was less reliable than the team expected. In particular, strong winds delayed a planned boat survey. Several participants described this as a problem of planning rather than a reason to abandon the work. Their observations were recorded instead of being dismissed.\n\nB. The organisers compared a complicated solution with a manageable one. They chose to collect samples from the sheltered inlet. This did not remove every difficulty, yet it made the next session possible without asking volunteers to start again. Nadia then explained the revised procedure to participants, including those who had missed the first announcement.\n\nC. Good intentions alone could not tell the team whether the change helped. They gathered photographs checked by two researchers and kept notes about the conditions under which each observation was made. When a record was incomplete, they marked it as uncertain rather than filling in a likely answer. This made the report less dramatic but more useful.\n\nD. According to the team, volunteers recorded five unfamiliar plant species. The figure attracted attention because it described an observable outcome, not merely a prediction. It also encouraged more residents to ask how they could take part. However, a number by itself says little about the people or circumstances behind it.\n\nE. The report acknowledges that one season cannot establish a long-term trend. A different location, season or group of participants might produce a different result. The team therefore resisted a claim that its method was universally successful. This careful interpretation helped readers separate the evidence from the organisers' hopes.\n\nF. The final recommendation was to repeat sampling every spring. Before doing so, the organisers want to agree on clear measures of success and an accessible way to collect comments. They also plan to compare citizen observations with one-off publicity campaigns rather than assuming one choice will be best for every participant.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-r3-1",
                "type": "choice",
                "text": "Choose a heading for paragraph A.",
                "options": [
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement"
                ],
                "answers": [
                  "The original difficulty"
                ],
                "explanation": "Paragraph A develops the idea “the original difficulty”."
              },
              {
                "id": "m7-r3-2",
                "type": "choice",
                "text": "Choose a heading for paragraph B.",
                "options": [
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention"
                ],
                "answers": [
                  "A practical adjustment"
                ],
                "explanation": "Paragraph B develops the idea “a practical adjustment”."
              },
              {
                "id": "m7-r3-3",
                "type": "choice",
                "text": "Choose a heading for paragraph C.",
                "options": [
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty"
                ],
                "answers": [
                  "Collecting information"
                ],
                "explanation": "Paragraph C develops the idea “collecting information”."
              },
              {
                "id": "m7-r3-4",
                "type": "choice",
                "text": "Choose a heading for paragraph D.",
                "options": [
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment"
                ],
                "answers": [
                  "What the figures show"
                ],
                "explanation": "Paragraph D develops the idea “what the figures show”."
              },
              {
                "id": "m7-r3-5",
                "type": "choice",
                "text": "Choose a heading for paragraph E.",
                "options": [
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information"
                ],
                "answers": [
                  "A reason for caution"
                ],
                "explanation": "Paragraph E develops the idea “a reason for caution”."
              },
              {
                "id": "m7-r3-6",
                "type": "choice",
                "text": "Choose a heading for paragraph F.",
                "options": [
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show"
                ],
                "answers": [
                  "The next question"
                ],
                "explanation": "Paragraph F develops the idea “the next question”."
              }
            ]
          },
          {
            "id": "reading-p4",
            "title": "Detailed article",
            "text": "An invitation to take part in coastal science appeared at Bay Research Centre. Its stated aim was monitoring changes along the shoreline. The first public meeting was held on Monday, and Nadia collected the comments. Early reports suggested enthusiasm, but the team also heard practical concerns. Most notably, strong winds delayed a planned boat survey. It would have been easy to present this as a minor inconvenience. Instead, the organisers documented it and chose to collect samples from the sheltered inlet.\n\nThe revised activity did not follow exactly the original schedule. The organisers tested the change, recorded photographs checked by two researchers, and compared comments made before and after the adjustment. Their report states that volunteers recorded five unfamiliar plant species. The authors are careful to explain the difference between an observation and a prediction: a positive first month does not guarantee a positive first year.\n\nTwo alternatives were discussed. Some participants supported citizen observations; others preferred one-off publicity campaigns. Neither option was dismissed without consideration. The report ultimately recommended a limited further trial rather than an immediate permanent decision. Its main reservation was that one season cannot establish a long-term trend. Nadia said that the next stage would be to repeat sampling every spring.\n\nThe report does not give the ages of the visitors, the exact amount of any future grant, or a date for publishing a second edition. Those details may matter later, but a reader should not invent them now. The value of the project lies partly in its willingness to say what remains unknown.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-r4-1",
                "type": "choice",
                "text": "What was the stated aim of the project?",
                "options": [
                  "to close the venue",
                  "monitoring changes along the shoreline",
                  "to sell souvenirs",
                  "to replace public transport"
                ],
                "answers": [
                  "monitoring changes along the shoreline"
                ],
                "explanation": "The opening paragraph states the aim."
              },
              {
                "id": "m7-r4-2",
                "type": "choice",
                "text": "What led the organisers to revise the activity?",
                "options": [
                  "strong winds delayed a planned boat survey",
                  "a new mayor",
                  "a cancelled newspaper",
                  "a competition prize"
                ],
                "answers": [
                  "strong winds delayed a planned boat survey"
                ],
                "explanation": "The reported problem led directly to the adjustment."
              },
              {
                "id": "m7-r4-3",
                "type": "choice",
                "text": "Which action did the organisers take?",
                "options": [
                  "stop collecting comments",
                  "claim guaranteed success",
                  "ignore accessibility",
                  "collect samples from the sheltered inlet"
                ],
                "answers": [
                  "collect samples from the sheltered inlet"
                ],
                "explanation": "The revised action is explicitly described."
              },
              {
                "id": "m7-r4-4",
                "type": "choice",
                "text": "How do the authors treat the positive early result?",
                "options": [
                  "As an error to hide",
                  "As irrelevant to the project",
                  "As useful but limited evidence",
                  "As proof for every community"
                ],
                "answers": [
                  "As useful but limited evidence"
                ],
                "explanation": "The text distinguishes observation from prediction."
              },
              {
                "id": "m7-r4-5",
                "type": "choice",
                "text": "True / False / Not Given: The team recorded information during the revised activity.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The second paragraph says the team recorded evidence."
              },
              {
                "id": "m7-r4-6",
                "type": "choice",
                "text": "True / False / Not Given: The organisers permanently rejected both alternatives.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "False"
                ],
                "explanation": "Both alternatives were considered; a further trial was recommended."
              },
              {
                "id": "m7-r4-7",
                "type": "choice",
                "text": "True / False / Not Given: Every visitor was younger than eighteen.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No ages are supplied."
              },
              {
                "id": "m7-r4-8",
                "type": "choice",
                "text": "True / False / Not Given: The report identifies a limitation of the trial.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The report acknowledges a limitation."
              },
              {
                "id": "m7-r4-9",
                "type": "choice",
                "text": "True / False / Not Given: A second edition will be published next month.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No date for a second edition is given."
              }
            ]
          },
          {
            "id": "reading-p5",
            "title": "Analysis and inference",
            "text": "The organisers at Bay Research Centre made a useful distinction between a change that is easy to announce and a change that can be evaluated. Their focus was monitoring changes along the shoreline. During the first stage, strong winds delayed a planned boat survey. The immediate response was to collect samples from the sheltered inlet, but the team did not describe this response as a complete solution.\n\nTo check what happened, they collected photographs checked by two researchers. The report highlighted a figure of 5. A short account of the trial was sent to Nadia, who asked for more information about the conditions in which it took place. In particular, one season cannot establish a long-term trend. This mattered because an impressive number from a narrow trial can be misleading when removed from its context.\n\nAt the next meeting, participants will compare citizen observations with one-off publicity campaigns. They will also consider how to repeat sampling every spring. The discussion is designed to invite disagreement supported by reasons, not to reward the loudest speaker. If the group can repeat the trial and explain its limitations clearly, the result will be more useful to other communities.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-r5-1",
                "type": "text",
                "text": "Which venue hosted the organisers? Write ONE word from the venue name.",
                "options": [],
                "answers": [
                  "Bay"
                ],
                "explanation": "The venue starts with Bay."
              },
              {
                "id": "m7-r5-2",
                "type": "text",
                "text": "What figure did the report highlight? Write ONE number.",
                "options": [],
                "answers": [
                  "5"
                ],
                "explanation": "The figure given is 5."
              },
              {
                "id": "m7-r5-3",
                "type": "text",
                "text": "Who requested more information? Write ONE name.",
                "options": [],
                "answers": [
                  "Nadia"
                ],
                "explanation": "The text names Nadia."
              },
              {
                "id": "m7-r5-4",
                "type": "text",
                "text": "What can be misleading without context? Write ONE word.",
                "options": [],
                "answers": [
                  "number"
                ],
                "explanation": "The passage describes an impressive number from a narrow trial."
              },
              {
                "id": "m7-r5-5",
                "type": "choice",
                "text": "Why does the writer mention the limitation?",
                "options": [
                  "To hide the report",
                  "To prevent an overconfident conclusion",
                  "To argue that evidence is useless",
                  "To avoid hearing from participants"
                ],
                "answers": [
                  "To prevent an overconfident conclusion"
                ],
                "explanation": "The writer warns against removing the result from context."
              },
              {
                "id": "m7-r5-6",
                "type": "choice",
                "text": "What attitude does the final paragraph encourage?",
                "options": [
                  "Reasoned disagreement",
                  "Silence at meetings",
                  "Immediate approval of every idea",
                  "Competition for attention"
                ],
                "answers": [
                  "Reasoned disagreement"
                ],
                "explanation": "The group invites disagreement supported by reasons."
              }
            ]
          }
        ]
      },
      {
        "skill": "writing",
        "minutes": 60,
        "parts": [
          {
            "id": "writing-p1",
            "title": "Tasks 1.1, 1.2 and 2",
            "text": "Write all three responses. Your work is assessed by an administrator.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-w1",
                "type": "writing",
                "text": "You and a friend attended an activity about coastal science. Write an informal message to your friend. Explain what you enjoyed and suggest one thing to do next. Aim for about 50 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m7-w2",
                "type": "writing",
                "text": "Write to Nadia, the organiser at Bay Research Centre. Explain why you attended, describe the difficulty (“strong winds delayed a planned boat survey”), and suggest a practical improvement. Use a suitable formal tone. Aim for about 120–150 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m7-w3",
                "type": "writing",
                "text": "Some people think communities should invest in citizen observations; others prefer one-off publicity campaigns. Discuss both views and explain which approach would better support monitoring changes along the shoreline. Give reasons and examples. Aim for about 180–220 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      },
      {
        "skill": "speaking",
        "minutes": 15,
        "parts": [
          {
            "id": "speaking-p1",
            "title": "Part 1.1 — personal questions",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-s1-1",
                "type": "speaking",
                "text": "What do you enjoy doing in your neighbourhood?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m7-s1-2",
                "type": "speaking",
                "text": "How do you usually learn about local events?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m7-s1-3",
                "type": "speaking",
                "text": "Have you ever visited a place like Bay Research Centre?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p2",
            "title": "Part 1.2 — compare two scenes",
            "text": "Scene A: a small group working together. Scene B: a large public presentation. Compare the two situations.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-s2-1",
                "type": "speaking",
                "text": "Compare a small group discussion at Bay Research Centre with a large public meeting. What might each be like?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m7-s2-2",
                "type": "speaking",
                "text": "Which setting would help people discuss coastal science more effectively, and why?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m7-s2-3",
                "type": "speaking",
                "text": "Would your preference change if you were presenting rather than listening?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p3",
            "title": "Part 2 — extended answer",
            "text": "Prepare for one minute; speak for about two minutes.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-s3-1",
                "type": "speaking",
                "text": "Discuss this issue: should communities prioritise citizen observations or one-off publicity campaigns? Give advantages, disadvantages and examples connected with monitoring changes along the shoreline.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p4",
            "title": "Part 3 — argument",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m7-s4-1",
                "type": "speaking",
                "text": "“A small successful trial is enough to justify a permanent public policy.” Discuss both sides of this claim. Refer to the limitation that one season cannot establish a long-term trend.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Multilevel Mock 08 · Digital archives",
    "description": "Original mashq varianti: digital archives. 35 Listening, 35 Reading, 3 Writing va 8 Speaking topshirig‘i. Rasmiy test savollari emas.",
    "level": "B1–C1",
    "format": "multilevel",
    "rightsConfirmed": true,
    "seedKey": "sinfquiz-multilevel-8",
    "sections": [
      {
        "skill": "listening",
        "minutes": 45,
        "parts": [
          {
            "id": "listening-p1",
            "title": "Short announcements",
            "text": "Listen to eight short messages. Choose the best answer for each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-8-part-1.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-l1-1",
                "type": "choice",
                "text": "When does the meeting begin?",
                "options": [
                  "15:35",
                  "15:00",
                  "12:00"
                ],
                "answers": [
                  "15:35"
                ],
                "explanation": "The announcement says: The first message said 15:00, but the digital archives meeting now starts at 15:35."
              },
              {
                "id": "m8-l1-2",
                "type": "choice",
                "text": "Where will people meet?",
                "options": [
                  "the town hall",
                  "the railway café",
                  "Civic Records Centre"
                ],
                "answers": [
                  "Civic Records Centre"
                ],
                "explanation": "The announcement says: We are meeting at Civic Records Centre. Please do not wait at the old entrance."
              },
              {
                "id": "m8-l1-3",
                "type": "choice",
                "text": "What should visitors bring?",
                "options": [
                  "a camera",
                  "an old photograph",
                  "a printed ticket"
                ],
                "answers": [
                  "an old photograph"
                ],
                "explanation": "The announcement says: Before you leave home, remember to bring an old photograph. Other equipment is provided."
              },
              {
                "id": "m8-l1-4",
                "type": "choice",
                "text": "What is the last day to register?",
                "options": [
                  "Wednesday",
                  "the following weekend",
                  "the day after the event"
                ],
                "answers": [
                  "Wednesday"
                ],
                "explanation": "The announcement says: You can sign up until Wednesday. We cannot add names at the door."
              },
              {
                "id": "m8-l1-5",
                "type": "choice",
                "text": "How much is admission?",
                "options": [
                  "five pounds",
                  "ten pounds",
                  "free"
                ],
                "answers": [
                  "free"
                ],
                "explanation": "The announcement says: Admission is free. The amount covers the materials, and there is no extra charge."
              },
              {
                "id": "m8-l1-6",
                "type": "choice",
                "text": "Who can answer questions?",
                "options": [
                  "the driver",
                  "Imran",
                  "the caretaker"
                ],
                "answers": [
                  "Imran"
                ],
                "explanation": "The announcement says: If you have a question, ask for Imran at the information desk."
              },
              {
                "id": "m8-l1-7",
                "type": "choice",
                "text": "What did the team decide to do?",
                "options": [
                  "add a short interview before scanning",
                  "cancel the entire project",
                  "ignore the difficulty"
                ],
                "answers": [
                  "add a short interview before scanning"
                ],
                "explanation": "The announcement says: Because several images lacked dates or names, the team decided to add a short interview before scanning."
              },
              {
                "id": "m8-l1-8",
                "type": "choice",
                "text": "What is the main purpose?",
                "options": [
                  "to sell more tickets",
                  "to replace every volunteer",
                  "preserving family records responsibly"
                ],
                "answers": [
                  "preserving family records responsibly"
                ],
                "explanation": "The announcement says: We are doing this to support preserving family records responsibly, not simply to advertise the event."
              }
            ]
          },
          {
            "id": "listening-p2",
            "title": "Briefing notes",
            "text": "Listen to the briefing. Complete the notes with one word or number.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-8-part-2.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-l2-1",
                "type": "text",
                "text": "Which day is the briefing held? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Thursday"
                ],
                "explanation": "The briefing explicitly gives Thursday."
              },
              {
                "id": "m8-l2-2",
                "type": "text",
                "text": "What time does the briefing start? Write ONE word or number.",
                "options": [],
                "answers": [
                  "15:35"
                ],
                "explanation": "The briefing explicitly gives 15:35."
              },
              {
                "id": "m8-l2-3",
                "type": "text",
                "text": "Who leads the first session? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Imran"
                ],
                "explanation": "The briefing explicitly gives Imran."
              },
              {
                "id": "m8-l2-4",
                "type": "text",
                "text": "What is the registration deadline? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Wednesday"
                ],
                "explanation": "The briefing explicitly gives Wednesday."
              },
              {
                "id": "m8-l2-5",
                "type": "text",
                "text": "How many entries were recorded? Write ONE word or number.",
                "options": [],
                "answers": [
                  "60"
                ],
                "explanation": "The briefing explicitly gives 60."
              },
              {
                "id": "m8-l2-6",
                "type": "text",
                "text": "Which word describes the main concern? Write ONE word or number.",
                "options": [],
                "answers": [
                  "context"
                ],
                "explanation": "The briefing explicitly gives context."
              }
            ]
          },
          {
            "id": "listening-p3",
            "title": "Four speakers",
            "text": "Match four speakers with the main ideas. Two options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-8-part-3.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-l3-1",
                "type": "choice",
                "text": "Match speaker 1 with the main idea.",
                "options": [
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback"
                ],
                "answers": [
                  "Personal motivation"
                ],
                "explanation": "Speaker 1 focuses on personal motivation."
              },
              {
                "id": "m8-l3-2",
                "type": "choice",
                "text": "Match speaker 2 with the main idea.",
                "options": [
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result"
                ],
                "answers": [
                  "Learning from a setback"
                ],
                "explanation": "Speaker 2 focuses on learning from a setback."
              },
              {
                "id": "m8-l3-3",
                "type": "choice",
                "text": "Match speaker 3 with the main idea.",
                "options": [
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage"
                ],
                "answers": [
                  "Cautious optimism about a result"
                ],
                "explanation": "Speaker 3 focuses on cautious optimism about a result."
              },
              {
                "id": "m8-l3-4",
                "type": "choice",
                "text": "Match speaker 4 with the main idea.",
                "options": [
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor"
                ],
                "answers": [
                  "Planning the next stage"
                ],
                "explanation": "Speaker 4 focuses on planning the next stage."
              }
            ]
          },
          {
            "id": "listening-p4",
            "title": "Responding to requests",
            "text": "Match each request to the response. Three options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-8-part-4.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-l4-1",
                "type": "choice",
                "text": "Which response was given to a visitor who cannot reach the upper floor?",
                "options": [
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers"
                ],
                "answers": [
                  "Move activities to an accessible room"
                ],
                "explanation": "The announcement connects this request with “move activities to an accessible room”."
              },
              {
                "id": "m8-l4-2",
                "type": "choice",
                "text": "Which response was given to a volunteer who needs to know the arrival time?",
                "options": [
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room"
                ],
                "answers": [
                  "Check the revised schedule"
                ],
                "explanation": "The announcement connects this request with “check the revised schedule”."
              },
              {
                "id": "m8-l4-3",
                "type": "choice",
                "text": "Which response was given to someone who wants the project to continue?",
                "options": [
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule"
                ],
                "answers": [
                  "Help plan a follow-up session"
                ],
                "explanation": "The announcement connects this request with “help plan a follow-up session”."
              },
              {
                "id": "m8-l4-4",
                "type": "choice",
                "text": "Which response was given to a researcher questioning the findings?",
                "options": [
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session"
                ],
                "answers": [
                  "Explain the sample limitation"
                ],
                "explanation": "The announcement connects this request with “explain the sample limitation”."
              },
              {
                "id": "m8-l4-5",
                "type": "choice",
                "text": "Which response was given to a participant with an item to bring?",
                "options": [
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation"
                ],
                "answers": [
                  "Read the equipment list"
                ],
                "explanation": "The announcement connects this request with “read the equipment list”."
              }
            ]
          },
          {
            "id": "listening-p5",
            "title": "Three conversations",
            "text": "Listen to three conversations. Answer two questions about each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-8-part-5.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-l5-1",
                "type": "choice",
                "text": "Why is the speaker cautious?",
                "options": [
                  "The report was lost.",
                  "some stories cannot be independently verified",
                  "There was no trial."
                ],
                "answers": [
                  "some stories cannot be independently verified"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m8-l5-2",
                "type": "choice",
                "text": "What does the speaker recommend?",
                "options": [
                  "another trial",
                  "closing the project",
                  "buying a larger room"
                ],
                "answers": [
                  "another trial"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m8-l5-3",
                "type": "choice",
                "text": "Which option does the second speaker prefer?",
                "options": [
                  "careful cataloguing",
                  "automatic uploads without review",
                  "neither option"
                ],
                "answers": [
                  "careful cataloguing"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m8-l5-4",
                "type": "choice",
                "text": "Why does the speaker prefer it?",
                "options": [
                  "it is the oldest option",
                  "it needs no volunteers",
                  "preserving family records responsibly"
                ],
                "answers": [
                  "preserving family records responsibly"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m8-l5-5",
                "type": "choice",
                "text": "Who will speak?",
                "options": [
                  "the driver",
                  "the caretaker",
                  "Imran"
                ],
                "answers": [
                  "Imran"
                ],
                "explanation": "Conversation 3 states this clearly."
              },
              {
                "id": "m8-l5-6",
                "type": "choice",
                "text": "Why did the plan change?",
                "options": [
                  "a change in the weather forecast",
                  "several images lacked dates or names",
                  "a lack of interest"
                ],
                "answers": [
                  "several images lacked dates or names"
                ],
                "explanation": "Conversation 3 states this clearly."
              }
            ]
          },
          {
            "id": "listening-p6",
            "title": "Project lecture",
            "text": "Listen to the lecture and write one word or number for each answer.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-8-part-6.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-l6-1",
                "type": "text",
                "text": "What do the collected records form? Write ONE word or number.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "The lecture uses the word evidence."
              },
              {
                "id": "m8-l6-2",
                "type": "text",
                "text": "What is the total highlighted in the report? Write ONE word or number.",
                "options": [],
                "answers": [
                  "60"
                ],
                "explanation": "The lecture uses the word 60."
              },
              {
                "id": "m8-l6-3",
                "type": "text",
                "text": "Which word describes the key idea? Write ONE word or number.",
                "options": [],
                "answers": [
                  "context"
                ],
                "explanation": "The lecture uses the word context."
              },
              {
                "id": "m8-l6-4",
                "type": "text",
                "text": "What did the team ask visitors for? Write ONE word or number.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "The lecture uses the word feedback."
              },
              {
                "id": "m8-l6-5",
                "type": "text",
                "text": "What must be understood behind a result? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conditions"
                ],
                "explanation": "The lecture uses the word conditions."
              },
              {
                "id": "m8-l6-6",
                "type": "text",
                "text": "Which section contains the final interpretation? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conclusions"
                ],
                "explanation": "The lecture uses the word conclusions."
              }
            ]
          }
        ]
      },
      {
        "skill": "reading",
        "minutes": 60,
        "parts": [
          {
            "id": "reading-p1",
            "title": "One-word gaps",
            "text": "The digital archives project depended on (1) ____ who gave their time freely. At first, the team followed a fixed (2) ____, but several images lacked dates or names. Careful (3) ____ showed exactly when the difficulty appeared. The organisers asked visitors for (4) ____ before changing the plan. They also wanted better (5) ____ for people who could not use the first arrangement. In the end, the strongest (6) ____ came from catalogue entries from twelve families. None of these observations proves that the same approach would work in every town. Nevertheless, the group learned why small, well-recorded changes can matter. Its next meeting will consider whether teach volunteers basic metadata checks is practical and who could help.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-r1-1",
                "type": "text",
                "text": "Complete gap 1 with ONE word.",
                "options": [],
                "answers": [
                  "volunteers"
                ],
                "explanation": "“volunteers” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m8-r1-2",
                "type": "text",
                "text": "Complete gap 2 with ONE word.",
                "options": [],
                "answers": [
                  "schedule"
                ],
                "explanation": "“schedule” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m8-r1-3",
                "type": "text",
                "text": "Complete gap 3 with ONE word.",
                "options": [],
                "answers": [
                  "records"
                ],
                "explanation": "“records” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m8-r1-4",
                "type": "text",
                "text": "Complete gap 4 with ONE word.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "“feedback” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m8-r1-5",
                "type": "text",
                "text": "Complete gap 5 with ONE word.",
                "options": [],
                "answers": [
                  "access"
                ],
                "explanation": "“access” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m8-r1-6",
                "type": "text",
                "text": "Complete gap 6 with ONE word.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "“evidence” makes the sentence grammatically and logically complete."
              }
            ]
          },
          {
            "id": "reading-p2",
            "title": "Notices and needs",
            "text": "A. Guided introduction: meet Imran at Civic Records Centre on Thursday.\nB. Quiet hour: a smaller group meets before the main session.\nC. Access help: ask about step-free rooms and larger-print information.\nD. Skills desk: volunteers demonstrate practical methods and tools.\nE. Family visit: activities are planned for adults and children together.\nF. Research corner: examine the report and ask how information was collected.\nG. Follow-up team: help organise teach volunteers basic metadata checks.\nH. Short briefing: Imran gives a twenty-minute overview.\nI. Merchandise desk: souvenirs are available after the event.\nJ. Private room hire: businesses can book an unrelated meeting.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-r2-1",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants a guided introduction.",
                "options": [
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H"
                ],
                "answers": [
                  "A"
                ],
                "explanation": "Notice A offers exactly this service."
              },
              {
                "id": "m8-r2-2",
                "type": "choice",
                "text": "Which notice suits this person? Someone prefers a smaller, quieter group.",
                "options": [
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I"
                ],
                "answers": [
                  "B"
                ],
                "explanation": "Notice B offers exactly this service."
              },
              {
                "id": "m8-r2-3",
                "type": "choice",
                "text": "Which notice suits this person? A person needs access information.",
                "options": [
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J"
                ],
                "answers": [
                  "C"
                ],
                "explanation": "Notice C offers exactly this service."
              },
              {
                "id": "m8-r2-4",
                "type": "choice",
                "text": "Which notice suits this person? A learner wants a hands-on demonstration.",
                "options": [
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A"
                ],
                "answers": [
                  "D"
                ],
                "explanation": "Notice D offers exactly this service."
              },
              {
                "id": "m8-r2-5",
                "type": "choice",
                "text": "Which notice suits this person? A parent wants to bring a child.",
                "options": [
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B"
                ],
                "answers": [
                  "E"
                ],
                "explanation": "Notice E offers exactly this service."
              },
              {
                "id": "m8-r2-6",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants to inspect the evidence.",
                "options": [
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C"
                ],
                "answers": [
                  "F"
                ],
                "explanation": "Notice F offers exactly this service."
              },
              {
                "id": "m8-r2-7",
                "type": "choice",
                "text": "Which notice suits this person? A resident wants to help with the next event.",
                "options": [
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D"
                ],
                "answers": [
                  "G"
                ],
                "explanation": "Notice G offers exactly this service."
              },
              {
                "id": "m8-r2-8",
                "type": "choice",
                "text": "Which notice suits this person? Someone has only twenty minutes available.",
                "options": [
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E"
                ],
                "answers": [
                  "H"
                ],
                "explanation": "Notice H offers exactly this service."
              }
            ]
          },
          {
            "id": "reading-p3",
            "title": "Paragraph headings",
            "text": "Headings: A. The original difficulty | B. A practical adjustment | C. Collecting information | D. What the figures show | E. A reason for caution | F. The next question | G. A celebrity endorsement | H. An unrelated invention\n\nA. The idea behind digital archives began with preserving family records responsibly. People welcomed the aim, but the first arrangement was less reliable than the team expected. In particular, several images lacked dates or names. Several participants described this as a problem of planning rather than a reason to abandon the work. Their observations were recorded instead of being dismissed.\n\nB. The organisers compared a complicated solution with a manageable one. They chose to add a short interview before scanning. This did not remove every difficulty, yet it made the next session possible without asking volunteers to start again. Imran then explained the revised procedure to participants, including those who had missed the first announcement.\n\nC. Good intentions alone could not tell the team whether the change helped. They gathered catalogue entries from twelve families and kept notes about the conditions under which each observation was made. When a record was incomplete, they marked it as uncertain rather than filling in a likely answer. This made the report less dramatic but more useful.\n\nD. According to the team, more than sixty photographs gained useful descriptions. The figure attracted attention because it described an observable outcome, not merely a prediction. It also encouraged more residents to ask how they could take part. However, a number by itself says little about the people or circumstances behind it.\n\nE. The report acknowledges that some stories cannot be independently verified. A different location, season or group of participants might produce a different result. The team therefore resisted a claim that its method was universally successful. This careful interpretation helped readers separate the evidence from the organisers' hopes.\n\nF. The final recommendation was to teach volunteers basic metadata checks. Before doing so, the organisers want to agree on clear measures of success and an accessible way to collect comments. They also plan to compare careful cataloguing with automatic uploads without review rather than assuming one choice will be best for every participant.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-r3-1",
                "type": "choice",
                "text": "Choose a heading for paragraph A.",
                "options": [
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention"
                ],
                "answers": [
                  "The original difficulty"
                ],
                "explanation": "Paragraph A develops the idea “the original difficulty”."
              },
              {
                "id": "m8-r3-2",
                "type": "choice",
                "text": "Choose a heading for paragraph B.",
                "options": [
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty"
                ],
                "answers": [
                  "A practical adjustment"
                ],
                "explanation": "Paragraph B develops the idea “a practical adjustment”."
              },
              {
                "id": "m8-r3-3",
                "type": "choice",
                "text": "Choose a heading for paragraph C.",
                "options": [
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment"
                ],
                "answers": [
                  "Collecting information"
                ],
                "explanation": "Paragraph C develops the idea “collecting information”."
              },
              {
                "id": "m8-r3-4",
                "type": "choice",
                "text": "Choose a heading for paragraph D.",
                "options": [
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information"
                ],
                "answers": [
                  "What the figures show"
                ],
                "explanation": "Paragraph D develops the idea “what the figures show”."
              },
              {
                "id": "m8-r3-5",
                "type": "choice",
                "text": "Choose a heading for paragraph E.",
                "options": [
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show"
                ],
                "answers": [
                  "A reason for caution"
                ],
                "explanation": "Paragraph E develops the idea “a reason for caution”."
              },
              {
                "id": "m8-r3-6",
                "type": "choice",
                "text": "Choose a heading for paragraph F.",
                "options": [
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution"
                ],
                "answers": [
                  "The next question"
                ],
                "explanation": "Paragraph F develops the idea “the next question”."
              }
            ]
          },
          {
            "id": "reading-p4",
            "title": "Detailed article",
            "text": "An invitation to take part in digital archives appeared at Civic Records Centre. Its stated aim was preserving family records responsibly. The first public meeting was held on Thursday, and Imran collected the comments. Early reports suggested enthusiasm, but the team also heard practical concerns. Most notably, several images lacked dates or names. It would have been easy to present this as a minor inconvenience. Instead, the organisers documented it and chose to add a short interview before scanning.\n\nThe revised activity did not follow exactly the original schedule. The organisers tested the change, recorded catalogue entries from twelve families, and compared comments made before and after the adjustment. Their report states that more than sixty photographs gained useful descriptions. The authors are careful to explain the difference between an observation and a prediction: a positive first month does not guarantee a positive first year.\n\nTwo alternatives were discussed. Some participants supported careful cataloguing; others preferred automatic uploads without review. Neither option was dismissed without consideration. The report ultimately recommended a limited further trial rather than an immediate permanent decision. Its main reservation was that some stories cannot be independently verified. Imran said that the next stage would be to teach volunteers basic metadata checks.\n\nThe report does not give the ages of the visitors, the exact amount of any future grant, or a date for publishing a second edition. Those details may matter later, but a reader should not invent them now. The value of the project lies partly in its willingness to say what remains unknown.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-r4-1",
                "type": "choice",
                "text": "What was the stated aim of the project?",
                "options": [
                  "preserving family records responsibly",
                  "to sell souvenirs",
                  "to replace public transport",
                  "to close the venue"
                ],
                "answers": [
                  "preserving family records responsibly"
                ],
                "explanation": "The opening paragraph states the aim."
              },
              {
                "id": "m8-r4-2",
                "type": "choice",
                "text": "What led the organisers to revise the activity?",
                "options": [
                  "a new mayor",
                  "a cancelled newspaper",
                  "a competition prize",
                  "several images lacked dates or names"
                ],
                "answers": [
                  "several images lacked dates or names"
                ],
                "explanation": "The reported problem led directly to the adjustment."
              },
              {
                "id": "m8-r4-3",
                "type": "choice",
                "text": "Which action did the organisers take?",
                "options": [
                  "claim guaranteed success",
                  "ignore accessibility",
                  "add a short interview before scanning",
                  "stop collecting comments"
                ],
                "answers": [
                  "add a short interview before scanning"
                ],
                "explanation": "The revised action is explicitly described."
              },
              {
                "id": "m8-r4-4",
                "type": "choice",
                "text": "How do the authors treat the positive early result?",
                "options": [
                  "As irrelevant to the project",
                  "As useful but limited evidence",
                  "As proof for every community",
                  "As an error to hide"
                ],
                "answers": [
                  "As useful but limited evidence"
                ],
                "explanation": "The text distinguishes observation from prediction."
              },
              {
                "id": "m8-r4-5",
                "type": "choice",
                "text": "True / False / Not Given: The team recorded information during the revised activity.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The second paragraph says the team recorded evidence."
              },
              {
                "id": "m8-r4-6",
                "type": "choice",
                "text": "True / False / Not Given: The organisers permanently rejected both alternatives.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "False"
                ],
                "explanation": "Both alternatives were considered; a further trial was recommended."
              },
              {
                "id": "m8-r4-7",
                "type": "choice",
                "text": "True / False / Not Given: Every visitor was younger than eighteen.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No ages are supplied."
              },
              {
                "id": "m8-r4-8",
                "type": "choice",
                "text": "True / False / Not Given: The report identifies a limitation of the trial.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The report acknowledges a limitation."
              },
              {
                "id": "m8-r4-9",
                "type": "choice",
                "text": "True / False / Not Given: A second edition will be published next month.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No date for a second edition is given."
              }
            ]
          },
          {
            "id": "reading-p5",
            "title": "Analysis and inference",
            "text": "The organisers at Civic Records Centre made a useful distinction between a change that is easy to announce and a change that can be evaluated. Their focus was preserving family records responsibly. During the first stage, several images lacked dates or names. The immediate response was to add a short interview before scanning, but the team did not describe this response as a complete solution.\n\nTo check what happened, they collected catalogue entries from twelve families. The report highlighted a figure of 60. A short account of the trial was sent to Imran, who asked for more information about the conditions in which it took place. In particular, some stories cannot be independently verified. This mattered because an impressive number from a narrow trial can be misleading when removed from its context.\n\nAt the next meeting, participants will compare careful cataloguing with automatic uploads without review. They will also consider how to teach volunteers basic metadata checks. The discussion is designed to invite disagreement supported by reasons, not to reward the loudest speaker. If the group can repeat the trial and explain its limitations clearly, the result will be more useful to other communities.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-r5-1",
                "type": "text",
                "text": "Which venue hosted the organisers? Write ONE word from the venue name.",
                "options": [],
                "answers": [
                  "Civic"
                ],
                "explanation": "The venue starts with Civic."
              },
              {
                "id": "m8-r5-2",
                "type": "text",
                "text": "What figure did the report highlight? Write ONE number.",
                "options": [],
                "answers": [
                  "60"
                ],
                "explanation": "The figure given is 60."
              },
              {
                "id": "m8-r5-3",
                "type": "text",
                "text": "Who requested more information? Write ONE name.",
                "options": [],
                "answers": [
                  "Imran"
                ],
                "explanation": "The text names Imran."
              },
              {
                "id": "m8-r5-4",
                "type": "text",
                "text": "What can be misleading without context? Write ONE word.",
                "options": [],
                "answers": [
                  "number"
                ],
                "explanation": "The passage describes an impressive number from a narrow trial."
              },
              {
                "id": "m8-r5-5",
                "type": "choice",
                "text": "Why does the writer mention the limitation?",
                "options": [
                  "To prevent an overconfident conclusion",
                  "To argue that evidence is useless",
                  "To avoid hearing from participants",
                  "To hide the report"
                ],
                "answers": [
                  "To prevent an overconfident conclusion"
                ],
                "explanation": "The writer warns against removing the result from context."
              },
              {
                "id": "m8-r5-6",
                "type": "choice",
                "text": "What attitude does the final paragraph encourage?",
                "options": [
                  "Silence at meetings",
                  "Immediate approval of every idea",
                  "Competition for attention",
                  "Reasoned disagreement"
                ],
                "answers": [
                  "Reasoned disagreement"
                ],
                "explanation": "The group invites disagreement supported by reasons."
              }
            ]
          }
        ]
      },
      {
        "skill": "writing",
        "minutes": 60,
        "parts": [
          {
            "id": "writing-p1",
            "title": "Tasks 1.1, 1.2 and 2",
            "text": "Write all three responses. Your work is assessed by an administrator.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-w1",
                "type": "writing",
                "text": "You and a friend attended an activity about digital archives. Write an informal message to your friend. Explain what you enjoyed and suggest one thing to do next. Aim for about 50 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m8-w2",
                "type": "writing",
                "text": "Write to Imran, the organiser at Civic Records Centre. Explain why you attended, describe the difficulty (“several images lacked dates or names”), and suggest a practical improvement. Use a suitable formal tone. Aim for about 120–150 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m8-w3",
                "type": "writing",
                "text": "Some people think communities should invest in careful cataloguing; others prefer automatic uploads without review. Discuss both views and explain which approach would better support preserving family records responsibly. Give reasons and examples. Aim for about 180–220 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      },
      {
        "skill": "speaking",
        "minutes": 15,
        "parts": [
          {
            "id": "speaking-p1",
            "title": "Part 1.1 — personal questions",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-s1-1",
                "type": "speaking",
                "text": "What do you enjoy doing in your neighbourhood?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m8-s1-2",
                "type": "speaking",
                "text": "How do you usually learn about local events?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m8-s1-3",
                "type": "speaking",
                "text": "Have you ever visited a place like Civic Records Centre?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p2",
            "title": "Part 1.2 — compare two scenes",
            "text": "Scene A: a small group working together. Scene B: a large public presentation. Compare the two situations.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-s2-1",
                "type": "speaking",
                "text": "Compare a small group discussion at Civic Records Centre with a large public meeting. What might each be like?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m8-s2-2",
                "type": "speaking",
                "text": "Which setting would help people discuss digital archives more effectively, and why?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m8-s2-3",
                "type": "speaking",
                "text": "Would your preference change if you were presenting rather than listening?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p3",
            "title": "Part 2 — extended answer",
            "text": "Prepare for one minute; speak for about two minutes.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-s3-1",
                "type": "speaking",
                "text": "Discuss this issue: should communities prioritise careful cataloguing or automatic uploads without review? Give advantages, disadvantages and examples connected with preserving family records responsibly.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p4",
            "title": "Part 3 — argument",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m8-s4-1",
                "type": "speaking",
                "text": "“A small successful trial is enough to justify a permanent public policy.” Discuss both sides of this claim. Refer to the limitation that some stories cannot be independently verified.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Multilevel Mock 09 · Food market",
    "description": "Original mashq varianti: food market. 35 Listening, 35 Reading, 3 Writing va 8 Speaking topshirig‘i. Rasmiy test savollari emas.",
    "level": "B1–C1",
    "format": "multilevel",
    "rightsConfirmed": true,
    "seedKey": "sinfquiz-multilevel-9",
    "sections": [
      {
        "skill": "listening",
        "minutes": 45,
        "parts": [
          {
            "id": "listening-p1",
            "title": "Short announcements",
            "text": "Listen to eight short messages. Choose the best answer for each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-9-part-1.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-l1-1",
                "type": "choice",
                "text": "When does the meeting begin?",
                "options": [
                  "08:40",
                  "08:00",
                  "12:00"
                ],
                "answers": [
                  "08:40"
                ],
                "explanation": "The announcement says: The first message said 08:00, but the food market meeting now starts at 08:40."
              },
              {
                "id": "m9-l1-2",
                "type": "choice",
                "text": "Where will people meet?",
                "options": [
                  "the town hall",
                  "the railway café",
                  "Northgate Market"
                ],
                "answers": [
                  "Northgate Market"
                ],
                "explanation": "The announcement says: We are meeting at Northgate Market. Please do not wait at the old entrance."
              },
              {
                "id": "m9-l1-3",
                "type": "choice",
                "text": "What should visitors bring?",
                "options": [
                  "a camera",
                  "a cloth bag",
                  "a printed ticket"
                ],
                "answers": [
                  "a cloth bag"
                ],
                "explanation": "The announcement says: Before you leave home, remember to bring a cloth bag. Other equipment is provided."
              },
              {
                "id": "m9-l1-4",
                "type": "choice",
                "text": "What is the last day to register?",
                "options": [
                  "Friday",
                  "the following weekend",
                  "the day after the event"
                ],
                "answers": [
                  "Friday"
                ],
                "explanation": "The announcement says: You can sign up until Friday. We cannot add names at the door."
              },
              {
                "id": "m9-l1-5",
                "type": "choice",
                "text": "How much is admission?",
                "options": [
                  "five pounds",
                  "ten pounds",
                  "one pound"
                ],
                "answers": [
                  "one pound"
                ],
                "explanation": "The announcement says: Admission is one pound. The amount covers the materials, and there is no extra charge."
              },
              {
                "id": "m9-l1-6",
                "type": "choice",
                "text": "Who can answer questions?",
                "options": [
                  "the driver",
                  "Ellen",
                  "the caretaker"
                ],
                "answers": [
                  "Ellen"
                ],
                "explanation": "The announcement says: If you have a question, ask for Ellen at the information desk."
              },
              {
                "id": "m9-l1-7",
                "type": "choice",
                "text": "What did the team decide to do?",
                "options": [
                  "organise a late-afternoon collection",
                  "cancel the entire project",
                  "ignore the difficulty"
                ],
                "answers": [
                  "organise a late-afternoon collection"
                ],
                "explanation": "The announcement says: Because unsold vegetables were thrown away, the team decided to organise a late-afternoon collection."
              },
              {
                "id": "m9-l1-8",
                "type": "choice",
                "text": "What is the main purpose?",
                "options": [
                  "to sell more tickets",
                  "to replace every volunteer",
                  "reducing waste at local markets"
                ],
                "answers": [
                  "reducing waste at local markets"
                ],
                "explanation": "The announcement says: We are doing this to support reducing waste at local markets, not simply to advertise the event."
              }
            ]
          },
          {
            "id": "listening-p2",
            "title": "Briefing notes",
            "text": "Listen to the briefing. Complete the notes with one word or number.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-9-part-2.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-l2-1",
                "type": "text",
                "text": "Which day is the briefing held? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Saturday"
                ],
                "explanation": "The briefing explicitly gives Saturday."
              },
              {
                "id": "m9-l2-2",
                "type": "text",
                "text": "What time does the briefing start? Write ONE word or number.",
                "options": [],
                "answers": [
                  "08:40"
                ],
                "explanation": "The briefing explicitly gives 08:40."
              },
              {
                "id": "m9-l2-3",
                "type": "text",
                "text": "Who leads the first session? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Ellen"
                ],
                "explanation": "The briefing explicitly gives Ellen."
              },
              {
                "id": "m9-l2-4",
                "type": "text",
                "text": "What is the registration deadline? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Friday"
                ],
                "explanation": "The briefing explicitly gives Friday."
              },
              {
                "id": "m9-l2-5",
                "type": "text",
                "text": "How many entries were recorded? Write ONE word or number.",
                "options": [],
                "answers": [
                  "80"
                ],
                "explanation": "The briefing explicitly gives 80."
              },
              {
                "id": "m9-l2-6",
                "type": "text",
                "text": "Which word describes the main concern? Write ONE word or number.",
                "options": [],
                "answers": [
                  "coordination"
                ],
                "explanation": "The briefing explicitly gives coordination."
              }
            ]
          },
          {
            "id": "listening-p3",
            "title": "Four speakers",
            "text": "Match four speakers with the main ideas. Two options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-9-part-3.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-l3-1",
                "type": "choice",
                "text": "Match speaker 1 with the main idea.",
                "options": [
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result"
                ],
                "answers": [
                  "Personal motivation"
                ],
                "explanation": "Speaker 1 focuses on personal motivation."
              },
              {
                "id": "m9-l3-2",
                "type": "choice",
                "text": "Match speaker 2 with the main idea.",
                "options": [
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage"
                ],
                "answers": [
                  "Learning from a setback"
                ],
                "explanation": "Speaker 2 focuses on learning from a setback."
              },
              {
                "id": "m9-l3-3",
                "type": "choice",
                "text": "Match speaker 3 with the main idea.",
                "options": [
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor"
                ],
                "answers": [
                  "Cautious optimism about a result"
                ],
                "explanation": "Speaker 3 focuses on cautious optimism about a result."
              },
              {
                "id": "m9-l3-4",
                "type": "choice",
                "text": "Match speaker 4 with the main idea.",
                "options": [
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project"
                ],
                "answers": [
                  "Planning the next stage"
                ],
                "explanation": "Speaker 4 focuses on planning the next stage."
              }
            ]
          },
          {
            "id": "listening-p4",
            "title": "Responding to requests",
            "text": "Match each request to the response. Three options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-9-part-4.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-l4-1",
                "type": "choice",
                "text": "Which response was given to a visitor who cannot reach the upper floor?",
                "options": [
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room"
                ],
                "answers": [
                  "Move activities to an accessible room"
                ],
                "explanation": "The announcement connects this request with “move activities to an accessible room”."
              },
              {
                "id": "m9-l4-2",
                "type": "choice",
                "text": "Which response was given to a volunteer who needs to know the arrival time?",
                "options": [
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule"
                ],
                "answers": [
                  "Check the revised schedule"
                ],
                "explanation": "The announcement connects this request with “check the revised schedule”."
              },
              {
                "id": "m9-l4-3",
                "type": "choice",
                "text": "Which response was given to someone who wants the project to continue?",
                "options": [
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session"
                ],
                "answers": [
                  "Help plan a follow-up session"
                ],
                "explanation": "The announcement connects this request with “help plan a follow-up session”."
              },
              {
                "id": "m9-l4-4",
                "type": "choice",
                "text": "Which response was given to a researcher questioning the findings?",
                "options": [
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation"
                ],
                "answers": [
                  "Explain the sample limitation"
                ],
                "explanation": "The announcement connects this request with “explain the sample limitation”."
              },
              {
                "id": "m9-l4-5",
                "type": "choice",
                "text": "Which response was given to a participant with an item to bring?",
                "options": [
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list"
                ],
                "answers": [
                  "Read the equipment list"
                ],
                "explanation": "The announcement connects this request with “read the equipment list”."
              }
            ]
          },
          {
            "id": "listening-p5",
            "title": "Three conversations",
            "text": "Listen to three conversations. Answer two questions about each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-9-part-5.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-l5-1",
                "type": "choice",
                "text": "Why is the speaker cautious?",
                "options": [
                  "the figures do not include home food waste",
                  "There was no trial.",
                  "The report was lost."
                ],
                "answers": [
                  "the figures do not include home food waste"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m9-l5-2",
                "type": "choice",
                "text": "What does the speaker recommend?",
                "options": [
                  "closing the project",
                  "buying a larger room",
                  "another trial"
                ],
                "answers": [
                  "another trial"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m9-l5-3",
                "type": "choice",
                "text": "Which option does the second speaker prefer?",
                "options": [
                  "larger disposable containers",
                  "neither option",
                  "redistribution"
                ],
                "answers": [
                  "redistribution"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m9-l5-4",
                "type": "choice",
                "text": "Why does the speaker prefer it?",
                "options": [
                  "it needs no volunteers",
                  "reducing waste at local markets",
                  "it is the oldest option"
                ],
                "answers": [
                  "reducing waste at local markets"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m9-l5-5",
                "type": "choice",
                "text": "Who will speak?",
                "options": [
                  "the caretaker",
                  "Ellen",
                  "the driver"
                ],
                "answers": [
                  "Ellen"
                ],
                "explanation": "Conversation 3 states this clearly."
              },
              {
                "id": "m9-l5-6",
                "type": "choice",
                "text": "Why did the plan change?",
                "options": [
                  "unsold vegetables were thrown away",
                  "a lack of interest",
                  "a change in the weather forecast"
                ],
                "answers": [
                  "unsold vegetables were thrown away"
                ],
                "explanation": "Conversation 3 states this clearly."
              }
            ]
          },
          {
            "id": "listening-p6",
            "title": "Project lecture",
            "text": "Listen to the lecture and write one word or number for each answer.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-9-part-6.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-l6-1",
                "type": "text",
                "text": "What do the collected records form? Write ONE word or number.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "The lecture uses the word evidence."
              },
              {
                "id": "m9-l6-2",
                "type": "text",
                "text": "What is the total highlighted in the report? Write ONE word or number.",
                "options": [],
                "answers": [
                  "80"
                ],
                "explanation": "The lecture uses the word 80."
              },
              {
                "id": "m9-l6-3",
                "type": "text",
                "text": "Which word describes the key idea? Write ONE word or number.",
                "options": [],
                "answers": [
                  "coordination"
                ],
                "explanation": "The lecture uses the word coordination."
              },
              {
                "id": "m9-l6-4",
                "type": "text",
                "text": "What did the team ask visitors for? Write ONE word or number.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "The lecture uses the word feedback."
              },
              {
                "id": "m9-l6-5",
                "type": "text",
                "text": "What must be understood behind a result? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conditions"
                ],
                "explanation": "The lecture uses the word conditions."
              },
              {
                "id": "m9-l6-6",
                "type": "text",
                "text": "Which section contains the final interpretation? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conclusions"
                ],
                "explanation": "The lecture uses the word conclusions."
              }
            ]
          }
        ]
      },
      {
        "skill": "reading",
        "minutes": 60,
        "parts": [
          {
            "id": "reading-p1",
            "title": "One-word gaps",
            "text": "The food market project depended on (1) ____ who gave their time freely. At first, the team followed a fixed (2) ____, but unsold vegetables were thrown away. Careful (3) ____ showed exactly when the difficulty appeared. The organisers asked visitors for (4) ____ before changing the plan. They also wanted better (5) ____ for people who could not use the first arrangement. In the end, the strongest (6) ____ came from weighed donations from six stalls. None of these observations proves that the same approach would work in every town. Nevertheless, the group learned why small, well-recorded changes can matter. Its next meeting will consider whether add a community cooking lesson is practical and who could help.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-r1-1",
                "type": "text",
                "text": "Complete gap 1 with ONE word.",
                "options": [],
                "answers": [
                  "volunteers"
                ],
                "explanation": "“volunteers” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m9-r1-2",
                "type": "text",
                "text": "Complete gap 2 with ONE word.",
                "options": [],
                "answers": [
                  "schedule"
                ],
                "explanation": "“schedule” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m9-r1-3",
                "type": "text",
                "text": "Complete gap 3 with ONE word.",
                "options": [],
                "answers": [
                  "records"
                ],
                "explanation": "“records” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m9-r1-4",
                "type": "text",
                "text": "Complete gap 4 with ONE word.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "“feedback” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m9-r1-5",
                "type": "text",
                "text": "Complete gap 5 with ONE word.",
                "options": [],
                "answers": [
                  "access"
                ],
                "explanation": "“access” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m9-r1-6",
                "type": "text",
                "text": "Complete gap 6 with ONE word.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "“evidence” makes the sentence grammatically and logically complete."
              }
            ]
          },
          {
            "id": "reading-p2",
            "title": "Notices and needs",
            "text": "A. Guided introduction: meet Ellen at Northgate Market on Saturday.\nB. Quiet hour: a smaller group meets before the main session.\nC. Access help: ask about step-free rooms and larger-print information.\nD. Skills desk: volunteers demonstrate practical methods and tools.\nE. Family visit: activities are planned for adults and children together.\nF. Research corner: examine the report and ask how information was collected.\nG. Follow-up team: help organise add a community cooking lesson.\nH. Short briefing: Ellen gives a twenty-minute overview.\nI. Merchandise desk: souvenirs are available after the event.\nJ. Private room hire: businesses can book an unrelated meeting.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-r2-1",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants a guided introduction.",
                "options": [
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I"
                ],
                "answers": [
                  "A"
                ],
                "explanation": "Notice A offers exactly this service."
              },
              {
                "id": "m9-r2-2",
                "type": "choice",
                "text": "Which notice suits this person? Someone prefers a smaller, quieter group.",
                "options": [
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J"
                ],
                "answers": [
                  "B"
                ],
                "explanation": "Notice B offers exactly this service."
              },
              {
                "id": "m9-r2-3",
                "type": "choice",
                "text": "Which notice suits this person? A person needs access information.",
                "options": [
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A"
                ],
                "answers": [
                  "C"
                ],
                "explanation": "Notice C offers exactly this service."
              },
              {
                "id": "m9-r2-4",
                "type": "choice",
                "text": "Which notice suits this person? A learner wants a hands-on demonstration.",
                "options": [
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B"
                ],
                "answers": [
                  "D"
                ],
                "explanation": "Notice D offers exactly this service."
              },
              {
                "id": "m9-r2-5",
                "type": "choice",
                "text": "Which notice suits this person? A parent wants to bring a child.",
                "options": [
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C"
                ],
                "answers": [
                  "E"
                ],
                "explanation": "Notice E offers exactly this service."
              },
              {
                "id": "m9-r2-6",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants to inspect the evidence.",
                "options": [
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D"
                ],
                "answers": [
                  "F"
                ],
                "explanation": "Notice F offers exactly this service."
              },
              {
                "id": "m9-r2-7",
                "type": "choice",
                "text": "Which notice suits this person? A resident wants to help with the next event.",
                "options": [
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E"
                ],
                "answers": [
                  "G"
                ],
                "explanation": "Notice G offers exactly this service."
              },
              {
                "id": "m9-r2-8",
                "type": "choice",
                "text": "Which notice suits this person? Someone has only twenty minutes available.",
                "options": [
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F"
                ],
                "answers": [
                  "H"
                ],
                "explanation": "Notice H offers exactly this service."
              }
            ]
          },
          {
            "id": "reading-p3",
            "title": "Paragraph headings",
            "text": "Headings: A. The original difficulty | B. A practical adjustment | C. Collecting information | D. What the figures show | E. A reason for caution | F. The next question | G. A celebrity endorsement | H. An unrelated invention\n\nA. The idea behind food market began with reducing waste at local markets. People welcomed the aim, but the first arrangement was less reliable than the team expected. In particular, unsold vegetables were thrown away. Several participants described this as a problem of planning rather than a reason to abandon the work. Their observations were recorded instead of being dismissed.\n\nB. The organisers compared a complicated solution with a manageable one. They chose to organise a late-afternoon collection. This did not remove every difficulty, yet it made the next session possible without asking volunteers to start again. Ellen then explained the revised procedure to participants, including those who had missed the first announcement.\n\nC. Good intentions alone could not tell the team whether the change helped. They gathered weighed donations from six stalls and kept notes about the conditions under which each observation was made. When a record was incomplete, they marked it as uncertain rather than filling in a likely answer. This made the report less dramatic but more useful.\n\nD. According to the team, vendors donated eighty kilograms in the first month. The figure attracted attention because it described an observable outcome, not merely a prediction. It also encouraged more residents to ask how they could take part. However, a number by itself says little about the people or circumstances behind it.\n\nE. The report acknowledges that the figures do not include home food waste. A different location, season or group of participants might produce a different result. The team therefore resisted a claim that its method was universally successful. This careful interpretation helped readers separate the evidence from the organisers' hopes.\n\nF. The final recommendation was to add a community cooking lesson. Before doing so, the organisers want to agree on clear measures of success and an accessible way to collect comments. They also plan to compare redistribution with larger disposable containers rather than assuming one choice will be best for every participant.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-r3-1",
                "type": "choice",
                "text": "Choose a heading for paragraph A.",
                "options": [
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty"
                ],
                "answers": [
                  "The original difficulty"
                ],
                "explanation": "Paragraph A develops the idea “the original difficulty”."
              },
              {
                "id": "m9-r3-2",
                "type": "choice",
                "text": "Choose a heading for paragraph B.",
                "options": [
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment"
                ],
                "answers": [
                  "A practical adjustment"
                ],
                "explanation": "Paragraph B develops the idea “a practical adjustment”."
              },
              {
                "id": "m9-r3-3",
                "type": "choice",
                "text": "Choose a heading for paragraph C.",
                "options": [
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information"
                ],
                "answers": [
                  "Collecting information"
                ],
                "explanation": "Paragraph C develops the idea “collecting information”."
              },
              {
                "id": "m9-r3-4",
                "type": "choice",
                "text": "Choose a heading for paragraph D.",
                "options": [
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show"
                ],
                "answers": [
                  "What the figures show"
                ],
                "explanation": "Paragraph D develops the idea “what the figures show”."
              },
              {
                "id": "m9-r3-5",
                "type": "choice",
                "text": "Choose a heading for paragraph E.",
                "options": [
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution"
                ],
                "answers": [
                  "A reason for caution"
                ],
                "explanation": "Paragraph E develops the idea “a reason for caution”."
              },
              {
                "id": "m9-r3-6",
                "type": "choice",
                "text": "Choose a heading for paragraph F.",
                "options": [
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question"
                ],
                "answers": [
                  "The next question"
                ],
                "explanation": "Paragraph F develops the idea “the next question”."
              }
            ]
          },
          {
            "id": "reading-p4",
            "title": "Detailed article",
            "text": "An invitation to take part in food market appeared at Northgate Market. Its stated aim was reducing waste at local markets. The first public meeting was held on Saturday, and Ellen collected the comments. Early reports suggested enthusiasm, but the team also heard practical concerns. Most notably, unsold vegetables were thrown away. It would have been easy to present this as a minor inconvenience. Instead, the organisers documented it and chose to organise a late-afternoon collection.\n\nThe revised activity did not follow exactly the original schedule. The organisers tested the change, recorded weighed donations from six stalls, and compared comments made before and after the adjustment. Their report states that vendors donated eighty kilograms in the first month. The authors are careful to explain the difference between an observation and a prediction: a positive first month does not guarantee a positive first year.\n\nTwo alternatives were discussed. Some participants supported redistribution; others preferred larger disposable containers. Neither option was dismissed without consideration. The report ultimately recommended a limited further trial rather than an immediate permanent decision. Its main reservation was that the figures do not include home food waste. Ellen said that the next stage would be to add a community cooking lesson.\n\nThe report does not give the ages of the visitors, the exact amount of any future grant, or a date for publishing a second edition. Those details may matter later, but a reader should not invent them now. The value of the project lies partly in its willingness to say what remains unknown.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-r4-1",
                "type": "choice",
                "text": "What was the stated aim of the project?",
                "options": [
                  "to sell souvenirs",
                  "to replace public transport",
                  "to close the venue",
                  "reducing waste at local markets"
                ],
                "answers": [
                  "reducing waste at local markets"
                ],
                "explanation": "The opening paragraph states the aim."
              },
              {
                "id": "m9-r4-2",
                "type": "choice",
                "text": "What led the organisers to revise the activity?",
                "options": [
                  "a cancelled newspaper",
                  "a competition prize",
                  "unsold vegetables were thrown away",
                  "a new mayor"
                ],
                "answers": [
                  "unsold vegetables were thrown away"
                ],
                "explanation": "The reported problem led directly to the adjustment."
              },
              {
                "id": "m9-r4-3",
                "type": "choice",
                "text": "Which action did the organisers take?",
                "options": [
                  "ignore accessibility",
                  "organise a late-afternoon collection",
                  "stop collecting comments",
                  "claim guaranteed success"
                ],
                "answers": [
                  "organise a late-afternoon collection"
                ],
                "explanation": "The revised action is explicitly described."
              },
              {
                "id": "m9-r4-4",
                "type": "choice",
                "text": "How do the authors treat the positive early result?",
                "options": [
                  "As useful but limited evidence",
                  "As proof for every community",
                  "As an error to hide",
                  "As irrelevant to the project"
                ],
                "answers": [
                  "As useful but limited evidence"
                ],
                "explanation": "The text distinguishes observation from prediction."
              },
              {
                "id": "m9-r4-5",
                "type": "choice",
                "text": "True / False / Not Given: The team recorded information during the revised activity.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The second paragraph says the team recorded evidence."
              },
              {
                "id": "m9-r4-6",
                "type": "choice",
                "text": "True / False / Not Given: The organisers permanently rejected both alternatives.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "False"
                ],
                "explanation": "Both alternatives were considered; a further trial was recommended."
              },
              {
                "id": "m9-r4-7",
                "type": "choice",
                "text": "True / False / Not Given: Every visitor was younger than eighteen.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No ages are supplied."
              },
              {
                "id": "m9-r4-8",
                "type": "choice",
                "text": "True / False / Not Given: The report identifies a limitation of the trial.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The report acknowledges a limitation."
              },
              {
                "id": "m9-r4-9",
                "type": "choice",
                "text": "True / False / Not Given: A second edition will be published next month.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No date for a second edition is given."
              }
            ]
          },
          {
            "id": "reading-p5",
            "title": "Analysis and inference",
            "text": "The organisers at Northgate Market made a useful distinction between a change that is easy to announce and a change that can be evaluated. Their focus was reducing waste at local markets. During the first stage, unsold vegetables were thrown away. The immediate response was to organise a late-afternoon collection, but the team did not describe this response as a complete solution.\n\nTo check what happened, they collected weighed donations from six stalls. The report highlighted a figure of 80. A short account of the trial was sent to Ellen, who asked for more information about the conditions in which it took place. In particular, the figures do not include home food waste. This mattered because an impressive number from a narrow trial can be misleading when removed from its context.\n\nAt the next meeting, participants will compare redistribution with larger disposable containers. They will also consider how to add a community cooking lesson. The discussion is designed to invite disagreement supported by reasons, not to reward the loudest speaker. If the group can repeat the trial and explain its limitations clearly, the result will be more useful to other communities.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-r5-1",
                "type": "text",
                "text": "Which venue hosted the organisers? Write ONE word from the venue name.",
                "options": [],
                "answers": [
                  "Northgate"
                ],
                "explanation": "The venue starts with Northgate."
              },
              {
                "id": "m9-r5-2",
                "type": "text",
                "text": "What figure did the report highlight? Write ONE number.",
                "options": [],
                "answers": [
                  "80"
                ],
                "explanation": "The figure given is 80."
              },
              {
                "id": "m9-r5-3",
                "type": "text",
                "text": "Who requested more information? Write ONE name.",
                "options": [],
                "answers": [
                  "Ellen"
                ],
                "explanation": "The text names Ellen."
              },
              {
                "id": "m9-r5-4",
                "type": "text",
                "text": "What can be misleading without context? Write ONE word.",
                "options": [],
                "answers": [
                  "number"
                ],
                "explanation": "The passage describes an impressive number from a narrow trial."
              },
              {
                "id": "m9-r5-5",
                "type": "choice",
                "text": "Why does the writer mention the limitation?",
                "options": [
                  "To argue that evidence is useless",
                  "To avoid hearing from participants",
                  "To hide the report",
                  "To prevent an overconfident conclusion"
                ],
                "answers": [
                  "To prevent an overconfident conclusion"
                ],
                "explanation": "The writer warns against removing the result from context."
              },
              {
                "id": "m9-r5-6",
                "type": "choice",
                "text": "What attitude does the final paragraph encourage?",
                "options": [
                  "Immediate approval of every idea",
                  "Competition for attention",
                  "Reasoned disagreement",
                  "Silence at meetings"
                ],
                "answers": [
                  "Reasoned disagreement"
                ],
                "explanation": "The group invites disagreement supported by reasons."
              }
            ]
          }
        ]
      },
      {
        "skill": "writing",
        "minutes": 60,
        "parts": [
          {
            "id": "writing-p1",
            "title": "Tasks 1.1, 1.2 and 2",
            "text": "Write all three responses. Your work is assessed by an administrator.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-w1",
                "type": "writing",
                "text": "You and a friend attended an activity about food market. Write an informal message to your friend. Explain what you enjoyed and suggest one thing to do next. Aim for about 50 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m9-w2",
                "type": "writing",
                "text": "Write to Ellen, the organiser at Northgate Market. Explain why you attended, describe the difficulty (“unsold vegetables were thrown away”), and suggest a practical improvement. Use a suitable formal tone. Aim for about 120–150 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m9-w3",
                "type": "writing",
                "text": "Some people think communities should invest in redistribution; others prefer larger disposable containers. Discuss both views and explain which approach would better support reducing waste at local markets. Give reasons and examples. Aim for about 180–220 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      },
      {
        "skill": "speaking",
        "minutes": 15,
        "parts": [
          {
            "id": "speaking-p1",
            "title": "Part 1.1 — personal questions",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-s1-1",
                "type": "speaking",
                "text": "What do you enjoy doing in your neighbourhood?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m9-s1-2",
                "type": "speaking",
                "text": "How do you usually learn about local events?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m9-s1-3",
                "type": "speaking",
                "text": "Have you ever visited a place like Northgate Market?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p2",
            "title": "Part 1.2 — compare two scenes",
            "text": "Scene A: a small group working together. Scene B: a large public presentation. Compare the two situations.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-s2-1",
                "type": "speaking",
                "text": "Compare a small group discussion at Northgate Market with a large public meeting. What might each be like?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m9-s2-2",
                "type": "speaking",
                "text": "Which setting would help people discuss food market more effectively, and why?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m9-s2-3",
                "type": "speaking",
                "text": "Would your preference change if you were presenting rather than listening?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p3",
            "title": "Part 2 — extended answer",
            "text": "Prepare for one minute; speak for about two minutes.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-s3-1",
                "type": "speaking",
                "text": "Discuss this issue: should communities prioritise redistribution or larger disposable containers? Give advantages, disadvantages and examples connected with reducing waste at local markets.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p4",
            "title": "Part 3 — argument",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m9-s4-1",
                "type": "speaking",
                "text": "“A small successful trial is enough to justify a permanent public policy.” Discuss both sides of this claim. Refer to the limitation that the figures do not include home food waste.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "title": "Multilevel Mock 10 · Public transport",
    "description": "Original mashq varianti: public transport. 35 Listening, 35 Reading, 3 Writing va 8 Speaking topshirig‘i. Rasmiy test savollari emas.",
    "level": "B1–C1",
    "format": "multilevel",
    "rightsConfirmed": true,
    "seedKey": "sinfquiz-multilevel-10",
    "sections": [
      {
        "skill": "listening",
        "minutes": 45,
        "parts": [
          {
            "id": "listening-p1",
            "title": "Short announcements",
            "text": "Listen to eight short messages. Choose the best answer for each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-10-part-1.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-l1-1",
                "type": "choice",
                "text": "When does the meeting begin?",
                "options": [
                  "18:15",
                  "17:30",
                  "12:00"
                ],
                "answers": [
                  "18:15"
                ],
                "explanation": "The announcement says: The first message said 17:30, but the public transport meeting now starts at 18:15."
              },
              {
                "id": "m10-l1-2",
                "type": "choice",
                "text": "Where will people meet?",
                "options": [
                  "the town hall",
                  "the railway café",
                  "Central Station"
                ],
                "answers": [
                  "Central Station"
                ],
                "explanation": "The announcement says: We are meeting at Central Station. Please do not wait at the old entrance."
              },
              {
                "id": "m10-l1-3",
                "type": "choice",
                "text": "What should visitors bring?",
                "options": [
                  "a camera",
                  "a travel card",
                  "a printed ticket"
                ],
                "answers": [
                  "a travel card"
                ],
                "explanation": "The announcement says: Before you leave home, remember to bring a travel card. Other equipment is provided."
              },
              {
                "id": "m10-l1-4",
                "type": "choice",
                "text": "What is the last day to register?",
                "options": [
                  "Monday",
                  "the following weekend",
                  "the day after the event"
                ],
                "answers": [
                  "Monday"
                ],
                "explanation": "The announcement says: You can sign up until Monday. We cannot add names at the door."
              },
              {
                "id": "m10-l1-5",
                "type": "choice",
                "text": "How much is admission?",
                "options": [
                  "five pounds",
                  "ten pounds",
                  "free"
                ],
                "answers": [
                  "free"
                ],
                "explanation": "The announcement says: Admission is free. The amount covers the materials, and there is no extra charge."
              },
              {
                "id": "m10-l1-6",
                "type": "choice",
                "text": "Who can answer questions?",
                "options": [
                  "the driver",
                  "Jamal",
                  "the caretaker"
                ],
                "answers": [
                  "Jamal"
                ],
                "explanation": "The announcement says: If you have a question, ask for Jamal at the information desk."
              },
              {
                "id": "m10-l1-7",
                "type": "choice",
                "text": "What did the team decide to do?",
                "options": [
                  "adjust the bus departure by ten minutes",
                  "cancel the entire project",
                  "ignore the difficulty"
                ],
                "answers": [
                  "adjust the bus departure by ten minutes"
                ],
                "explanation": "The announcement says: Because the last bus left before some trains arrived, the team decided to adjust the bus departure by ten minutes."
              },
              {
                "id": "m10-l1-8",
                "type": "choice",
                "text": "What is the main purpose?",
                "options": [
                  "to sell more tickets",
                  "to replace every volunteer",
                  "making evening journeys more reliable"
                ],
                "answers": [
                  "making evening journeys more reliable"
                ],
                "explanation": "The announcement says: We are doing this to support making evening journeys more reliable, not simply to advertise the event."
              }
            ]
          },
          {
            "id": "listening-p2",
            "title": "Briefing notes",
            "text": "Listen to the briefing. Complete the notes with one word or number.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-10-part-2.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-l2-1",
                "type": "text",
                "text": "Which day is the briefing held? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Tuesday"
                ],
                "explanation": "The briefing explicitly gives Tuesday."
              },
              {
                "id": "m10-l2-2",
                "type": "text",
                "text": "What time does the briefing start? Write ONE word or number.",
                "options": [],
                "answers": [
                  "18:15"
                ],
                "explanation": "The briefing explicitly gives 18:15."
              },
              {
                "id": "m10-l2-3",
                "type": "text",
                "text": "Who leads the first session? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Jamal"
                ],
                "explanation": "The briefing explicitly gives Jamal."
              },
              {
                "id": "m10-l2-4",
                "type": "text",
                "text": "What is the registration deadline? Write ONE word or number.",
                "options": [],
                "answers": [
                  "Monday"
                ],
                "explanation": "The briefing explicitly gives Monday."
              },
              {
                "id": "m10-l2-5",
                "type": "text",
                "text": "How many entries were recorded? Write ONE word or number.",
                "options": [],
                "answers": [
                  "20"
                ],
                "explanation": "The briefing explicitly gives 20."
              },
              {
                "id": "m10-l2-6",
                "type": "text",
                "text": "Which word describes the main concern? Write ONE word or number.",
                "options": [],
                "answers": [
                  "timing"
                ],
                "explanation": "The briefing explicitly gives timing."
              }
            ]
          },
          {
            "id": "listening-p3",
            "title": "Four speakers",
            "text": "Match four speakers with the main ideas. Two options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-10-part-3.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-l3-1",
                "type": "choice",
                "text": "Match speaker 1 with the main idea.",
                "options": [
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage"
                ],
                "answers": [
                  "Personal motivation"
                ],
                "explanation": "Speaker 1 focuses on personal motivation."
              },
              {
                "id": "m10-l3-2",
                "type": "choice",
                "text": "Match speaker 2 with the main idea.",
                "options": [
                  "Rejecting the whole project",
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor"
                ],
                "answers": [
                  "Learning from a setback"
                ],
                "explanation": "Speaker 2 focuses on learning from a setback."
              },
              {
                "id": "m10-l3-3",
                "type": "choice",
                "text": "Match speaker 3 with the main idea.",
                "options": [
                  "Personal motivation",
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project"
                ],
                "answers": [
                  "Cautious optimism about a result"
                ],
                "explanation": "Speaker 3 focuses on cautious optimism about a result."
              },
              {
                "id": "m10-l3-4",
                "type": "choice",
                "text": "Match speaker 4 with the main idea.",
                "options": [
                  "Learning from a setback",
                  "Cautious optimism about a result",
                  "Planning the next stage",
                  "Finding a sponsor",
                  "Rejecting the whole project",
                  "Personal motivation"
                ],
                "answers": [
                  "Planning the next stage"
                ],
                "explanation": "Speaker 4 focuses on planning the next stage."
              }
            ]
          },
          {
            "id": "listening-p4",
            "title": "Responding to requests",
            "text": "Match each request to the response. Three options are extra.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-10-part-4.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-l4-1",
                "type": "choice",
                "text": "Which response was given to a visitor who cannot reach the upper floor?",
                "options": [
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule"
                ],
                "answers": [
                  "Move activities to an accessible room"
                ],
                "explanation": "The announcement connects this request with “move activities to an accessible room”."
              },
              {
                "id": "m10-l4-2",
                "type": "choice",
                "text": "Which response was given to a volunteer who needs to know the arrival time?",
                "options": [
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session"
                ],
                "answers": [
                  "Check the revised schedule"
                ],
                "explanation": "The announcement connects this request with “check the revised schedule”."
              },
              {
                "id": "m10-l4-3",
                "type": "choice",
                "text": "Which response was given to someone who wants the project to continue?",
                "options": [
                  "Read the equipment list",
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation"
                ],
                "answers": [
                  "Help plan a follow-up session"
                ],
                "explanation": "The announcement connects this request with “help plan a follow-up session”."
              },
              {
                "id": "m10-l4-4",
                "type": "choice",
                "text": "Which response was given to a researcher questioning the findings?",
                "options": [
                  "Buy a new ticket immediately",
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list"
                ],
                "answers": [
                  "Explain the sample limitation"
                ],
                "explanation": "The announcement connects this request with “explain the sample limitation”."
              },
              {
                "id": "m10-l4-5",
                "type": "choice",
                "text": "Which response was given to a participant with an item to bring?",
                "options": [
                  "Send the report to a newspaper",
                  "Replace all volunteers",
                  "Move activities to an accessible room",
                  "Check the revised schedule",
                  "Help plan a follow-up session",
                  "Explain the sample limitation",
                  "Read the equipment list",
                  "Buy a new ticket immediately"
                ],
                "answers": [
                  "Read the equipment list"
                ],
                "explanation": "The announcement connects this request with “read the equipment list”."
              }
            ]
          },
          {
            "id": "listening-p5",
            "title": "Three conversations",
            "text": "Listen to three conversations. Answer two questions about each.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-10-part-5.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-l5-1",
                "type": "choice",
                "text": "Why is the speaker cautious?",
                "options": [
                  "There was no trial.",
                  "The report was lost.",
                  "holiday traffic was not included"
                ],
                "answers": [
                  "holiday traffic was not included"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m10-l5-2",
                "type": "choice",
                "text": "What does the speaker recommend?",
                "options": [
                  "buying a larger room",
                  "another trial",
                  "closing the project"
                ],
                "answers": [
                  "another trial"
                ],
                "explanation": "Conversation 1 states this clearly."
              },
              {
                "id": "m10-l5-3",
                "type": "choice",
                "text": "Which option does the second speaker prefer?",
                "options": [
                  "neither option",
                  "coordinated schedules",
                  "more advertising signs"
                ],
                "answers": [
                  "coordinated schedules"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m10-l5-4",
                "type": "choice",
                "text": "Why does the speaker prefer it?",
                "options": [
                  "making evening journeys more reliable",
                  "it is the oldest option",
                  "it needs no volunteers"
                ],
                "answers": [
                  "making evening journeys more reliable"
                ],
                "explanation": "Conversation 2 states this clearly."
              },
              {
                "id": "m10-l5-5",
                "type": "choice",
                "text": "Who will speak?",
                "options": [
                  "Jamal",
                  "the driver",
                  "the caretaker"
                ],
                "answers": [
                  "Jamal"
                ],
                "explanation": "Conversation 3 states this clearly."
              },
              {
                "id": "m10-l5-6",
                "type": "choice",
                "text": "Why did the plan change?",
                "options": [
                  "a lack of interest",
                  "a change in the weather forecast",
                  "the last bus left before some trains arrived"
                ],
                "answers": [
                  "the last bus left before some trains arrived"
                ],
                "explanation": "Conversation 3 states this clearly."
              }
            ]
          },
          {
            "id": "listening-p6",
            "title": "Project lecture",
            "text": "Listen to the lecture and write one word or number for each answer.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "/cefr-audio/mock-10-part-6.mp3",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-l6-1",
                "type": "text",
                "text": "What do the collected records form? Write ONE word or number.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "The lecture uses the word evidence."
              },
              {
                "id": "m10-l6-2",
                "type": "text",
                "text": "What is the total highlighted in the report? Write ONE word or number.",
                "options": [],
                "answers": [
                  "20"
                ],
                "explanation": "The lecture uses the word 20."
              },
              {
                "id": "m10-l6-3",
                "type": "text",
                "text": "Which word describes the key idea? Write ONE word or number.",
                "options": [],
                "answers": [
                  "timing"
                ],
                "explanation": "The lecture uses the word timing."
              },
              {
                "id": "m10-l6-4",
                "type": "text",
                "text": "What did the team ask visitors for? Write ONE word or number.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "The lecture uses the word feedback."
              },
              {
                "id": "m10-l6-5",
                "type": "text",
                "text": "What must be understood behind a result? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conditions"
                ],
                "explanation": "The lecture uses the word conditions."
              },
              {
                "id": "m10-l6-6",
                "type": "text",
                "text": "Which section contains the final interpretation? Write ONE word or number.",
                "options": [],
                "answers": [
                  "conclusions"
                ],
                "explanation": "The lecture uses the word conclusions."
              }
            ]
          }
        ]
      },
      {
        "skill": "reading",
        "minutes": 60,
        "parts": [
          {
            "id": "reading-p1",
            "title": "One-word gaps",
            "text": "The public transport project depended on (1) ____ who gave their time freely. At first, the team followed a fixed (2) ____, but the last bus left before some trains arrived. Careful (3) ____ showed exactly when the difficulty appeared. The organisers asked visitors for (4) ____ before changing the plan. They also wanted better (5) ____ for people who could not use the first arrangement. In the end, the strongest (6) ____ came from connection counts on twenty weekdays. None of these observations proves that the same approach would work in every town. Nevertheless, the group learned why small, well-recorded changes can matter. Its next meeting will consider whether review the timetable after three months is practical and who could help.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-r1-1",
                "type": "text",
                "text": "Complete gap 1 with ONE word.",
                "options": [],
                "answers": [
                  "volunteers"
                ],
                "explanation": "“volunteers” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m10-r1-2",
                "type": "text",
                "text": "Complete gap 2 with ONE word.",
                "options": [],
                "answers": [
                  "schedule"
                ],
                "explanation": "“schedule” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m10-r1-3",
                "type": "text",
                "text": "Complete gap 3 with ONE word.",
                "options": [],
                "answers": [
                  "records"
                ],
                "explanation": "“records” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m10-r1-4",
                "type": "text",
                "text": "Complete gap 4 with ONE word.",
                "options": [],
                "answers": [
                  "feedback"
                ],
                "explanation": "“feedback” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m10-r1-5",
                "type": "text",
                "text": "Complete gap 5 with ONE word.",
                "options": [],
                "answers": [
                  "access"
                ],
                "explanation": "“access” makes the sentence grammatically and logically complete."
              },
              {
                "id": "m10-r1-6",
                "type": "text",
                "text": "Complete gap 6 with ONE word.",
                "options": [],
                "answers": [
                  "evidence"
                ],
                "explanation": "“evidence” makes the sentence grammatically and logically complete."
              }
            ]
          },
          {
            "id": "reading-p2",
            "title": "Notices and needs",
            "text": "A. Guided introduction: meet Jamal at Central Station on Tuesday.\nB. Quiet hour: a smaller group meets before the main session.\nC. Access help: ask about step-free rooms and larger-print information.\nD. Skills desk: volunteers demonstrate practical methods and tools.\nE. Family visit: activities are planned for adults and children together.\nF. Research corner: examine the report and ask how information was collected.\nG. Follow-up team: help organise review the timetable after three months.\nH. Short briefing: Jamal gives a twenty-minute overview.\nI. Merchandise desk: souvenirs are available after the event.\nJ. Private room hire: businesses can book an unrelated meeting.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-r2-1",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants a guided introduction.",
                "options": [
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J"
                ],
                "answers": [
                  "A"
                ],
                "explanation": "Notice A offers exactly this service."
              },
              {
                "id": "m10-r2-2",
                "type": "choice",
                "text": "Which notice suits this person? Someone prefers a smaller, quieter group.",
                "options": [
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A"
                ],
                "answers": [
                  "B"
                ],
                "explanation": "Notice B offers exactly this service."
              },
              {
                "id": "m10-r2-3",
                "type": "choice",
                "text": "Which notice suits this person? A person needs access information.",
                "options": [
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B"
                ],
                "answers": [
                  "C"
                ],
                "explanation": "Notice C offers exactly this service."
              },
              {
                "id": "m10-r2-4",
                "type": "choice",
                "text": "Which notice suits this person? A learner wants a hands-on demonstration.",
                "options": [
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C"
                ],
                "answers": [
                  "D"
                ],
                "explanation": "Notice D offers exactly this service."
              },
              {
                "id": "m10-r2-5",
                "type": "choice",
                "text": "Which notice suits this person? A parent wants to bring a child.",
                "options": [
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D"
                ],
                "answers": [
                  "E"
                ],
                "explanation": "Notice E offers exactly this service."
              },
              {
                "id": "m10-r2-6",
                "type": "choice",
                "text": "Which notice suits this person? A visitor wants to inspect the evidence.",
                "options": [
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E"
                ],
                "answers": [
                  "F"
                ],
                "explanation": "Notice F offers exactly this service."
              },
              {
                "id": "m10-r2-7",
                "type": "choice",
                "text": "Which notice suits this person? A resident wants to help with the next event.",
                "options": [
                  "G",
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F"
                ],
                "answers": [
                  "G"
                ],
                "explanation": "Notice G offers exactly this service."
              },
              {
                "id": "m10-r2-8",
                "type": "choice",
                "text": "Which notice suits this person? Someone has only twenty minutes available.",
                "options": [
                  "H",
                  "I",
                  "J",
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G"
                ],
                "answers": [
                  "H"
                ],
                "explanation": "Notice H offers exactly this service."
              }
            ]
          },
          {
            "id": "reading-p3",
            "title": "Paragraph headings",
            "text": "Headings: A. The original difficulty | B. A practical adjustment | C. Collecting information | D. What the figures show | E. A reason for caution | F. The next question | G. A celebrity endorsement | H. An unrelated invention\n\nA. The idea behind public transport began with making evening journeys more reliable. People welcomed the aim, but the first arrangement was less reliable than the team expected. In particular, the last bus left before some trains arrived. Several participants described this as a problem of planning rather than a reason to abandon the work. Their observations were recorded instead of being dismissed.\n\nB. The organisers compared a complicated solution with a manageable one. They chose to adjust the bus departure by ten minutes. This did not remove every difficulty, yet it made the next session possible without asking volunteers to start again. Jamal then explained the revised procedure to participants, including those who had missed the first announcement.\n\nC. Good intentions alone could not tell the team whether the change helped. They gathered connection counts on twenty weekdays and kept notes about the conditions under which each observation was made. When a record was incomplete, they marked it as uncertain rather than filling in a likely answer. This made the report less dramatic but more useful.\n\nD. According to the team, missed connections fell during a four-week trial. The figure attracted attention because it described an observable outcome, not merely a prediction. It also encouraged more residents to ask how they could take part. However, a number by itself says little about the people or circumstances behind it.\n\nE. The report acknowledges that holiday traffic was not included. A different location, season or group of participants might produce a different result. The team therefore resisted a claim that its method was universally successful. This careful interpretation helped readers separate the evidence from the organisers' hopes.\n\nF. The final recommendation was to review the timetable after three months. Before doing so, the organisers want to agree on clear measures of success and an accessible way to collect comments. They also plan to compare coordinated schedules with more advertising signs rather than assuming one choice will be best for every participant.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-r3-1",
                "type": "choice",
                "text": "Choose a heading for paragraph A.",
                "options": [
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment"
                ],
                "answers": [
                  "The original difficulty"
                ],
                "explanation": "Paragraph A develops the idea “the original difficulty”."
              },
              {
                "id": "m10-r3-2",
                "type": "choice",
                "text": "Choose a heading for paragraph B.",
                "options": [
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information"
                ],
                "answers": [
                  "A practical adjustment"
                ],
                "explanation": "Paragraph B develops the idea “a practical adjustment”."
              },
              {
                "id": "m10-r3-3",
                "type": "choice",
                "text": "Choose a heading for paragraph C.",
                "options": [
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show"
                ],
                "answers": [
                  "Collecting information"
                ],
                "explanation": "Paragraph C develops the idea “collecting information”."
              },
              {
                "id": "m10-r3-4",
                "type": "choice",
                "text": "Choose a heading for paragraph D.",
                "options": [
                  "The next question",
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution"
                ],
                "answers": [
                  "What the figures show"
                ],
                "explanation": "Paragraph D develops the idea “what the figures show”."
              },
              {
                "id": "m10-r3-5",
                "type": "choice",
                "text": "Choose a heading for paragraph E.",
                "options": [
                  "A celebrity endorsement",
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question"
                ],
                "answers": [
                  "A reason for caution"
                ],
                "explanation": "Paragraph E develops the idea “a reason for caution”."
              },
              {
                "id": "m10-r3-6",
                "type": "choice",
                "text": "Choose a heading for paragraph F.",
                "options": [
                  "An unrelated invention",
                  "The original difficulty",
                  "A practical adjustment",
                  "Collecting information",
                  "What the figures show",
                  "A reason for caution",
                  "The next question",
                  "A celebrity endorsement"
                ],
                "answers": [
                  "The next question"
                ],
                "explanation": "Paragraph F develops the idea “the next question”."
              }
            ]
          },
          {
            "id": "reading-p4",
            "title": "Detailed article",
            "text": "An invitation to take part in public transport appeared at Central Station. Its stated aim was making evening journeys more reliable. The first public meeting was held on Tuesday, and Jamal collected the comments. Early reports suggested enthusiasm, but the team also heard practical concerns. Most notably, the last bus left before some trains arrived. It would have been easy to present this as a minor inconvenience. Instead, the organisers documented it and chose to adjust the bus departure by ten minutes.\n\nThe revised activity did not follow exactly the original schedule. The organisers tested the change, recorded connection counts on twenty weekdays, and compared comments made before and after the adjustment. Their report states that missed connections fell during a four-week trial. The authors are careful to explain the difference between an observation and a prediction: a positive first month does not guarantee a positive first year.\n\nTwo alternatives were discussed. Some participants supported coordinated schedules; others preferred more advertising signs. Neither option was dismissed without consideration. The report ultimately recommended a limited further trial rather than an immediate permanent decision. Its main reservation was that holiday traffic was not included. Jamal said that the next stage would be to review the timetable after three months.\n\nThe report does not give the ages of the visitors, the exact amount of any future grant, or a date for publishing a second edition. Those details may matter later, but a reader should not invent them now. The value of the project lies partly in its willingness to say what remains unknown.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-r4-1",
                "type": "choice",
                "text": "What was the stated aim of the project?",
                "options": [
                  "to replace public transport",
                  "to close the venue",
                  "making evening journeys more reliable",
                  "to sell souvenirs"
                ],
                "answers": [
                  "making evening journeys more reliable"
                ],
                "explanation": "The opening paragraph states the aim."
              },
              {
                "id": "m10-r4-2",
                "type": "choice",
                "text": "What led the organisers to revise the activity?",
                "options": [
                  "a competition prize",
                  "the last bus left before some trains arrived",
                  "a new mayor",
                  "a cancelled newspaper"
                ],
                "answers": [
                  "the last bus left before some trains arrived"
                ],
                "explanation": "The reported problem led directly to the adjustment."
              },
              {
                "id": "m10-r4-3",
                "type": "choice",
                "text": "Which action did the organisers take?",
                "options": [
                  "adjust the bus departure by ten minutes",
                  "stop collecting comments",
                  "claim guaranteed success",
                  "ignore accessibility"
                ],
                "answers": [
                  "adjust the bus departure by ten minutes"
                ],
                "explanation": "The revised action is explicitly described."
              },
              {
                "id": "m10-r4-4",
                "type": "choice",
                "text": "How do the authors treat the positive early result?",
                "options": [
                  "As proof for every community",
                  "As an error to hide",
                  "As irrelevant to the project",
                  "As useful but limited evidence"
                ],
                "answers": [
                  "As useful but limited evidence"
                ],
                "explanation": "The text distinguishes observation from prediction."
              },
              {
                "id": "m10-r4-5",
                "type": "choice",
                "text": "True / False / Not Given: The team recorded information during the revised activity.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The second paragraph says the team recorded evidence."
              },
              {
                "id": "m10-r4-6",
                "type": "choice",
                "text": "True / False / Not Given: The organisers permanently rejected both alternatives.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "False"
                ],
                "explanation": "Both alternatives were considered; a further trial was recommended."
              },
              {
                "id": "m10-r4-7",
                "type": "choice",
                "text": "True / False / Not Given: Every visitor was younger than eighteen.",
                "options": [
                  "True",
                  "False",
                  "Not Given"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No ages are supplied."
              },
              {
                "id": "m10-r4-8",
                "type": "choice",
                "text": "True / False / Not Given: The report identifies a limitation of the trial.",
                "options": [
                  "False",
                  "Not Given",
                  "True"
                ],
                "answers": [
                  "True"
                ],
                "explanation": "The report acknowledges a limitation."
              },
              {
                "id": "m10-r4-9",
                "type": "choice",
                "text": "True / False / Not Given: A second edition will be published next month.",
                "options": [
                  "Not Given",
                  "True",
                  "False"
                ],
                "answers": [
                  "Not Given"
                ],
                "explanation": "No date for a second edition is given."
              }
            ]
          },
          {
            "id": "reading-p5",
            "title": "Analysis and inference",
            "text": "The organisers at Central Station made a useful distinction between a change that is easy to announce and a change that can be evaluated. Their focus was making evening journeys more reliable. During the first stage, the last bus left before some trains arrived. The immediate response was to adjust the bus departure by ten minutes, but the team did not describe this response as a complete solution.\n\nTo check what happened, they collected connection counts on twenty weekdays. The report highlighted a figure of 20. A short account of the trial was sent to Jamal, who asked for more information about the conditions in which it took place. In particular, holiday traffic was not included. This mattered because an impressive number from a narrow trial can be misleading when removed from its context.\n\nAt the next meeting, participants will compare coordinated schedules with more advertising signs. They will also consider how to review the timetable after three months. The discussion is designed to invite disagreement supported by reasons, not to reward the loudest speaker. If the group can repeat the trial and explain its limitations clearly, the result will be more useful to other communities.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-r5-1",
                "type": "text",
                "text": "Which venue hosted the organisers? Write ONE word from the venue name.",
                "options": [],
                "answers": [
                  "Central"
                ],
                "explanation": "The venue starts with Central."
              },
              {
                "id": "m10-r5-2",
                "type": "text",
                "text": "What figure did the report highlight? Write ONE number.",
                "options": [],
                "answers": [
                  "20"
                ],
                "explanation": "The figure given is 20."
              },
              {
                "id": "m10-r5-3",
                "type": "text",
                "text": "Who requested more information? Write ONE name.",
                "options": [],
                "answers": [
                  "Jamal"
                ],
                "explanation": "The text names Jamal."
              },
              {
                "id": "m10-r5-4",
                "type": "text",
                "text": "What can be misleading without context? Write ONE word.",
                "options": [],
                "answers": [
                  "number"
                ],
                "explanation": "The passage describes an impressive number from a narrow trial."
              },
              {
                "id": "m10-r5-5",
                "type": "choice",
                "text": "Why does the writer mention the limitation?",
                "options": [
                  "To avoid hearing from participants",
                  "To hide the report",
                  "To prevent an overconfident conclusion",
                  "To argue that evidence is useless"
                ],
                "answers": [
                  "To prevent an overconfident conclusion"
                ],
                "explanation": "The writer warns against removing the result from context."
              },
              {
                "id": "m10-r5-6",
                "type": "choice",
                "text": "What attitude does the final paragraph encourage?",
                "options": [
                  "Competition for attention",
                  "Reasoned disagreement",
                  "Silence at meetings",
                  "Immediate approval of every idea"
                ],
                "answers": [
                  "Reasoned disagreement"
                ],
                "explanation": "The group invites disagreement supported by reasons."
              }
            ]
          }
        ]
      },
      {
        "skill": "writing",
        "minutes": 60,
        "parts": [
          {
            "id": "writing-p1",
            "title": "Tasks 1.1, 1.2 and 2",
            "text": "Write all three responses. Your work is assessed by an administrator.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-w1",
                "type": "writing",
                "text": "You and a friend attended an activity about public transport. Write an informal message to your friend. Explain what you enjoyed and suggest one thing to do next. Aim for about 50 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m10-w2",
                "type": "writing",
                "text": "Write to Jamal, the organiser at Central Station. Explain why you attended, describe the difficulty (“the last bus left before some trains arrived”), and suggest a practical improvement. Use a suitable formal tone. Aim for about 120–150 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m10-w3",
                "type": "writing",
                "text": "Some people think communities should invest in coordinated schedules; others prefer more advertising signs. Discuss both views and explain which approach would better support making evening journeys more reliable. Give reasons and examples. Aim for about 180–220 words.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      },
      {
        "skill": "speaking",
        "minutes": 15,
        "parts": [
          {
            "id": "speaking-p1",
            "title": "Part 1.1 — personal questions",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-s1-1",
                "type": "speaking",
                "text": "What do you enjoy doing in your neighbourhood?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m10-s1-2",
                "type": "speaking",
                "text": "How do you usually learn about local events?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m10-s1-3",
                "type": "speaking",
                "text": "Have you ever visited a place like Central Station?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p2",
            "title": "Part 1.2 — compare two scenes",
            "text": "Scene A: a small group working together. Scene B: a large public presentation. Compare the two situations.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-s2-1",
                "type": "speaking",
                "text": "Compare a small group discussion at Central Station with a large public meeting. What might each be like?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m10-s2-2",
                "type": "speaking",
                "text": "Which setting would help people discuss public transport more effectively, and why?",
                "options": [],
                "answers": [],
                "explanation": ""
              },
              {
                "id": "m10-s2-3",
                "type": "speaking",
                "text": "Would your preference change if you were presenting rather than listening?",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p3",
            "title": "Part 2 — extended answer",
            "text": "Prepare for one minute; speak for about two minutes.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-s3-1",
                "type": "speaking",
                "text": "Discuss this issue: should communities prioritise coordinated schedules or more advertising signs? Give advantages, disadvantages and examples connected with making evening journeys more reliable.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          },
          {
            "id": "speaking-p4",
            "title": "Part 3 — argument",
            "text": "Record one answer per prompt.",
            "source": "SinfQuiz original mashq materiali, 2026. Format uchun: uzbmb.uz/page/test_sinovlari_formati",
            "audioUrl": "",
            "imageUrl": "",
            "questions": [
              {
                "id": "m10-s4-1",
                "type": "speaking",
                "text": "“A small successful trial is enough to justify a permanent public policy.” Discuss both sides of this claim. Refer to the limitation that holiday traffic was not included.",
                "options": [],
                "answers": [],
                "explanation": ""
              }
            ]
          }
        ]
      }
    ]
  }
]$cefr_bank$::jsonb) item
on conflict(seed_key) do update set payload=excluded.payload;

create or replace function public.sq_cefr_seed()
returns jsonb language plpgsql security definer set search_path=public as $$
declare item record; added int:=0;
begin
  if auth.uid() is null or not public.sq_is_admin() then
    raise exception 'Faqat administrator variantlarni o‘rnata oladi' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('sinfquiz-cefr-ready',0));
  if exists(select 1 from public.documents where collection='settings' and id='cefrReadySeed') then
    return jsonb_build_object('added',0,'alreadySeeded',true);
  end if;
  for item in select seed_key,payload from public.cefr_builtin_bank order by seed_key loop
    perform public.sq_cefr_validate(item.payload);
    insert into public.cefr_tests(payload,status,created_by)
      values(item.payload,'published',auth.uid());
    added:=added+1;
  end loop;
  if added<>10 then raise exception '10 ta variant to‘liq yuklanmagan'; end if;
  insert into public.documents(collection,id,data)
    values('settings','cefrReadySeed',jsonb_build_object('count',added,'at',now()));
  return jsonb_build_object('added',added,'alreadySeeded',false);
end $$;

revoke all on function public.sq_cefr_validate(jsonb) from public,anon,authenticated;
revoke all on function public.sq_cefr_admin(text,uuid,jsonb) from public,anon;
grant execute on function public.sq_cefr_admin(text,uuid,jsonb) to authenticated;
revoke all on function public.sq_cefr_seed() from public,anon;
grant execute on function public.sq_cefr_seed() to authenticated;
commit;
