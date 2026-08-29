import './styles.css';
import './word-search.css';
import './interactionStyles.css';
import './crossword.css';
import { getFreeAnimalsPackTitle, getFreeAnimalsQuestions } from './content';
import { SessionController } from './runtime/session';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root');

const session = new SessionController(root, getFreeAnimalsPackTitle(), getFreeAnimalsQuestions());
session.start();
