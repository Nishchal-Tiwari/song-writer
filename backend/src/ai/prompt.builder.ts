import { Injectable } from '@nestjs/common';
import { SectionTemplate } from '../validation/candidate.validator';

@Injectable()
export class PromptBuilder {
  buildAgentSystemPrompt(options: {
    songTitle: string;
    sectionName: string;
    template: SectionTemplate;
  }): string {
    const { template } = options;
    const validateStress = template.validateStress ?? false;
    const rhymePlan = this.describeRhyme(template);
    const lineSpec = this.describeLines(template, validateStress);
    const endWordPlan = this.describeEndWordPlan(template);

    const lines = [
      'You are a songwriting assistant. Lyrics must fit an existing melody,',
      'so every line must satisfy strict formal constraints.',
      '',
      `Song: ${options.songTitle}`,
      `Section: ${options.sectionName}`,
      '',
      'Write EXACTLY these lines:',
      lineSpec,
      '',
      'Rhyme scheme:',
      rhymePlan,
      '',
      'End-word plan (do this FIRST, before writing any line):',
      endWordPlan,
      '',
      'Hard rules for word choice:',
      '- Use simple, common English words only.',
      '- Avoid rare words, archaic words, slang, contractions (don\'t, aren\'t), and misspellings.',
      '- Avoid proper names and made-up words (they break pronunciation lookup).',
      '- Each line MUST end with its planned rhyme word.',
      '- Verify every planned end-word pair with compare_rhyme before writing lines.',
    ];

    if (validateStress) {
      lines.push(
        '',
        'Stress pattern: 0 = unstressed, 1 = stressed. Each line MUST match its',
        'stress pattern exactly. Verify with validate_line.',
      );
    } else {
      lines.push(
        '',
        'Stress is NOT enforced. Focus only on exact syllable count and rhyme.',
      );
    }

    lines.push(
      '',
      'Tools (use in this order):',
      '1. compare_rhyme — verify two end words rhyme perfectly BEFORE writing',
      '2. lookup_word — confirm a word exists in the dictionary and check syllables',
      '3. validate_line — check one line\'s syllable count',
      '4. validate_verse — check the full verse including rhyme scheme',
      '',
      'Workflow:',
      'Step 1: Pick end rhyme words for each rhyme group. compare_rhyme each pair.',
      'Step 2: Write one line at a time ending with the planned word.',
      'Step 3: validate_line after each line. If it fails, read "failures" and fix.',
      'Step 4: validate_verse when all lines are done.',
      'Step 5: If validate_verse fails, read the "guidance" array and fix ONLY what it says.',
      'Step 6: Repeat until validate_verse returns valid: true.',
      '',
      'Never submit a verse without calling validate_verse. Never stop until valid: true.',
    );

    return lines.join('\n');
  }

  buildAgentUserPrompt(userRequest: string): string {
    return [
      'Content request (what each line should say or evoke):',
      userRequest,
      '',
      'Formal constraints (syllable count + rhyme) take priority over meaning.',
      'Start by picking end rhyme words with compare_rhyme, then write each line.',
    ].join('\n');
  }

  private describeLines(
    template: SectionTemplate,
    validateStress: boolean,
  ): string {
    return template.lineConstraints
      .map((line) => {
        const parts = [`  Line ${line.lineNumber}: ${line.syllableCount} syllables`];
        if (validateStress) {
          parts.push(`stress ${line.stressPattern}`);
        }
        return parts.join(' · ');
      })
      .join('\n');
  }

  private describeRhyme(template: SectionTemplate): string {
    const scheme = template.rhymeScheme?.toUpperCase() ?? '';
    const groups = new Map<string, number[]>();

    scheme.split('').forEach((label, index) => {
      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)?.push(index + 1);
    });

    const rhymingGroups = [...groups.entries()]
      .filter(([, lineNumbers]) => lineNumbers.length > 1)
      .map(
        ([label, lineNumbers]) =>
          `  Group ${label}: lines ${lineNumbers.join(' & ')} must end with the same rhyme sound`,
      );

    if (rhymingGroups.length === 0) {
      return `  ${scheme || 'none'} (no lines need to rhyme)`;
    }

    return [`  Scheme: ${scheme}`, ...rhymingGroups].join('\n');
  }

  private describeEndWordPlan(template: SectionTemplate): string {
    const scheme = template.rhymeScheme?.toUpperCase() ?? '';
    const suggestions: Record<string, [string, string]> = {
      A: ['night', 'light'],
      B: ['room', 'gloom'],
      C: ['day', 'away'],
      D: ['heart', 'apart'],
    };

    const groups = new Map<string, number[]>();
    scheme.split('').forEach((label, index) => {
      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)?.push(index + 1);
    });

    const plans: string[] = [];

    for (const [label, lineNumbers] of groups) {
      if (lineNumbers.length < 2) {
        continue;
      }

      const [word1, word2] = suggestions[label] ?? ['word1', 'word2'];
      plans.push(
        `  Group ${label} (lines ${lineNumbers.join(', ')}): end with words like "${word1}" / "${word2}" — verify with compare_rhyme`,
      );
    }

    if (plans.length === 0) {
      return '  No rhyming lines required.';
    }

    return plans.join('\n');
  }
}
