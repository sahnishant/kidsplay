import { mount } from 'svelte';
import './styles.css';
import './appShell.css';
import './word-search.css';
import './interactionStyles.css';
import './crossword.css';
import './maze.css';
import './viewport.css';
import './touchTargets.css';
import './forestSessionPolish.css';
import './sessionCompact.css';
import App from './App.svelte';
import NavigationPrototypeApp from './ui/navigationPrototype/NavigationPrototypeApp.svelte';
import { installViewportFocusKeeper } from './runtime/viewportFocus';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root');

installViewportFocusKeeper();
const showNavigationPrototype = new URLSearchParams(window.location.search).get('nav100') === '1';
mount(showNavigationPrototype ? NavigationPrototypeApp : App, { target: root });
