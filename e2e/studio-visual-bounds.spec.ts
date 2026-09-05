import { expect, test, type Page } from '@playwright/test';
import { openCleanApp } from './helpers/childJourney';

async function openTopic(page:Page,topic:string,title:RegExp) {
  await openCleanApp(page);
  await page.getByLabel('Open child navigation').click();
  await page.getByRole('button',{name:'Open practice activities'}).click();
  await page.getByRole('button',{name:'Open Learn About'}).click();
  await page.getByRole('button',{name:`Learn about ${topic}`,exact:true}).click();
  await page.getByRole('button',{name:/D2\s*Connect/}).click();
  await page.getByRole('button',{name:title}).click();
  return page.getByRole('dialog');
}

test.describe('cross-topic visual review regressions',() => {
  test.use({viewport:{width:360,height:640},hasTouch:true,reducedMotion:'reduce'});
  test('all plant illustrations stay inside their visual frame and away from the label',async({page},info) => {
    const dialog = await openTopic(page,'Plants',/^From seed to young plant/);
    await dialog.getByRole('button',{name:'Show me',exact:true}).click();
    for(const [i,label] of ['Seed','Sprout','Young plant'].entries()) {
      const title = dialog.locator('.studio__step strong');
      await expect(title).toHaveText(label);
      const frame = dialog.locator('.studio__illustration');
      await expect(frame).toBeVisible();
      const box = (await frame.boundingBox())!;
      const text = (await title.boundingBox())!;
      expect(text.y).toBeGreaterThanOrEqual(box.y+box.height);
      for(const svg of await frame.locator('svg').all()) {
        const image = (await svg.boundingBox())!;
        expect(image.x).toBeGreaterThanOrEqual(box.x-1);
        expect(image.y).toBeGreaterThanOrEqual(box.y-1);
        expect(image.x+image.width).toBeLessThanOrEqual(box.x+box.width+1);
        expect(image.y+image.height).toBeLessThanOrEqual(box.y+box.height+1);
      }
      if(i<2) await dialog.getByRole('button',{name:'Next step',exact:true}).click();
    }
    await page.screenshot({path:info.outputPath('studio-plant-readable.png')});
  });
  test('long story cards cannot push feedback and Change my answer below the viewport',async({page},info) => {
    const dialog = await openTopic(page,'Fire Station',/^Dheu visits the fire station/);
    await dialog.getByRole('button',{name:'Try it',exact:true}).click();
    await dialog.getByRole('button',{name:'Check order',exact:true}).click();
    const feedback = dialog.locator('.studio__feedback');
    await expect(feedback.getByRole('status')).not.toHaveText('');
    const change = feedback.getByRole('button',{name:'Change my answer',exact:true});
    await expect(change).toBeVisible();
    const box = (await change.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y+box.height).toBeLessThanOrEqual(640);
    const body = (await dialog.locator('.studio__body').boundingBox())!;
    expect(box.y+box.height).toBeLessThanOrEqual(body.y+1);
    await page.screenshot({path:info.outputPath('studio-story-visible-feedback.png')});
    await change.tap();
    await expect(dialog.getByRole('button',{name:'Check order',exact:true})).toBeEnabled();
  });
});
