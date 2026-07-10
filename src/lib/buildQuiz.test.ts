import { describe, expect, it } from 'vitest';
import { buildQuiz } from './buildQuiz';
import type { Question, TagId } from '../types';

const alwaysZero = () => 0;

function makeQuestion(id: string, tag: TagId): Question {
  return { id, tag, type: 'ox', prompt: `prompt ${id}`, explanation: `why ${id}`, answer: true };
}

const POOL: Question[] = [
  makeQuestion('r1', 'rules'),
  makeQuestion('r2', 'rules'),
  makeQuestion('r3', 'rules'),
  makeQuestion('f1', 'faults'),
  makeQuestion('f2', 'faults'),
  makeQuestion('e1', 'equipment'),
];

describe('buildQuiz', () => {
  it('returns only questions from the selected tags', () => {
    const result = buildQuiz(POOL, ['faults'], 20, alwaysZero);
    expect(result.map((q) => q.id).sort()).toEqual(['f1', 'f2']);
  });

  it('draws from every selected tag', () => {
    const result = buildQuiz(POOL, ['faults', 'equipment'], 20, alwaysZero);
    expect(result.map((q) => q.id).sort()).toEqual(['e1', 'f1', 'f2']);
  });

  it('caps the result at count', () => {
    const result = buildQuiz(POOL, ['rules'], 2, alwaysZero);
    expect(result).toHaveLength(2);
  });

  it('returns every available question when the pool is smaller than count', () => {
    const result = buildQuiz(POOL, ['rules'], 20, alwaysZero);
    expect(result).toHaveLength(3);
  });

  it('returns an empty array when no tags are selected', () => {
    expect(buildQuiz(POOL, [], 20, alwaysZero)).toEqual([]);
  });

  it('returns an empty array when the selected tag has no questions', () => {
    expect(buildQuiz(POOL, ['tournament'], 20, alwaysZero)).toEqual([]);
  });

  it('does not mutate the input pool', () => {
    const before = POOL.map((q) => q.id);
    buildQuiz(POOL, ['rules', 'faults'], 20, alwaysZero);
    expect(POOL.map((q) => q.id)).toEqual(before);
  });
});
