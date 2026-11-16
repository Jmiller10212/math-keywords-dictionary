import {test,expect} from '@playwright/test';
test('editing, import safety, replacement backup, persistence and offline',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('.card')).toHaveCount(28);
 await page.getByRole('button',{name:'Add an entry'}).click();
 await page.locator('[name=term]').fill('Test term');await page.locator('[name=category]').fill('Testing');await page.locator('[name=definition]').fill('<img src=x onerror=alert(1)>');await page.getByRole('button',{name:'Save entry'}).click();await expect(page.locator('.card')).toHaveCount(29);await expect(page.locator('.card img')).toHaveCount(0);
 await page.reload();await expect(page.locator('.card')).toHaveCount(29);
 await page.getByRole('button',{name:'Edit Test term',exact:true}).click();await page.locator('[name=example]').fill('A safe example.');await page.getByRole('button',{name:'Save entry'}).click();
 await page.getByRole('button',{name:'Manage & transfer'}).click();
 const bad={name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')};await page.locator('#file').setInputFiles(bad);await expect(page.locator('#transfer-error')).toContainText('Import rejected');await expect(page.locator('#apply')).toBeDisabled();
 const file=entries=>({name:'import.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schemaVersion:1,entries}))});
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-keywords-dictionary:v1')));
 await page.locator('#file').setInputFiles(file([{...data.entries[0],id:'different-id'}]));await expect(page.locator('#preview')).toContainText('conflicting');await expect(page.locator('#apply')).toBeDisabled();
 await page.locator('#file').setInputFiles(file([{...data.entries[0],example:'Updated example'}]));await expect(page.locator('#preview')).toContainText('1 updated');await page.locator('#apply').click();
 await page.locator('#mode').selectOption('replace');await page.locator('#file').setInputFiles(file([]));await expect(page.locator('#preview')).toContainText('29 removed');const download=page.waitForEvent('download');await page.locator('#apply').click();await download;expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('math-keywords-dictionary:v1:backup')).entries.length)).toBe(29);
 await page.locator('#transfer [data-close]').click();await expect(page.locator('.card')).toHaveCount(0);await page.reload();await expect(page.locator('.card')).toHaveCount(0);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();await expect(page.getByRole('heading',{name:/Make sense/})).toBeVisible();await expect(page.locator('.empty')).toBeVisible();expect(errors).toEqual([]);
});
test('mobile filters and delete; print stylesheet',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('.card')).toHaveCount(28);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('button',{name:'Word Problem Keywords',exact:true}).click();await expect(page.locator('.card')).toHaveCount(10);await page.locator('#search').fill('fewer');await expect(page.locator('.card')).toHaveCount(1);await page.getByRole('button',{name:'Delete fewer',exact:true}).click();await page.locator('#delete-confirm').click();await expect(page.locator('.card')).toHaveCount(0);await page.locator('#search').fill('');await page.screenshot({path:'test-results/mobile.png',fullPage:true});await page.emulateMedia({media:'print'});await expect(page.locator('header')).toBeHidden();});

test('invalid stored data is preserved and a failed write keeps existing entries',async({page})=>{
 await page.goto('/');await expect(page.locator('.card')).toHaveCount(28);
 await page.evaluate(()=>localStorage.setItem('math-keywords-dictionary:v1','broken original data'));
 await page.reload();await expect(page.locator('.empty')).toContainText('recovery');expect(await page.evaluate(()=>localStorage.getItem('math-keywords-dictionary:v1'))).toBe('broken original data');
 await page.evaluate(()=>localStorage.removeItem('math-keywords-dictionary:v1'));await page.reload();await expect(page.locator('.card')).toHaveCount(28);
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Quota exceeded','QuotaExceededError');};});
 await page.locator('#add').click();await page.locator('[name=term]').fill('Will not save');await page.locator('[name=category]').fill('Test');await page.locator('[name=definition]').fill('Definition');await page.getByRole('button',{name:'Save entry'}).click();await expect(page.locator('#form-error')).toContainText('Quota exceeded');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('math-keywords-dictionary:v1')).entries.length)).toBe(28);
});
