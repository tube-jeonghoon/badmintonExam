import { describe, expect, it } from 'vitest';
import { QUESTIONS } from './questions';
import { TAG_IDS } from './tags';

describe('QUESTIONS data integrity', () => {
  it('has no duplicate ids', () => {
    const ids = QUESTIONS.map((q) => q.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    expect(duplicates).toEqual([]);
  });

  it('only uses tags declared in tags.ts', () => {
    const unknown = QUESTIONS.filter((q) => !TAG_IDS.includes(q.tag));
    expect(unknown.map((q) => q.id)).toEqual([]);
  });

  it('gives every question a non-empty prompt', () => {
    const blank = QUESTIONS.filter((q) => q.prompt.trim() === '');
    expect(blank.map((q) => q.id)).toEqual([]);
  });

  it('gives every question a non-empty explanation', () => {
    const blank = QUESTIONS.filter((q) => q.explanation.trim() === '');
    expect(blank.map((q) => q.id)).toEqual([]);
  });

  it('keeps every answerIndex within the choices array', () => {
    const broken = QUESTIONS.filter(
      (q) => q.type === 'choice' && (q.answerIndex < 0 || q.answerIndex >= q.choices.length),
    );
    expect(broken.map((q) => q.id)).toEqual([]);
  });

  it('gives every choice question four non-empty, distinct options', () => {
    const broken = QUESTIONS.filter((q) => {
      if (q.type !== 'choice') return false;
      const trimmed = q.choices.map((c) => c.trim());
      return trimmed.length !== 4 || trimmed.some((c) => c === '') || new Set(trimmed).size !== 4;
    });
    expect(broken.map((q) => q.id)).toEqual([]);
  });

  it('gives every fill question a non-empty answer', () => {
    const broken = QUESTIONS.filter((q) => q.type === 'fill' && q.answer.trim() === '');
    expect(broken.map((q) => q.id)).toEqual([]);
  });

  it('has at least one question per tag', () => {
    const empty = TAG_IDS.filter((tag) => !QUESTIONS.some((q) => q.tag === tag));
    expect(empty).toEqual([]);
  });

  it('prefixes every id with its own tag', () => {
    const mismatched = QUESTIONS.filter((q) => !q.id.startsWith(`${q.tag}-`));
    expect(mismatched.map((q) => q.id)).toEqual([]);
  });

  it('only uses known difficulty values', () => {
    const bad = QUESTIONS.filter(
      (q) => q.difficulty !== undefined && q.difficulty !== 'basic' && q.difficulty !== 'hard',
    );
    expect(bad.map((q) => q.id)).toEqual([]);
  });

  it('gives every essay question a non-empty answer', () => {
    const broken = QUESTIONS.filter((q) => q.type === 'essay' && q.answer.trim() === '');
    expect(broken.map((q) => q.id)).toEqual([]);
  });

  it('gives every essay keyPoint non-empty text', () => {
    const broken = QUESTIONS.filter(
      (q) => q.type === 'essay' && (q.keyPoints ?? []).some((p) => p.trim() === ''),
    );
    expect(broken.map((q) => q.id)).toEqual([]);
  });

  it('marks every essay question as hard difficulty', () => {
    const broken = QUESTIONS.filter((q) => q.type === 'essay' && q.difficulty !== 'hard');
    expect(broken.map((q) => q.id)).toEqual([]);
  });
});
