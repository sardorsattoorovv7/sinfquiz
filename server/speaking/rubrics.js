// Reviewed source summaries, not reproduced official scoring tables.
// An unversioned source URL is recorded honestly; the local policy is versioned.
export const RUBRIC_POLICY='sq-speaking-text-evidence-746.1';
export const rubricSources={checkedAt:'2026-11-02',officialDocumentVersion:null,ielts:'https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf',multilevel:'https://uzbmb.uz/upload/file/pdf/phone/yangi_format_eng.pdf'};
// Concise paraphrases of the two text-observable IELTS dimensions (under 200
// source-derived words in this file). No audio dimension is reconstructed.
const ieltsTextAnchors=[
 {band:9,lexical:'Consistently precise, flexible, idiomatic expression.',grammar:'Comprehensive structural control; only exceptional slips.'},
 {band:8,lexical:'Broad flexible language; occasional selection inaccuracies.',grammar:'Varied flexible structures; sentences usually accurate.'},
 {band:7,lexical:'Flexible topic vocabulary; some idiomatic control; effective rephrasing.',grammar:'Effective simple and complex forms; frequent accurate sentences.'},
 {band:6,lexical:'Enough range to develop topics; meaning generally preserved.',grammar:'Mixed structures with limited flexibility; complex-form errors rarely obscure meaning.'},
 {band:5,lexical:'Topic coverage possible but flexibility and rephrasing inconsistent.',grammar:'Basic patterns reasonably controlled; complex attempts often inaccurate.'},
 {band:4,lexical:'Familiar-topic vocabulary; unfamiliar meanings and word choices problematic.',grammar:'Mostly repetitive basic forms; frequent structural errors.'},
 {band:3,lexical:'Very limited vocabulary beyond personal topics.',grammar:'Limited structures and frequent errors restrict communication.'},
];
export function rubricFor(examMode){return {id:RUBRIC_POLICY,examMode,sources:rubricSources,verifiedScoreMappingAvailable:false,assessableFromTranscript:['grammatical_range_accuracy','lexical_resource','task_relevance','answer_development'],notAssessable:['pronunciation','full_fluency','overall_speaking_band','official_cefr_or_75'],...(examMode==='ielts'?{provisionalTextAnchors:ieltsTextAnchors,rule:'Use a whole-number anchor only when the entire independent sample supports it; otherwise null. Never average per-question numbers.'}:{taskFocus:{part1_1:'Relevant personal responses using basic language.',part1_2:'Describe and compare scenes; explain a preference with a reason.',part2:'Develop all three supplied prompts in one response.',part3:'Explain and evaluate both sides of the supplied argument.'},rule:'All numeric criteria and /75 remain null. Describe task coverage and language evidence only.'})};}
