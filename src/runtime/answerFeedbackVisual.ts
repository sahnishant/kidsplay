const SPLASH_ID = 'kidsplay-answer-feedback-splash';
const STYLE_ID = 'kidsplay-answer-feedback-styles';
const SPLASH_DURATION_MS = 1100;

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
      background:
        radial-gradient(circle at 24% 36%, rgba(255, 206, 61, .35) 0 2.2%, transparent 2.7%),
        radial-gradient(circle at 76% 32%, rgba(255, 206, 61, .31) 0 1.8%, transparent 2.3%),
        radial-gradient(circle at 70% 72%, rgba(98, 201, 118, .30) 0 2.3%, transparent 2.8%),
        radial-gradient(circle at center,
          rgba(74, 214, 123, .78) 0%,
          rgba(74, 214, 123, .38) 34%,
          rgba(74, 214, 123, .12) 58%,
          rgba(74, 214, 123, 0) 78%);
    }

    .kidsplay-answer-splash--incorrect {
      background: radial-gradient(circle at center,
        rgba(127, 111, 163, .28) 0%,
        rgba(127, 111, 163, .13) 38%,
        rgba(127, 111, 163, 0) 74%);
    }

    .kidsplay-answer-splash__badge {
      position: relative;
      width: min(214px, 54vw);
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      align-content: center;
      gap: 6px;
      border: 4px solid rgba(255,255,255,.82);
      border-radius: 999px;
      background: rgba(255, 255, 255, .96);
      box-shadow: 0 20px 58px rgba(36, 48, 58, .22);
      animation: kidsplay-answer-badge-pop 620ms cubic-bezier(.2, .82, .2, 1) forwards;
    }

    .kidsplay-answer-splash--correct .kidsplay-answer-splash__badge {
      color: #168748;
      box-shadow:
        0 20px 58px rgba(36, 48, 58, .18),
        0 0 0 10px rgba(255,255,255,.18),
        0 0 0 20px rgba(69,196,113,.10);
    }

    .kidsplay-answer-splash--correct .kidsplay-answer-splash__badge::before,
    .kidsplay-answer-splash--correct .kidsplay-answer-splash__badge::after {
      position: absolute;
      color: #f2b71e;
      font: 950 2rem/1 system-ui, sans-serif;
      content: '✦';
      text-shadow: 0 2px 7px rgba(204,145,13,.14);
      animation: kidsplay-answer-sparkle 700ms ease-out both;
    }

    .kidsplay-answer-splash--correct .kidsplay-answer-splash__badge::before {
      left: -20px;
      top: 30px;
      transform: rotate(-12deg);
    }

    .kidsplay-answer-splash--correct .kidsplay-answer-splash__badge::after {
      right: -17px;
      bottom: 32px;
      animation-delay: 70ms;
    }

    .kidsplay-answer-splash--incorrect .kidsplay-answer-splash__badge {
      color: #76567f;
    }

    .kidsplay-answer-splash__icon {
      font: 950 clamp(3.7rem, 14vw, 5.4rem)/.9 system-ui, sans-serif;
    }

    .kidsplay-answer-splash__label {
      font: 950 clamp(1.2rem, 5vw, 1.68rem)/1.05 system-ui, sans-serif;
      letter-spacing: -.02em;
    }

    @keyframes kidsplay-answer-splash-fade {
      0% { opacity: 0; }
      12%, 72% { opacity: 1; }
      100% { opacity: 0; }
    }

    @keyframes kidsplay-answer-badge-pop {
      0% { transform: scale(.56) rotate(-5deg); opacity: 0; }
      55% { transform: scale(1.10) rotate(2deg); opacity: 1; }
      78% { transform: scale(.98) rotate(-1deg); opacity: 1; }
      100% { transform: scale(1) rotate(0); opacity: 1; }
    }

    @keyframes kidsplay-answer-sparkle {
      0% { opacity: 0; scale: .3; }
      45% { opacity: 1; scale: 1.25; }
      100% { opacity: .95; scale: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .kidsplay-answer-splash {
        animation: kidsplay-answer-splash-fade-reduced 520ms linear forwards;
      }

      .kidsplay-answer-splash__badge,
      .kidsplay-answer-splash--correct .kidsplay-answer-splash__badge::before,
      .kidsplay-answer-splash--correct .kidsplay-answer-splash__badge::after {
        animation: none;
      }

      @keyframes kidsplay-answer-splash-fade-reduced {
        0%, 68% { opacity: .82; }
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
  icon.textContent = correct ? '✓' : '↻';

  const label = document.createElement('strong');
  label.className = 'kidsplay-answer-splash__label';
  label.textContent = correct ? 'Great!' : 'Try again';

  badge.append(icon, label);
  splash.appendChild(badge);
  document.body.appendChild(splash);

  removeTimer = setTimeout(() => {
    splash.remove();
    removeTimer = null;
  }, SPLASH_DURATION_MS);
}
