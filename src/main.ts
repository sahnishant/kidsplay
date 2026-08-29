import { mount } from 'svelte';
import './styles.css';
import './word-search.css';
import './interactionStyles.css';
import './crossword.css';
import './maze.css';
import App from './App.svelte';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root');

mount(App, { target: root });
