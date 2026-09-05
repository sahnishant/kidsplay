import { expect, test, type Locator, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { openCleanApp } from './helpers/childJourney';

type Sequence = { id: string; prompt: {text:string}; feedback: {correct:string;incorrect:string}; interaction: {items:Array<{id:string;label:string}>}; solution:{orderedItemIds:string[]} };
const questions: Sequence[] = ['__generated-from-knowledge.json','__generated-story-studios.json'].flatMap((file) => JSON.parse(readFileSync(resolve(process.cwd(),'content/questions',file),'utf8')));
const pilots = [
  {topic:'Earth',title:'From sunrise to midnight',activity:'studio.earth.day-sequence',question:'earth.studio.day-sequence.001'},
  {topic:'Earth',title:'When ice melts',activity:'studio.earth.ice-melting',question:'earth.studio.ice-melting.001'},
  {topic:'Earth',title:'When water freezes',activity:'studio.earth.water-freezing',question:'earth.studio.water-freezing.001'},
  {topic:'Lion',title:'A lion grows up',activity:'studio.lion.growth',question:'lion.studio.growth.001'},
  {topic:'Fire Station',title:'Dheu visits the fire station',activity:'studio.fire-station.visit-story',question:'fire-station.studio.visit-story.001'},
  {topic:'Plants',title:'From seed to young plant',activity:'studio.plants.seed-growth',question:'plants.studio.seed-growth.001'}
];
const storageKey = (activity:string) => `kidsplay.studioWork.v1:local-child:${activity}`;
async function evidence(page:Page) {
  return page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((name) => /progress|mastery|evidence|attempt/i.test(name)).sort().map((name) => [name,localStorage.getItem(name)])));
}
async function work(page:Page,activity:string) { return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'),storageKey(activity)); }
async function openTopic(page:Page,topic:string) {
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button',{name:'Open practice activities'}).click();
  await page.getByRole('button',{name:'Open Learn About'}).click();
  await page.getByRole('button',{name:`Learn about ${topic}`,exact:true}).click();
  await page.getByRole('button',{name:/D2\s*Connect/}).click();
}
async function openPilot(page:Page,pilot:typeof pilots[number]) {
  await openTopic(page,pilot.topic);
  await page.getByRole('button',{name:new RegExp(`^${pilot.title}`)}).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.sequence-order__item')).toHaveCount(questions.find((question) => question.id === pilot.question)!.interaction.items.length);
  return dialog;
}
async function labels(dialog:Locator) { return dialog.locator('.sequence-order__item > span:last-child').allTextContents(); }
async function arrange(dialog:Locator,order:string[]) {
  for (let destination=0;destination<order.length;destination++) {
    const current = await labels(dialog);
    let index = current.indexOf(order[destination]);
    expect(index).toBeGreaterThanOrEqual(destination);
    while(index>destination) {
      await dialog.getByRole('button',{name:`Move ${order[destination]} earlier`,exact:true}).click();
      index--;
    }
  }
  expect(await labels(dialog)).toEqual(order);
}

test.describe('cross-topic studio teaching and recovery',() => {
  test.use({viewport:{width:360,height:640},hasTouch:true,reducedMotion:'reduce'});
  for (const pilot of pilots) test(`${pilot.topic}: ${pilot.title} reads, practices and restores without mastery`,async({page},info) => {
    test.setTimeout(90000);
    const source = questions.find((question) => question.id === pilot.question)!;
    const orderedLabels = source.solution.orderedItemIds.map((id) => source.interaction.items.find((item) => item.id === id)!.label);
    await openCleanApp(page);
    const before = await evidence(page);
    const dialog = await openPilot(page,pilot);
    await expect(dialog.locator('.studio__prompt')).toHaveText(source.prompt.text);
    await dialog.getByRole('button',{name:'Show me',exact:true}).tap();
    for (let i=0;i<orderedLabels.length;i++) {
      await expect(dialog.locator('.studio__step strong')).toHaveText(orderedLabels[i]);
      if(i+1<orderedLabels.length) await dialog.getByRole('button',{name:'Next step',exact:true}).click();
    }
    await expect(dialog.getByRole('button',{name:'Next step',exact:true})).toBeDisabled();
    expect((await work(page,pilot.activity)).workspace.learning.checkCount).toBe(0);
    expect(await evidence(page)).toEqual(before);
    if(pilot.topic === 'Fire Station') await expect(dialog.getByText('Read this story at your own pace. You do not need to answer to reach the ending.',{exact:true})).toBeVisible();
    await page.screenshot({path:info.outputPath(`studio-${pilot.activity}-reading.png`)});
    await dialog.getByRole('button',{name:'Try it',exact:true}).click();
    // Exercise a tap swap and its keyboard equivalent before arranging the task.
    await dialog.locator('.sequence-order__item').nth(0).tap();
    await dialog.locator('.sequence-order__item').nth(1).tap();
    await dialog.locator('.sequence-order__item').nth(0).focus();
    await page.keyboard.press('Space');
    await dialog.locator('.sequence-order__item').nth(1).focus();
    await page.keyboard.press('Enter');
    await arrange(dialog,orderedLabels);
    await dialog.getByRole('button',{name:'Check order',exact:true}).click();
    await expect(dialog.getByText(source.feedback.correct,{exact:true})).toBeVisible();
    expect((await work(page,pilot.activity)).workspace.learning.checkCount).toBe(1);
    const submitted = (await work(page,pilot.activity)).workspace.state;
    await page.reload();
    const restored = await openPilot(page,pilot);
    await expect(restored.getByRole('button',{name:'Try it',exact:true})).toHaveAttribute('aria-pressed','true');
    await expect(restored.getByRole('button',{name:'Change my answer',exact:true})).toBeVisible();
    expect((await work(page,pilot.activity)).workspace.state).toEqual(submitted);
    expect((await work(page,pilot.activity)).workspace.learning.checkCount).toBe(1);
    expect(await evidence(page)).toEqual(before);
    const bounds = await restored.boundingBox();
    expect(bounds!.width).toBeLessThanOrEqual(360);
    expect(bounds!.height).toBeLessThanOrEqual(640);
    expect(await restored.locator('.studio__body').evaluate((element) => element.scrollWidth <= element.clientWidth+1)).toBe(true);
    await page.screenshot({path:info.outputPath(`studio-${pilot.activity}-restored.png`)});
  });

  test('opposite water processes retain distinct context and source-specific retry feedback',async({page}) => {
    await openCleanApp(page);
    const pilot = pilots[1];
    const source = questions.find((question) => question.id === pilot.question)!;
    const dialog = await openPilot(page,pilot);
    await expect(dialog.locator('.studio__prompt')).toContainText('melts');
    await dialog.getByRole('button',{name:'Try it',exact:true}).click();
    await arrange(dialog,['Liquid water','Ice']);
    await dialog.getByRole('button',{name:'Check order',exact:true}).click();
    await expect(dialog.getByText(source.feedback.incorrect,{exact:true})).toBeVisible();
    const oldWork = await work(page,pilot.activity);
    await dialog.getByRole('button',{name:'Back to topic',exact:true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button',{name:/^When water freezes/}).click();
    const freezing = page.getByRole('dialog');
    await expect(freezing.locator('.studio__prompt')).toContainText('freezes');
    await freezing.getByRole('button',{name:'Show me',exact:true}).click();
    await expect(freezing.locator('.studio__step strong')).toHaveText('Liquid water');
    expect((await work(page,pilots[2].activity)).workspace.learning.checkCount).toBe(0);
    expect(await work(page,pilot.activity)).toEqual(oldWork);
  });

  test('new pilots do not leak into the introductory Earth, Lion or Fire Station depth',async({page}) => {
    await openCleanApp(page);
    await openTopic(page,'Earth');
    await page.getByRole('button',{name:/D1\s*Discover/}).click();
    await expect(page.getByRole('button',{name:/^From sunrise to midnight|^When ice melts|^When water freezes/})).toHaveCount(0);
    for(const topic of ['Lion','Fire Station']) {
      await page.getByRole('button',{name:'Back to Learn About topics'}).click();
      await page.getByRole('button',{name:`Learn about ${topic}`,exact:true}).click();
      await page.getByRole('button',{name:/D1\s*Discover/}).click();
      await expect(page.getByRole('button',{name:/^A lion grows up|^Dheu visits the fire station/})).toHaveCount(0);
    }
  });
});
