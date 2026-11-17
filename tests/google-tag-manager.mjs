import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {installGoogleTagManager} from '../scripts/google-tag-manager.cjs';
test('Pages tag covers nested HTML once, skips redirects, and can be disabled',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'healbot-gtm-'));
 try {
  fs.mkdirSync(path.join(dir,'nested'));
  const file=path.join(dir,'nested/index.html');
  fs.writeFileSync(file,'<!doctype html><html><head></head><body class="game">Game</body></html>');
  const redirect=path.join(dir,'redirect.html');
  fs.writeFileSync(redirect,'<html><head><meta http-equiv="refresh" content="0;url=../"></head><body>Redirect</body></html>');
  installGoogleTagManager(dir,'GTM-TPQ8G2DJ');installGoogleTagManager(dir,'GTM-TPQ8G2DJ');
  const html=fs.readFileSync(file,'utf8');
  assert.equal((html.match(/<!-- Google Tag Manager -->/g)||[]).length,1);
  assert.match(html,/<body class="game">\n<!-- Google Tag Manager \(noscript\) -->/);
  assert.match(html,/GTM-TPQ8G2DJ/);assert.ok(!fs.readFileSync(redirect,'utf8').includes('googletagmanager'));
  installGoogleTagManager(dir);assert.ok(!fs.readFileSync(file,'utf8').includes('googletagmanager'));
  assert.throws(()=>installGoogleTagManager(dir,'bad-id'),/Invalid/);
 } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
