import type { Question, TagId } from '../types';
import { fisherYates } from './shuffle';

export const DEFAULT_QUIZ_SIZE = 20;

export function buildQuiz(
  all: readonly Question[],
  selectedTags: readonly TagId[],
  includeHard: boolean = false,
  count: number = DEFAULT_QUIZ_SIZE,
  rng: () => number = Math.random,
): Question[] {
  if (selectedTags.length === 0) return [];
  const selected = new Set(selectedTags);
  const pool = all.filter(
    (question) => selected.has(question.tag) && (includeHard || question.difficulty !== 'hard'),
  );
  return fisherYates(pool, rng).slice(0, count);
}
