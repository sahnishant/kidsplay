import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const index = JSON.parse(readFileSync(new URL('content/index/__generated-learning-index.json', root), 'utf8'));
const filters = Object.fromEntries(
  process.argv.slice(2)
    .filter((arg) => arg.startsWith('--') && arg.includes('='))
    .map((arg) => {
      const [key, ...rest] = arg.slice(2).split('=');
      return [key, rest.join('=')];
    })
);

const profileKeys = new Set(['country', 'pathway', 'boardOrGoal', 'grade', 'profile']);
const profileFilters = Object.entries(filters).filter(([key]) => profileKeys.has(key));
const matchesProfile = (profile) => profileFilters.every(([key, expected]) => {
  if (key === 'profile') return String(profile.profileRef) === expected;
  return String(profile[key] ?? '') === expected;
});

const matches = index.filter((item) => {
  if (filters.skill && !item.skills.includes(filters.skill)) return false;
  if (filters.level && item.knowledgeLevel !== filters.level) return false;
  if (filters.datatype && item.datatype !== filters.datatype) return false;
  if (filters.topic && item.topic !== filters.topic) return false;
  if (profileFilters.length && !item.profiles.some(matchesProfile)) return false;
  return true;
});

console.log(JSON.stringify(matches, null, 2));
console.error(`Matched ${matches.length} row(s).`);
