'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

const appRoot=path.join(__dirname,'..');
const script=path.join(appRoot,'scripts','configure-android-release.py');

function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'zevon-release-config-'));
 fs.mkdirSync(path.join(root,'www'),{recursive:true});
 fs.mkdirSync(path.join(root,'android','app'),{recursive:true});
 fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({name:'zevon-test',version:'1.0.1'},null,2));
 fs.writeFileSync(path.join(root,'www','index.html'),'<b id="app-version-value">Version 1.0.1</b>');
 fs.writeFileSync(path.join(root,'android','app','build.gradle'),[
  'android {',
  '    defaultConfig {',
  '        versionCode 1',
  '        versionName "1.0"',
  '    }',
  '    buildTypes {',
  '        release {',
  '            minifyEnabled false',
  '        }',
  '    }',
  '}'
 ].join('\n'));
 return root;
}

test('release config applies v1.0.9 metadata and signing without duplicate Gradle values',()=>{
 const root=fixture();
 try{
  execFileSync('python3',[script],{
   cwd:appRoot,
   env:{...process.env,APP_ROOT:root,RELEASE_TAG:'v1.0.9',KEY_ALIAS:'ci-release',STORE_PASSWORD:'ci-only-password'},
   stdio:'pipe'
  });
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const html=fs.readFileSync(path.join(root,'www','index.html'),'utf8');
  const gradle=fs.readFileSync(path.join(root,'android','app','build.gradle'),'utf8');
  assert.equal(pkg.version,'1.0.9');
  assert.match(html,/Version 1\.0\.9/);
  assert.match(gradle,/versionCode 1000009/);
  assert.match(gradle,/versionName "1\.0\.9"/);
  assert.equal((gradle.match(/versionCode/g)||[]).length,1);
  assert.equal((gradle.match(/versionName/g)||[]).length,1);
  assert.match(gradle,/signingConfig signingConfigs\.release/);
  assert.match(gradle,/keyPassword System\.getenv\("KEY_PASSWORD"\)/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('release config rejects leading zeroes and version-code collisions',()=>{
 for(const tag of ['v01.0.9','v1.0.1000','v1.1000.0']){
  const root=fixture();
  try{
   assert.throws(()=>execFileSync('python3',[script],{
    cwd:appRoot,
    env:{...process.env,APP_ROOT:root,RELEASE_TAG:tag,KEY_ALIAS:'ci-release',STORE_PASSWORD:'ci-only-password'},
    stdio:'pipe'
   }));
  }finally{fs.rmSync(root,{recursive:true,force:true});}
 }
});
