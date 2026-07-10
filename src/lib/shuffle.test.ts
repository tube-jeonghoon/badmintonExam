import { describe, expect, it } from 'vitest';
import { fisherYates } from './shuffle';

const alwaysZero = () => 0;

describe('fisherYates', () => {
  it('produces a deterministic result for a fixed rng', () => {
    expect(fisherYates(['a', 'b', 'c'], alwaysZero)).toEqual(['b', 'c', 'a']);
  });

  it('preserves every element exactly once', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = fisherYates(input, () => 0.42);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(input);
  });

  it('does not mutate the input array', () => {
    const input = ['a', 'b', 'c'];
    fisherYates(input, alwaysZero);
    expect(input).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty array unchanged', () => {
    expect(fisherYates([], alwaysZero)).toEqual([]);
  });

  it('returns a single-element array unchanged', () => {
    expect(fisherYates(['only'], alwaysZero)).toEqual(['only']);
  });
});
