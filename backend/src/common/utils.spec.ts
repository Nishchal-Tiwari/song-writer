import {
  normalizeStressPattern,
  getRhymePairs,
  extractLastWord,
  wordLookupVariants,
} from './utils';

describe('utils', () => {
  it('normalizes stress arrays to binary strings', () => {
    expect(normalizeStressPattern([0, 1, 2, 0, 1])).toBe('01101');
  });

  it('parses ABBA rhyme pairs', () => {
    expect(getRhymePairs('ABBA')).toEqual([
      [0, 3],
      [1, 2],
    ]);
  });

  it('extracts last word from a line', () => {
    expect(extractLastWord('A little boy sleeps all alone.')).toBe('alone');
  });

  it('creates inflection variants for dictionary lookup', () => {
    expect(wordLookupVariants('enfolds')).toContain('enfold');
    expect(wordLookupVariants('walls')).toContain('wall');
  });
});
