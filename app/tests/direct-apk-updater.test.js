'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'www', 'app.js'), 'utf8');
const plugin = fs.readFileSync(path.join(__dirname, '..', 'plugins', 'apk-updater', 'android', 'src', 'main', 'java', 'com', 'zevon', 'mobility', 'updater', 'ApkUpdaterPlugin.java'), 'utf8');
const releaseWorkflow = fs.readFileSync(path.join(__dirname, '..', '..', '.github', 'workflows', 'zevon-signed-apk-release.yml'), 'utf8');

test('Android app checks public GitHub latest release and compares installed version', () => {
  assert.match(appJs, /releases\/latest/);
  assert.match(appJs, /plugin\.getAppVersion\(\)/);
  assert.match(appJs, /isNewer\(record\.version,installed\.version\)/);
});

test('update is offered in-app and final installation is delegated to Android', () => {
  assert.match(appJs, /updateBanner/);
  assert.match(appJs, /plugin\.requestInstallPermission\(\)/);
  assert.match(appJs, /plugin\.downloadAndInstall\(/);
  assert.match(plugin, /Intent\.ACTION_VIEW/);
  assert.doesNotMatch(plugin, /PackageInstaller\.Session/);
});

test('APK download requires GitHub HTTPS URL and SHA-256 verification', () => {
  assert.match(plugin, /url\.startsWith\("https:\/\/"\)/);
  assert.match(plugin, /github\.com\//);
  assert.match(plugin, /expectedSha256/);
  assert.match(plugin, /MessageDigest\.getInstance\("SHA-256"\)/);
  assert.match(plugin, /checksum verification failed/i);
});

test('signed release workflow requires private keystore secrets and creates versioned release assets', () => {
  for (const secret of ['ANDROID_KEYSTORE_BASE64', 'ANDROID_KEY_ALIAS', 'ANDROID_KEYSTORE_PASSWORD', 'ANDROID_KEY_PASSWORD']) {
    assert.ok(releaseWorkflow.includes(secret), 'missing signing secret: ' + secret);
  }
  assert.match(releaseWorkflow, /gh release create/);
  assert.match(releaseWorkflow, /ZEVON-Mobility-/);
  assert.match(releaseWorkflow, /apksigner[\s\S]*verify/);
});
