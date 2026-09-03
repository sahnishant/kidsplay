const SPLASH_ID = 'kidsplay-answer-feedback-splash';
const STYLE_ID = 'kidsplay-answer-feedback-styles';
const SPLASH_DURATION_MS = 900;

let removeTimer: ReturnType<typeof setTimeout> | null = null;

function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .kidsplay-answer-splash {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: grid;
      place-items: center;
      pointer-events: none;
      animation: kidsplay-answer-splash-fade ${SPLASH_DURATION_MS}ms ease-out forwards;
    }

    .kidsplay-answer-splash--correct {
      background: radial-gradient(circle at center,
        rgba(74, 214, 123, .72) 0%,
        rgba(74, 214, 123, .34) 34%,
        rgba(74, 214, 123, .10) 58%,
        rgba(74, 214, 123, 0) 76%);
    }

    .kidsplay-answer-splash--incorrect {
      background: radial-gradient(circle at center,
        rgba(127, 111, 163, .36) 0%,
        rgba(127, 111, 163, .17) 38%,
        rgba(127, 111, 163, 0) 74%);
    }

    .kidsplay-answer-splash__badge {
      width: min(210px, 52vw);
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      align-content: center;
      gap: 5px;
      border-radius: 999px;
      background: rgba(255, 255, 255, .95);
      box-shadow: 0 18px 52px rgba(36, 48, 58, .20);
      animation: kidsplay-answer-badge-pop 560ms cubic-bezier(.2, .82, .2, 1) forwards;
    }

    .kidsplay-answer-splash--correct .kidsplay-answer-splash__badge {
      color: #168748;
    }

    .kidsplay-answer-splash--incorrect .kidsplay-answer-splash__badge {
      color: #76567f;
    }

    .kidsplay-answer-splash__icon {
      font: 950 clamp(3.4rem, 13vw, 5.1rem)/.9 system-ui, sans-serif;
    }

    .kidsplay-answer-splash__label {
      font: 950 clamp(1.2rem, 5vw, 1.65rem)/1.05 system-ui, sans-serif;
      letter-spacing: -.02em;
    }

    @keyframes kidsplay-answer-splash-fade {
      0% { opacity: 0; }
      14%, 68% { opacity: 1; }
      100% { opacity: 0; }
    }

    @keyframes kidsplay-answer-badge-pop {
      0% { transform: scale(.58) rotate(-5deg); opacity: 0; }
      58% { transform: scale(1.08) rotate(2deg); opacity: 1; }
      100% { transform: scale(1) rotate(0); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .kidsplay-answer-splash {
        animation: kidsplay-answer-splash-fade-reduced 450ms linear forwards;
      }

      .kidsplay-answer-splash__badge {
        animation: none;
      }

      @keyframes kidsplay-answer-splash-fade-reduced {
        0%, 65% { opacity: .78; }
        100% { opacity: 0; }
      }
    }
  `;
  document.head.appendChild(style);
}

function removeExistingSplash(): void {
  if (removeTimer) {
    clearTimeout(removeTimer);
    removeTimer = null;
  }
  document.getElementById(SPLASH_ID)?.remove();
}

/**
 * Shows a short, non-interactive reaction over the current screen. The regular
 * session feedback remains the accessible status announcement underneath it.
 */
export function showAnswerFeedbackSplash(correct: boolean): void {
  if (typeof document === 'undefined') return;

  ensureStyles();
  removeExistingSplash();

  const splash = document.createElement('div');
  splash.id = SPLASH_ID;
  splash.className = `kidsplay-answer-splash kidsplay-answer-splash--${correct ? 'correct' : 'incorrect'}`;
  splash.dataset.answerFeedback = correct ? 'correct' : 'incorrect';
  splash.setAttribute('aria-hidden', 'true');

  const badge = document.createElement('div');
  badge.className = 'kidsplay-answer-splash__badge';

  const icon = document.createElement('span');
  icon.className = 'kidsplay-answer-splash__icon';
  icon.textContent = correct ? '✓' : '×';

  const label = document.createElement('strong');
  label.className = 'kidsplay-answer-splash__label';
  label.textContent = correct ? 'Correct!' : 'Not quite!';

  badge.append(icon, label);
  splash.appendChild(badge);
  document.body.appendChild(splash);

  removeTimer = setTimeout(() => {
    splash.remove();
    removeTimer = null;
  }, SPLASH_DURATION_MS);
}
