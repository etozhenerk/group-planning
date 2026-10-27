import { chromium, webkit } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const results = [];
for (const [name, launcher] of [['chromium', chromium], ['webkit', webkit]] as const) {
 const browser = await launcher.launch();
 const page = await browser.newPage({ viewport: { width: 900, height: 850 } });
 const errors: string[]=[]; page.on('pageerror', error => errors.push(error.message));
 await page.goto('http://127.0.0.1:8460');
 const scroll = page.getByTestId('virtual-scroller');
 await scroll.waitFor();
 await scroll.evaluate(element => { element.scrollTop=24000; });
 await page.waitForTimeout(300);
 const capture = () => page.evaluate(() => {
  const view=document.querySelector('[data-testid="virtual-scroller"]')!.getBoundingClientRect();
  const row=[...document.querySelectorAll<HTMLElement>('[data-ui-key]')].find(row => row.getBoundingClientRect().bottom > view.top);
  return { key: row?.dataset.uiKey, offset: (row?.getBoundingClientRect().top ?? 0)-view.top };
 });
 const before = await capture();
 await page.locator('#prepend').evaluate(element => (element as HTMLButtonElement).click());
 await page.waitForTimeout(300);
 const prepend = await capture();
 await page.locator('#resize').evaluate(element => (element as HTMLButtonElement).click());
 await page.waitForTimeout(300);
 const resize = await capture();
 const composer = page.getByRole('textbox', { name:'Сообщение', exact:true });
 await composer.fill('Длинный черновик 世界');
 await composer.focus();
 await composer.evaluate(element => { if(element instanceof HTMLTextAreaElement) { element.setSelectionRange(4,10); element.dispatchEvent(new CompositionEvent('compositionstart', {bubbles:true,data:'世'})); } });
 const beforeIME = await capture();
 await page.setViewportSize({ width: 500, height: 650 });
 await page.waitForTimeout(300);
 const afterIME = await capture();
 const ime = await composer.evaluate(element => element instanceof HTMLTextAreaElement ? {text:element.value,selection:[element.selectionStart,element.selectionEnd],focused:document.activeElement===element} : null);
 await composer.evaluate(element => element.dispatchEvent(new CompositionEvent('compositionend', {bubbles:true,data:'世界'})));
 results.push({name,before,prepend,resize,beforeIME,afterIME,ime,errors,mounted:await page.getByTestId('feed-message').count()});
 await browser.close();
}
await writeFile('.cache/virtualization-spike/anchor-results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results));
