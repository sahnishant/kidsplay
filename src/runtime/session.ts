import type { Question } from '../contracts/question';
import type { EvaluationResult, QuestionResponseEnvelope } from '../contracts/runtime';
import { evaluate } from '../evaluation/evaluate';
import { renderScene } from '../presentation/sceneRenderer';
import { getEngine } from './engineRegistry';

export class SessionController {
  private readonly sessionId = crypto.randomUUID();
  private index = 0;
  private responses: QuestionResponseEnvelope[] = [];
  private results: EvaluationResult[] = [];
  private startedAtEpoch = 0;
  private startedAtIso = '';
  private submitted = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly title: string,
    private readonly questions: Question[]
  ) {}

  start(): void {
    this.renderCurrent();
  }

  private renderCurrent(): void {
    const question = this.questions[this.index];
    if (!question) {
      this.renderComplete();
      return;
    }

    this.submitted = false;
    this.startedAtEpoch = Date.now();
    this.startedAtIso = new Date(this.startedAtEpoch).toISOString();
    this.root.replaceChildren();

    const shell = document.createElement('section');
    shell.className = 'app-shell';

    const header = document.createElement('header');
    header.className = 'session-header';

    const headingWrap = document.createElement('div');
    const brand = document.createElement('div');
    brand.className = 'brand';
    brand.textContent = 'Kidsplay Lab';
    const packTitle = document.createElement('div');
    packTitle.className = 'pack-title';
    packTitle.textContent = this.title;
    headingWrap.append(brand, packTitle);

    const progress = document.createElement('div');
    progress.className = 'progress-pill';
    progress.textContent = `${this.index + 1} / ${this.questions.length}`;
    header.append(headingWrap, progress);

    const card = document.createElement('article');
    card.className = 'question-card';

    if (question.stimulus?.type === 'scene') card.append(renderScene(question.stimulus.sceneId));

    const prompt = document.createElement('h1');
    prompt.className = 'question-prompt';
    prompt.textContent = question.prompt.text;
    card.append(prompt);

    const interactionHost = document.createElement('div');
    interactionHost.className = 'interaction-host';
    card.append(interactionHost);

    const engine = getEngine(question);
    engine.mount({
      question,
      host: interactionHost,
      onSubmit: (response) => this.handleSubmit(question, response, card)
    });

    shell.append(header, card);
    this.root.append(shell);
  }

  private handleSubmit(question: Question, response: unknown, card: HTMLElement): void {
    if (this.submitted) return;
    this.submitted = true;

    const submittedAt = new Date();
    const result = evaluate(question, response);

    this.responses.push({
      sessionId: this.sessionId,
      questionId: question.id,
      questionRevision: question.revision,
      interactionType: question.interaction.type,
      interactionVersion: question.interaction.version,
      response,
      startedAt: this.startedAtIso,
      submittedAt: submittedAt.toISOString(),
      durationMs: submittedAt.getTime() - this.startedAtEpoch,
      attempts: 1,
      hintsUsed: []
    });
    this.results.push(result);

    const feedback = document.createElement('div');
    feedback.className = `feedback feedback--${result.correct ? 'correct' : 'incorrect'}`;
    feedback.setAttribute('role', 'status');

    const feedbackTitle = document.createElement('strong');
    feedbackTitle.textContent = result.correct ? 'Nice work!' : 'Try this idea';
    const feedbackText = document.createElement('span');
    feedbackText.textContent = question.feedback[result.feedbackKey];
    feedback.append(feedbackTitle, feedbackText);

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'next-button';
    next.textContent = this.index + 1 < this.questions.length ? 'Next' : 'See result';
    next.addEventListener('click', () => {
      this.index += 1;
      this.renderCurrent();
    });

    card.append(feedback, next);
    next.focus();
  }

  private renderComplete(): void {
    this.root.replaceChildren();
    const shell = document.createElement('section');
    shell.className = 'completion-card';

    const title = document.createElement('div');
    title.className = 'completion-emoji';
    title.textContent = '🌟';

    const heading = document.createElement('h1');
    heading.textContent = 'Pack complete';

    const correct = this.results.filter((result) => result.correct).length;
    const summary = document.createElement('p');
    summary.textContent = `You solved ${correct} of ${this.results.length} questions correctly.`;

    const replay = document.createElement('button');
    replay.type = 'button';
    replay.className = 'primary-button';
    replay.textContent = 'Play again';
    replay.addEventListener('click', () => {
      this.index = 0;
      this.responses = [];
      this.results = [];
      this.renderCurrent();
    });

    shell.append(title, heading, summary, replay);
    this.root.append(shell);
  }
}
