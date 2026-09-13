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
import { installViewportFocusKeeper } from './runtime/viewportFocus';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing #app root');

installViewportFocusKeeper();

// NAV100 is an isolated development prototype until explicit production promotion.
// Keeping the import behind import.meta.env.DEV prevents prototype-only navigation
// code from consuming the production bundle budget or changing the default app.
const showNavigationPrototype = import.meta.env.DEV
  && new URLSearchParams(window.location.search).get('nav100') === '1';

if (showNavigationPrototype) {
  void import('./ui/navigationPrototype/NavigationPrototypeApp.svelte').then(({ default: NavigationPrototypeApp }) => {
    mount(NavigationPrototypeApp, { target: root });
  });
} else {
  mount(App, { target: root });
}
