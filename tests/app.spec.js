import {test,expect} from '@playwright/test';
test('editing, import safety, replacement backup, persistence and offline',async({page,context})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('.card')).toHaveCount(39);
 await page.getByRole('button',{name:'Add an entry'}).click();
 await page.locator('[name=term]').fill('Test term');await page.locator('[name=category]').fill('Testing');await page.locator('[name=definition]').fill('<img src=x onerror=alert(1)>');await page.getByRole('button',{name:'Save entry'}).click();await expect(page.locator('.card')).toHaveCount(40);await expect(page.locator('.card img')).toHaveCount(0);
 await page.reload();await expect(page.locator('.card')).toHaveCount(40);
 await page.getByRole('button',{name:'Edit Test term',exact:true}).click();await page.locator('[name=example]').fill('A safe example.');await page.getByRole('button',{name:'Save entry'}).click();
 await page.getByRole('button',{name:'Manage & transfer'}).click();
 const bad={name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')};await page.locator('#file').setInputFiles(bad);await expect(page.locator('#transfer-error')).toContainText('Import rejected');await expect(page.locator('#apply')).toBeDisabled();
 const file=entries=>({name:'import.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schemaVersion:1,entries}))});
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('math-keywords-dictionary:v1')));
 await page.locator('#file').setInputFiles(file([{...data.entries[0],id:'different-id'}]));await expect(page.locator('#preview')).toContainText('conflicting');await expect(page.locator('#apply')).toBeDisabled();
 await page.locator('#file').setInputFiles(file([{...data.entries[0],example:'Updated example'}]));await expect(page.locator('#preview')).toContainText('1 updated');await page.locator('#apply').click();
 await page.locator('#mode').selectOption('replace');await page.locator('#file').setInputFiles(file([]));await expect(page.locator('#preview')).toContainText('40 removed');const download=page.waitForEvent('download');await page.locator('#apply').click();await download;expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('math-keywords-dictionary:v1:backup')).entries.length)).toBe(40);
 await page.locator('#transfer [data-close]').click();await expect(page.locator('.card')).toHaveCount(0);await page.reload();await expect(page.locator('.card')).toHaveCount(0);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();await expect(page.getByRole('heading',{name:/Make sense/})).toBeVisible();await expect(page.locator('.empty')).toBeVisible();expect(errors).toEqual([]);
});
test('mobile filters and delete; print stylesheet',async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('.card')).toHaveCount(39);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.getByRole('button',{name:'Word Problem Keywords',exact:true}).click();await expect(page.locator('.card')).toHaveCount(10);await page.locator('#search').fill('fewer');await expect(page.locator('.card')).toHaveCount(1);await page.getByRole('button',{name:'Delete fewer',exact:true}).click();await page.locator('#delete-confirm').click();await expect(page.locator('.card')).toHaveCount(0);await page.locator('#search').fill('');await page.screenshot({path:'test-results/mobile.png',fullPage:true});await page.emulateMedia({media:'print'});await expect(page.locator('header')).toBeHidden();});

test('invalid stored data is preserved and a failed write keeps existing entries',async({page})=>{
 await page.goto('/');await expect(page.locator('.card')).toHaveCount(39);
 await page.evaluate(()=>localStorage.setItem('math-keywords-dictionary:v1','broken original data'));
 await page.reload();await expect(page.locator('.empty')).toContainText('recovery');expect(await page.evaluate(()=>localStorage.getItem('math-keywords-dictionary:v1'))).toBe('broken original data');
 await page.evaluate(()=>localStorage.removeItem('math-keywords-dictionary:v1'));await page.reload();await expect(page.locator('.card')).toHaveCount(39);
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Quota exceeded','QuotaExceededError');};});
 await page.locator('#add').click();await page.locator('[name=term]').fill('Will not save');await page.locator('[name=category]').fill('Test');await page.locator('[name=definition]').fill('Definition');await page.getByRole('button',{name:'Save entry'}).click();await expect(page.locator('#form-error')).toContainText('Quota exceeded');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('math-keywords-dictionary:v1')).entries.length)).toBe(39);
});

test('formulas: editor, field search, export/import, print and offline',async({page,context})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await page.getByRole('button',{name:'Math Formulas',exact:true}).click();await expect(page.locator('.card')).toHaveCount(11);
 await page.locator('#category').selectOption('Geometry');await expect(page.locator('.card')).toHaveCount(7);
 await page.locator('#category').selectOption('');await page.locator('#search').fill('parameter');await expect(page.locator('.card')).toHaveCount(1);
 await page.locator('#search').fill('');await page.getByRole('button',{name:'Edit Rectangle area',exact:true}).click();
 await expect(page.getByText('What it calculates',{exact:true})).toBeVisible();await page.locator('[name=notes]').fill('Custom surface note');await page.getByRole('button',{name:'Save entry'}).click();
 await page.locator('#add').click();await page.locator('[name=type]').selectOption('formula');
 for(const [field,value] of Object.entries({term:'Test formula',category:'Algebra',definition:'A test calculation',notation:'y = x + 1',symbols:'x = input; y = output',whenToUse:'For this test',example:'x = 2: y = 3',notes:'Keep me'}))await page.locator(`[name=${field}]`).fill(value);
 await page.getByRole('button',{name:'Save entry'}).click();await page.reload();await page.getByRole('button',{name:'Math Formulas',exact:true}).click();await expect(page.locator('.card')).toHaveCount(12);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#data').click();const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;const {readFile}=await import('node:fs/promises');const exported=JSON.parse(await readFile(await download.path(),'utf8'));expect(exported.schemaVersion).toBe(2);expect(exported.entries.find(e=>e.term==='Test formula').notes).toBe('Keep me');
 const updated=exported.entries.find(e=>e.term==='Test formula');updated.notation='y = x + 2';await page.locator('#file').setInputFiles({name:'formula.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schemaVersion:2,entries:[updated]}))});await expect(page.locator('#preview')).toContainText('1 updated');await expect(page.locator('#preview')).toContainText('notation');await page.locator('#apply').click();await page.locator('#transfer [data-close]').click();
 await page.locator('#search').fill('Test formula');await page.emulateMedia({media:'print'});await expect(page.locator('.notation')).toHaveText('y = x + 2');await expect(page.locator('.card-actions')).toBeHidden();await page.emulateMedia({media:'screen'});
 await page.locator('#search').fill('');await page.screenshot({path:'test-results/formulas-mobile.png',fullPage:true});
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Math Formulas',exact:true}).click();await expect(page.locator('.card')).toHaveCount(12);
});

test('legacy saved library upgrades once and retains custom data',async({page})=>{
 await page.goto('/');await expect(page.locator('.card')).toHaveCount(39);
 await page.evaluate(()=>{const data=JSON.parse(localStorage.getItem('math-keywords-dictionary:v1'));data.schemaVersion=1;data.entries=data.entries.filter(e=>e.type!=='formula');data.entries[0].definition='My customized definition';localStorage.setItem('math-keywords-dictionary:v1',JSON.stringify(data));});
 await page.reload();await expect(page.locator('.card')).toHaveCount(39);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('math-keywords-dictionary:v1')).entries[0].definition)).toBe('My customized definition');
 await page.getByRole('button',{name:'Delete Circle area',exact:true}).click();await page.locator('#delete-confirm').click();await page.reload();await expect(page.locator('.card')).toHaveCount(38);
});

test('an already open cached v1 app upgrades without closing or losing entries',async({page})=>{
 const oldWorker=`const CACHE='math-keywords-dictionary-v1';self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(async c=>{const r=await fetch('./index.html');const html=(await r.text()).replace('<button data-type="formula" aria-pressed="false">Math Formulas</button>','');await c.put('./',new Response(html,{headers:{'Content-Type':'text/html'}}));await c.put('./index.html',new Response(html,{headers:{'Content-Type':'text/html'}}));})));self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));`;
 const {readFile,writeFile,utimes}=await import('node:fs/promises');const workerPath=new URL('../sw.js',import.meta.url);const currentWorker=await readFile(workerPath,'utf8');await writeFile(workerPath,oldWorker);try{
 await page.goto('/');await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await expect(page.locator('[data-type=formula]')).toHaveCount(0);
 await page.evaluate(()=>localStorage.setItem('upgrade-check','preserved'));
 await writeFile(workerPath,currentWorker);await utimes(workerPath,new Date(),new Date(Date.now()+2000));await page.evaluate(async()=>{const changed=new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));const r=await navigator.serviceWorker.getRegistration();await r.update();await changed;});
 await page.waitForFunction(async()=>{const r=await navigator.serviceWorker.getRegistration();return r.active?.state==='activated'&&!(await caches.keys()).includes('math-keywords-dictionary-v1');});
 await page.reload();await expect(page.getByRole('button',{name:'Math Formulas',exact:true})).toBeVisible();expect(await page.evaluate(()=>localStorage.getItem('upgrade-check'))).toBe('preserved');await expect(page.locator('.card')).toHaveCount(39);
 }finally{await writeFile(workerPath,currentWorker);}
});
