import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {verifiedTelegramUser} from '../api/telegram-auth.js';

const token='123456789:test_bot_token';
function signedPayload(overrides={}){
 const fields={id:'99887766',first_name:'Aziza',username:'aziza_student',auth_date:String(Math.floor(Date.now()/1000)),...overrides};
 const checkString=Object.entries(fields).sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>`${key}=${value}`).join('\n');
 const secret=crypto.createHash('sha256').update(token).digest();
 return {...fields,hash:crypto.createHmac('sha256',secret).update(checkString).digest('hex')};
}

test('Telegram login payload accepts a current valid signature',()=>{
 process.env.TELEGRAM_BOT_TOKEN=token;
 assert.equal(verifiedTelegramUser(signedPayload()).id,'99887766');
});

test('Telegram login payload rejects tampering and expired signatures',()=>{
 process.env.TELEGRAM_BOT_TOKEN=token;
 const tampered=signedPayload();tampered.first_name='Boshqa';
 assert.throws(()=>verifiedTelegramUser(tampered),/haqiqiy emas/);
 assert.throws(()=>verifiedTelegramUser(signedPayload({auth_date:String(Math.floor(Date.now()/1000)-1000)})),/eskirgan/);
});
