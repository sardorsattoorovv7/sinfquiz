export const IELTS_MOCK_PART_LIMITS = Object.freeze({part1: 4, part2: 2, part3: 4});
export const IELTS_MOCK_QUESTION_LIMIT = Object.values(IELTS_MOCK_PART_LIMITS).reduce((total, count) => total + count, 0);
