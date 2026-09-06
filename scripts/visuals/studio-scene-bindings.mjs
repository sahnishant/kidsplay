import { readFileSync } from 'node:fs';
import { bindStudioScene, validateStudioSceneBindings } from './studio-scene-bindings-core.mjs';
const root = new URL('../../', import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const bindings = validateStudioSceneBindings(read('content/experience/studio-scene-bindings.json'), read('content/visuals/studio-scenes.json'));
const byQuestion = new Map(bindings.map((binding) => [binding.questionId, binding]));
export function decorateStudioQuestions(questions) {
  return questions.map((question) => bindStudioScene(question, byQuestion.get(question.id)));
}
