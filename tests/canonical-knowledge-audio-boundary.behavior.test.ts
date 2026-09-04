import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function collectJsonFiles(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? collectJsonFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

function collectStrings(value: unknown, path = '$'): Array<{ path: string; value: string }> {
  if (typeof value === 'string') return [{ path, value }];
  if (Array.isArray(value)) return value.flatMap((item, index) => collectStrings(item, `${path}[${index}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => collectStrings(child, `${path}.${key}`));
  }
  return [];
}

describe('canonical knowledge/audio ownership boundary', () => {
  it('keeps speech/audio file paths out of every canonical knowledge JSON row', () => {
    const knowledgeRoot = resolve(process.cwd(), 'content', 'knowledge');
    const violations = collectJsonFiles(knowledgeRoot).flatMap((file) => {
      const parsed = JSON.parse(readFileSync(file, 'utf8')) as unknown;
      return collectStrings(parsed)
        .filter(({ value }) => /(?:^|\/)audio\/|\.(?:mp3|wav|ogg|m4a)(?:$|[?#])/i.test(value))
        .map(({ path, value }) => `${file}:${path}=${value}`);
    });

    expect(violations, `canonical knowledge must reference semantic truth, never speech assets:\n${violations.join('\n')}`).toEqual([]);
  });
});
