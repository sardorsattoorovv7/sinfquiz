import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,SignJWT} from 'jose';
import {verifyGoogleToken} from '../server/security.js';
test('Google ID token signature, audience, issuer, expiry, nonce and email validation',async()=>{
 const {privateKey,publicKey}=await generateKeyPair('RS256');const other=await generateKeyPair('RS256');
 const config={clientId:'expected-client'},flow={nonce:'expected-nonce'};
 const sign=(changes={},key=privateKey)=>new SignJWT({sub:'fixture-user',email:'fixture@example.test',email_verified:true,name:'Fixture',nonce:flow.nonce,iss:'https://accounts.google.com',aud:config.clientId,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+120,...changes}).setProtectedHeader({alg:'RS256'}).sign(key);
 assert.equal((await verifyGoogleToken(await sign(),flow,config,publicKey)).id,'fixture-user');
 for(const changes of [{aud:'other-client'},{iss:'https://evil.example'},{nonce:'wrong'},{exp:1},{email_verified:false},{azp:'other-client'}])await assert.rejects(()=>sign(changes).then(t=>verifyGoogleToken(t,flow,config,publicKey)));
 await assert.rejects(()=>sign({},other.privateKey).then(t=>verifyGoogleToken(t,flow,config,publicKey)));
});
