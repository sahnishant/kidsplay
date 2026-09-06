import { expect, type Page } from '@playwright/test';

export type MotionPolicy = 'reduce' | 'no-preference';

export async function expectMotionPolicy(page: Page, policy: MotionPolicy): Promise<void> {
  await expect.poll(
    () => page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    { message: `The browser must actually use the ${policy} motion policy` }
  ).toBe(policy === 'reduce');
}

export async function emulateMotionPolicy(page: Page, policy: MotionPolicy): Promise<void> {
  // Apply the policy to the page explicitly: the suite option alone did not reach
  // Chromium in the failing CI run. Never infer emulation from the test's title.
  await page.emulateMedia({ reducedMotion: policy });
  await expectMotionPolicy(page, policy);
}
