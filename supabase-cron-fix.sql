-- 7.8 migratsiyasida cron sxemasi topilmagan bo‘lsa, faqat shu faylni RUN qiling.
-- pg_cron kengaytmasi cron sxemasini o‘zi yaratadi.
create extension if not exists pg_cron;

-- 24 soatdan oshgan chat xabarlarini har daqiqada tozalash vazifasi.
select cron.schedule(
  'sinfquiz-chat-24h-purge',
  '* * * * *',
  'select public.sq_chat_purge()'
);
