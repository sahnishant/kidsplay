import { mount } from 'svelte';
import './styles.css';
import './home.css';
import './word-search.css';
import './interactionStyles.css';
import './crossword.css';
import './maze.css';
import './viewport.css';
import App from './App.svelte';
import { installViewportFocusKeeper } from './runtime/viewportFocus';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root');

installViewportFocusKeeper();
mount(App, { target: root });
