import {uiCopy} from '../ui-copy.js';

// Shared UI language for Speaking and the assistant. Exam content stays in English.
export const speakingCopy={
 title:'Inglizcha gapirishni mashq qiling.',
 description:'Savollarga ovozli yoki yozma javob bering. So‘ng javoblaringiz tahlili va mashqlarni ko‘ring.',
 start:'Speaking sinovini boshlash',
 practice:'Alohida qismni mashq qilish',
 login:'Speaking mashqlari va hisobotlaringizni saqlash uchun hisobingizga kiring.',
 helperDescription:uiCopy.help.description,
 helperQuestions:uiCopy.help.suggestions,
 criterionNames:{fluency_coherence:'Ravonlik va fikrlar bog‘liqligi',lexical_resource:'Lug‘at boyligi',grammatical_range_accuracy:'Grammatika va aniqlik',pronunciation:'Talaffuz'},
 attemptNames:{weekly_check:'Haftalik tekshiruv',baseline:'Boshlang‘ich sinov',recheck:'Yangi to‘liq sinov',written_mock:'Yozma javobli suhbat',transfer:'Yangi savol',aided_repeat:'Yordamli qayta aytish',practice:'Mashq',transcript_revision:'Tuzatilgan matn tahlili'},
 sessionNames:{started:'Davom etmoqda',queued:'Tahlil kutilmoqda',completed:'Yakunlangan',abandoned:'Tugallanmagan',cancelled:'Bekor qilingan'},
 questionKinds:{personal_interview:'Shaxsiy savollar',personal_questions:'Shaxsiy savollar',long_turn:'Kengroq javob',long_turn_follow_up:'Qo‘shimcha savol',three_question_long_turn:'Uch savol asosida javob',abstract_discussion:'Muhokama',picture_comparison:'Rasmlarni solishtirish',balanced_argument:'Fikrni ikki tomondan asoslash'},
};

const serviceUnavailable='Speaking xizmati hozir tayyor emas. Keyinroq qayta urinib ko‘ring yoki administratorga xabar bering.';
const errors={
 AUTH_REQUIRED:'Bu bo‘limdan foydalanish uchun hisobingizga kiring.',
 SERVER_NOT_CONFIGURED:serviceUnavailable,
 GROQ_NOT_CONFIGURED:serviceUnavailable,
 MIGRATION_REQUIRED:serviceUnavailable,
 GROQ_401:'Tahlil xizmati hozir ishlamayapti. Javobingizni saqlab, keyinroq qayta urinib ko‘ring.',
 GROQ_BASE_URL:serviceUnavailable,
 AUDIO_PROBE_NOT_CONFIGURED:serviceUnavailable,
};
export function speakingError(result,fallback){return errors[result?.code]||result?.error||fallback;}
