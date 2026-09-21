import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=dirname(dirname(fileURLToPath(import.meta.url))),read=name=>readFileSync(join(root,name),'utf8');

test('Vercel build is static and Firebase-backed without Express or Socket.IO',()=>{
 const pkg=JSON.parse(read('package.json')),vercel=JSON.parse(read('vercel.json')),env=read('.env.example'),app=read('src/App.jsx'),data=read('src/firebase-data.js'),sdk=read('src/firebase-sdk.js'),rules=read('firestore.rules');
 assert.equal(pkg.version,'4.8.0');
 assert.equal(pkg.scripts.dev,'vite');
 assert.equal(pkg.dependencies.express,undefined);
 assert.equal(pkg.dependencies['socket.io'],undefined);
 assert.equal(pkg.dependencies['socket.io-client'],undefined);
 assert.equal(vercel.outputDirectory,'dist');
 assert.equal(vercel.rewrites[0].destination,'/index.html');
 for(const name of ['VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_PROJECT_ID','VITE_FIREBASE_APP_ID','VITE_FIREBASE_ADMIN_EMAIL'])assert.match(env,new RegExp(name));
 assert.doesNotMatch(app,/socket\.io-client/);
 assert.match(data,/onSnapshot/);
 assert.match(sdk,/signInAnonymously/);
 assert.match(rules,/function isAdmin/);
 assert.match(rules,/request\.auth\.token\.email == 'admin@sinfquiz\.uz'/);
 assert.equal(existsSync(join(root,'server.js')),false);
});
