import { describe, expect, it } from 'vitest';
import { buildQuiz } from './buildQuiz';
import type { Question, TagId } from '../types';

const alwaysZero = () => 0;

function makeQuestion(id: string, tag: TagId): Question {
  return { id, tag, type: 'ox', prompt: `prompt ${id}`, explanation: `why ${id}`, answer: true };
}

function makeHard(id: string, tag: TagId): Question {
  return {
    id,
    tag,
    type: 'ox',
    prompt: `prompt ${id}`,
    explanation: `why ${id}`,
    answer: true,
    difficulty: 'hard',
  };
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
    const result = buildQuiz(POOL, ['faults'], false, 20, alwaysZero);
    expect(result.map((q) => q.id).sort()).toEqual(['f1', 'f2']);
  });

  it('draws from every selected tag', () => {
    const result = buildQuiz(POOL, ['faults', 'equipment'], false, 20, alwaysZero);
    expect(result.map((q) => q.id).sort()).toEqual(['e1', 'f1', 'f2']);
  });

  it('caps the result at count', () => {
    const result = buildQuiz(POOL, ['rules'], false, 2, alwaysZero);
    expect(result).toHaveLength(2);
  });

  it('returns every available question when the pool is smaller than count', () => {
    const result = buildQuiz(POOL, ['rules'], false, 20, alwaysZero);
    expect(result).toHaveLength(3);
  });

  it('returns an empty array when no tags are selected', () => {
    expect(buildQuiz(POOL, [], false, 20, alwaysZero)).toEqual([]);
  });

  it('returns an empty array when the selected tag has no questions', () => {
    expect(buildQuiz(POOL, ['tournament'], false, 20, alwaysZero)).toEqual([]);
  });

  it('does not mutate the input pool', () => {
    const before = POOL.map((q) => q.id);
    buildQuiz(POOL, ['rules', 'faults'], false, 20, alwaysZero);
    expect(POOL.map((q) => q.id)).toEqual(before);
  });

  it('excludes hard questions when includeHard is false', () => {
    const pool = [makeQuestion('b1', 'rules'), makeHard('h1', 'rules')];
    const result = buildQuiz(pool, ['rules'], false, 20, alwaysZero);
    expect(result.map((q) => q.id)).toEqual(['b1']);
  });

  it('includes hard questions when includeHard is true', () => {
    const pool = [makeQuestion('b1', 'rules'), makeHard('h1', 'rules')];
    const result = buildQuiz(pool, ['rules'], true, 20, alwaysZero);
    expect(result.map((q) => q.id).sort()).toEqual(['b1', 'h1']);
  });

  it('treats a missing difficulty as basic', () => {
    const pool = [makeQuestion('b1', 'rules')];
    expect(buildQuiz(pool, ['rules'], false, 20, alwaysZero).map((q) => q.id)).toEqual(['b1']);
  });

  it('defaults includeHard to false when omitted', () => {
    const pool = [makeQuestion('b1', 'rules'), makeHard('h1', 'rules')];
    const result = buildQuiz(pool, ['rules']);
    expect(result.map((q) => q.id)).toEqual(['b1']);
  });
});
