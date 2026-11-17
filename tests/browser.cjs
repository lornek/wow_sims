// Install Playwright outside the checkout; see docs/release-batch.md.
const {chromium}=require('playwright');
const base=process.env.HEALBOT_BASE_URL || 'http://127.0.0.1:8001';const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of ['healbot/','healbot/druid/','healbot/paladin/','healbot/priest/','healbot/priest/?spec=holy']){
  await page.goto(base+'/'+route);await page.waitForFunction(()=>document.querySelector('[data-feedback]')?.textContent.length>0);
  assert.equal(await page.locator('.heal-party > button').count(),5);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow');
  await page.locator('select[data-encounter]').selectOption('patchwerk');
  const first=page.locator('.heal-spells > button').first();
  if(!mobile)await first.click(); // reset must clear this pending selection
  await page.locator('[data-start]').click();
  await page.waitForFunction(()=>document.querySelector('[data-threat]').dataset.urgent==='true');
  assert.equal(await page.locator('.threat-target').count(),1);
  assert.match(await page.locator('[data-threat]').innerText(),/Hateful Strike/);
  if(mobile){await page.locator('.heal-party > button').first().tap();await first.tap();}
  else{await first.click();await page.locator('.heal-party > button').first().click();}
  assert.ok(await page.locator('[data-feedback]').innerText());
  await page.waitForFunction(()=>['casting','landed','crit','absorbed'].includes(document.querySelector('[data-feedback]').dataset.kind));
  if(mobile){await first.tap();}else{await page.locator('.heal-party > button').first().click();}
  assert.match(await page.locator('[data-feedback]').innerText(),/casting|cooldown|→|heal/i);
  await page.locator('[data-start]').click();
  assert.equal(await page.locator('.threat-target').count(),0);
  await page.reload();await page.waitForFunction(()=>document.querySelector('[data-feedback]')?.textContent.length>0);assert.equal(await page.locator('select[data-encounter]').inputValue(),'patchwerk');
  console.log('PASS '+(mobile?'phone':'desktop')+' '+route+' cast, tell, reset, persistence, width');
 }
 for(const healer of ['shaman','druid','paladin','priest']) {
  await page.locator('[data-healbot-class='+healer+']').first().click();
  await page.waitForFunction(healer=>document.querySelector('#healing').dataset.healerClass===healer && !document.querySelector('.healbot-header').hasAttribute('aria-busy'),healer);
  assert.equal(await page.locator('.heal-party > button').count(),5);
 }
 console.log('PASS '+(mobile?'phone':'desktop')+' class switching without reload');
 await page.goto(base+'/healbot/druid/?encounter=rend');await page.locator('[data-start]').click();
 await page.waitForFunction(()=>document.querySelector('[data-phase]').textContent.includes('In combat'));
 await page.screenshot({path:'/tmp/'+(mobile?'phone':'desktop')+'-release.png',fullPage:true});
 assert.deepEqual(errors,[]);await context.close();
}await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
