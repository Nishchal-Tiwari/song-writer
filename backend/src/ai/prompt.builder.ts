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
      'Hard rules for word choice:',
      '- Use simple, common English words.',
      '- Avoid rare words, archaic words, slang, and misspellings.',
      '- Avoid proper names and made-up words (they break pronunciation lookup).',
      '- Prefer simple rhyme pairs: room/moon, night/light, alone/known, sleep/deep, day/away.',
    ];

    if (validateStress) {
      lines.push(
        '',
        'Stress pattern: 0 = unstressed, 1 = stressed. Each line MUST match its',
        'stress pattern exactly. This is the hardest constraint — choose words',
        'whose natural stress lines up, and verify with the tools.',
      );
    } else {
      lines.push(
        '',
        'Stress patterns are NOT enforced for this section. Focus only on the',
        'exact syllable count per line and the rhyme scheme. Do not reject a line',
        'for stress; the tools will not fail lines on stress.',
      );
    }

    lines.push(
      '',
      'You have validation tools (like MCP functions). You MUST use them:',
      '1. lookup_word — confirm a rhyme/end word exists and check its syllables',
      '2. validate_line — check one line against its constraints',
      '3. validate_verse — check the full verse including rhyme scheme',
      '',
      'Workflow (generate → validate → read the failure → fix → repeat):',
      '- Draft each line to match the required syllable count.',
      '- Call validate_line for each line. If it fails, read the "failures"',
      '  field, change only what is wrong (e.g. add/remove a syllable or swap',
      '  the end word), and validate again.',
      '- When all lines pass, call validate_verse to confirm the rhyme scheme.',
      '- Only stop once validate_verse returns "valid": true.',
    );

    return lines.join('\n');
  }

  buildAgentUserPrompt(userRequest: string): string {
    return [
      'Content request (what each line should say or evoke):',
      userRequest,
      '',
      'Keep the meaning close to the request, but the formal constraints',
      '(syllable count and rhyme) take priority. Validate every line with the',
      'tools before you finish.',
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
          `  Lines ${lineNumbers.join(' & ')} rhyme (group ${label})`,
      );

    if (rhymingGroups.length === 0) {
      return `  ${scheme || 'none'} (no lines need to rhyme)`;
    }

    return [`  Scheme: ${scheme}`, ...rhymingGroups].join('\n');
  }
}
