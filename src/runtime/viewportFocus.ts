export function installViewportFocusKeeper(): () => void {
  let scheduledFrame: number | null = null;

  const keepFocusedFieldVisible = (): void => {
    if (scheduledFrame !== null) cancelAnimationFrame(scheduledFrame);
    scheduledFrame = requestAnimationFrame(() => {
      scheduledFrame = null;
      const active = document.activeElement;
      if (!(active instanceof HTMLInputElement) && !(active instanceof HTMLTextAreaElement)) return;
      active.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
    });
  };

  window.addEventListener('resize', keepFocusedFieldVisible, { passive: true });
  window.visualViewport?.addEventListener('resize', keepFocusedFieldVisible, { passive: true });

  return () => {
    if (scheduledFrame !== null) cancelAnimationFrame(scheduledFrame);
    window.removeEventListener('resize', keepFocusedFieldVisible);
    window.visualViewport?.removeEventListener('resize', keepFocusedFieldVisible);
  };
}
