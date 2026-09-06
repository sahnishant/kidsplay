/**
 * Export validated questions without their build-only semantic audit object.
 * Runtime evaluation, evidence policy, content revision and knowledge references
 * are retained verbatim. Authoring files remain the complete review authority.
 */
export function projectRuntimeQuestionJson(source, repositoryPath) {
  if (typeof source !== 'string' || typeof repositoryPath !== 'string') throw new TypeError('Runtime JSON projection requires source text and a repository path');
  const path = repositoryPath.replaceAll('\\', '/');
  const questionFile = /^content\/questions\/[^/]+\.json$/.test(path)
    || /^content\/curriculum-runtime\/[^/]+\/questions\/[^/]+\.json$/.test(path);
  if (!questionFile) return source;
  const values = JSON.parse(source);
  if (!Array.isArray(values)) throw new Error(`${path}: question export must be an array`);
  let changed = false;
  const projected = values.map((question) => {
    if (!question || typeof question !== 'object' || Array.isArray(question) || !Object.hasOwn(question, 'semanticTarget')) return question;
    if (typeof question.id !== 'string' || question.schemaVersion !== 1 || !question.prompt || !question.solution || question.interaction?.type !== 'single_choice') {
      throw new Error(`${path}: semantic audit metadata is not attached to a supported question`);
    }
    // Current target contract is deliberately candidate-only. A future approved
    // release needs its own reviewed projection, not silent policy removal here.
    if (question.evidencePolicy !== 'practice_only' || question.authoring?.status !== 'draft'
      || question.semanticTarget?.schemaVersion !== 1 || question.semanticTarget.review?.publishable !== false
      || question.semanticTarget.review?.status !== 'editorial_candidate') {
      throw new Error(`${question.id}: cannot export an unapproved target as mastery evidence`);
    }
    const { semanticTarget, ...runtimeQuestion } = question;
    changed = true;
    return runtimeQuestion;
  });
  return changed ? `${JSON.stringify(projected, null, 2)}\n` : source;
}
