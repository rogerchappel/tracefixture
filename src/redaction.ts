import os from 'node:os';
import path from 'node:path';
import type { CustomPattern, RedactionEntry } from './types.js';

type Rule = {
  kind: RedactionEntry['kind'];
  label?: string;
  pattern: RegExp;
  replacement: string;
};

export type RedactionResult = {
  value: string;
  entries: RedactionEntry[];
};

export function parseCustomPattern(value: string): CustomPattern {
  const equalsIndex = value.indexOf('=');
  if (equalsIndex <= 0) {
    throw new Error(`Invalid redaction pattern "${value}". Use name=pattern=replacement.`);
  }

  const label = value.slice(0, equalsIndex);
  const rest = value.slice(equalsIndex + 1);
  const split = rest.lastIndexOf('=');
  if (split <= 0) {
    throw new Error(`Invalid redaction pattern "${value}". Use name=pattern=replacement.`);
  }

  return {
    label,
    pattern: new RegExp(rest.slice(0, split), 'g'),
    replacement: rest.slice(split + 1)
  };
}

export function redactText(input: string, options: { cwd?: string; customPatterns?: CustomPattern[] } = {}): RedactionResult {
  const rules = buildRules(options.cwd, options.customPatterns ?? []);
  let value = input;
  const entries: RedactionEntry[] = [];

  for (const rule of rules) {
    let count = 0;
    value = value.replace(rule.pattern, () => {
      count += 1;
      return rule.replacement;
    });

    if (count > 0) {
      const entry: RedactionEntry = {
        kind: rule.kind,
        replacement: rule.replacement,
        count
      };
      if (rule.label) {
        entry.label = rule.label;
      }
      entries.push(entry);
    }
  }

  return { value, entries };
}

export function mergeRedactions(groups: RedactionEntry[][]): RedactionEntry[] {
  const merged = new Map<string, RedactionEntry>();

  for (const group of groups) {
    for (const entry of group) {
      const key = [entry.kind, entry.label ?? '', entry.replacement].join('\\0');
      const existing = merged.get(key);
      if (existing) {
        existing.count += entry.count;
      } else {
        merged.set(key, { ...entry });
      }
    }
  }

  return [...merged.values()].sort((a, b) => {
    const ak = `${a.kind}:${a.label ?? ''}:${a.replacement}`;
    const bk = `${b.kind}:${b.label ?? ''}:${b.replacement}`;
    return ak.localeCompare(bk);
  });
}

function buildRules(cwd: string | undefined, customPatterns: CustomPattern[]): Rule[] {
  const rules: Rule[] = [
    {
      kind: 'timestamp',
      pattern: /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z\b/g,
      replacement: '<TIMESTAMP>'
    }
  ];

  if (cwd) {
    rules.push(...pathRules(path.resolve(cwd), '<CWD>', 'cwd'));
  }

  const home = os.homedir();
  if (home) {
    rules.push(...pathRules(home, '<HOME>', 'home'));
  }

  rules.push(...pathRules(os.tmpdir(), '<TMP>', 'temp'));

  for (const [key, value] of Object.entries(process.env)) {
    if (!value || value.length < 4 || !/(TOKEN|SECRET|PASSWORD|PASS|API[_-]?KEY|AUTH|CREDENTIAL)/i.test(key)) {
      continue;
    }

    rules.push({
      kind: 'env',
      label: key,
      pattern: new RegExp(escapeRegExp(value), 'g'),
      replacement: `<ENV:${key}>`
    });
  }

  for (const pattern of customPatterns) {
    rules.push({
      kind: 'custom',
      label: pattern.label,
      pattern: pattern.pattern,
      replacement: pattern.replacement
    });
  }

  return rules;
}

function pathRules(value: string, replacement: string, kind: RedactionEntry['kind']): Rule[] {
  const normalized = path.resolve(value);
  const variants = new Set([normalized, normalized.split(path.sep).join('/')]);
  return [...variants]
    .filter((variant) => variant.length > 1)
    .map((variant) => ({
      kind,
      pattern: new RegExp(escapeRegExp(variant), 'g'),
      replacement
    }));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
