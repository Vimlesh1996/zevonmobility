/**
 * ZEVON DRIVER AUTH — ISOLATED STAGING APPS SCRIPT
 * Bind ONLY to a NEW, EMPTY staging spreadsheet. Never run against production.
 * This prototype delegates Google ID-token validation to Google's tokeninfo endpoint.
 * Google documents tokeninfo as a testing/debugging endpoint; do not use this as the
 * final production identity-verification architecture without a stronger verifier.
 */
const DRIVER_AUTH = {
  CLIENT_ID: '700434717568-3uhka3n6hhmc60er1vmi7ml1mlfq9cek.apps.googleusercontent.com',
  TABS: {
    Drivers: ['Driver_ID','Display_Name','Email','Active','Created_At','Updated_At'],
    Driver_Sessions: ['Token_Hash','Driver_ID','Google_Sub','Created_At','Expires_At','Revoked_At'],
    Driver_Audit: ['Audit_ID','Driver_ID','Event_Type','Event_At','Detail']
  },
  SESSION_SECONDS: 4 * 60 * 60,
  MAX_ATTEMPTS_PER_WINDOW: 8,
  WINDOW_SECONDS: 10 * 60
};

function doGet() {
  const t = HtmlService.createTemplateFromFile('Index');
  t.clientId = DRIVER_AUTH.CLIENT_ID;
  return t.evaluate().setTitle('ZEVON Driver Sign-In — Staging')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

/** Run only from a NEW staging spreadsheet. Adds missing auth tabs without clearing data. */
function setupDriverAuthStaging() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Bind this script to a NEW staging Google Sheet first.');
  PropertiesService.getScriptProperties().setProperty('DRIVER_AUTH_STAGING_SHEET_ID', ss.getId());
  Object.keys(DRIVER_AUTH.TABS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const required = DRIVER_AUTH.TABS[name];
    const lastCol = Math.max(1, sh.getLastColumn());
    const existing = sh.getRange(1,1,1,lastCol).getDisplayValues()[0];
    if (!existing.some(v => String(v).trim())) {
      sh.getRange(1,1,1,required.length).setValues([required]);
    } else {
      const missing = required.filter(h => !existing.includes(h));
      if (missing.length) sh.getRange(1,sh.getLastColumn()+1,1,missing.length).setValues([missing]);
    }
    sh.setFrozenRows(1);
    sh.getRange(1,1,1,sh.getLastColumn()).setFontWeight('bold').setBackground('#172536').setFontColor('#ffffff');
  });
  return 'Staging auth tabs are ready. Add a test driver to Drivers; do not add real driver records yet.';
}

function stagingSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('DRIVER_AUTH_STAGING_SHEET_ID');
  if (!id) throw new Error('Run setupDriverAuthStaging from the new staging spreadsheet first.');
  return SpreadsheetApp.openById(id);
}

function sheetRows_(name) {
  const sh = stagingSpreadsheet_().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getValues();
  const headers = values.shift().map(String);
  return values.filter(row => row.some(v => v !== '' && v !== null)).map(row => {
    const obj = {}; headers.forEach((key,i) => obj[key] = row[i]); return obj;
  });
}

function appendAudit_(driverId, eventType, detail) {
  const sh = stagingSpreadsheet_().getSheetByName('Driver_Audit');
  sh.appendRow([Utilities.getUuid(), driverId || '', eventType, new Date(), String(detail || '').slice(0,240)]);
}

function verifyGoogleIdToken_(credential) {
  if (typeof credential !== 'string' || credential.length < 100 || credential.length > 12000) {
    throw new Error('Invalid Google credential.');
  }
  // Server-to-server check with Google. This is suitable only for a controlled staging test.
  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential), {
    method: 'get', muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) throw new Error('Google could not verify this sign-in.');
  const claims = JSON.parse(response.getContentText());
  const now = Math.floor(Date.now() / 1000);
  const issuerOk = claims.iss === 'https://accounts.google.com' || claims.iss === 'accounts.google.com';
  const audienceOk = claims.aud === DRIVER_AUTH.CLIENT_ID;
  const expiryOk = Number(claims.exp) > now;
  const emailOk = String(claims.email_verified) === 'true';
  if (!issuerOk || !audienceOk || !expiryOk || !emailOk || !claims.sub || !claims.email) {
    throw new Error('Google identity checks failed.');
  }
  return { sub: String(claims.sub), email: String(claims.email).trim().toLowerCase() };
}

function loginWithGoogle(credential) {
  const identity = verifyGoogleIdToken_(credential);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const cache = CacheService.getScriptCache();
    const key = 'login:' + identity.email;
    const attempts = Number(cache.get(key) || 0);
    if (attempts >= DRIVER_AUTH.MAX_ATTEMPTS_PER_WINDOW) throw new Error('Too many attempts. Please wait and try again.');
    cache.put(key, String(attempts + 1), DRIVER_AUTH.WINDOW_SECONDS);

    const driver = sheetRows_('Drivers').find(row =>
      String(row.Email || '').trim().toLowerCase() === identity.email &&
      (row.Active === true || String(row.Active).toLowerCase() === 'true' || String(row.Active) === '1')
    );
    if (!driver) {
      appendAudit_('', 'LOGIN_DENIED', 'No active driver allowlist match: ' + identity.email);
      throw new Error('This Google account is not approved for ZEVON Driver access. Contact Admin.');
    }

    const rawToken = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
    const tokenHash = sha256Hex_(rawToken);
    const now = new Date();
    const expires = new Date(now.getTime() + DRIVER_AUTH.SESSION_SECONDS * 1000);
    stagingSpreadsheet_().getSheetByName('Driver_Sessions')
      .appendRow([tokenHash, String(driver.Driver_ID), identity.sub, now, expires, '']);
    appendAudit_(String(driver.Driver_ID), 'SESSION_CREATED', 'Google Sign-In staging session');
    return {
      ok: true,
      sessionToken: rawToken,
      expiresAt: expires.toISOString(),
      driver: { driverId: String(driver.Driver_ID), displayName: String(driver.Display_Name || '') }
    };
  } finally {
    lock.releaseLock();
  }
}

function sha256Hex_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value)
    .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}

function getMyDriverProfile(sessionToken) {
  if (typeof sessionToken !== 'string' || sessionToken.length < 40 || sessionToken.length > 100) {
    throw new Error('Please sign in again.');
  }
  const hash = sha256Hex_(sessionToken);
  const now = new Date();
  const session = sheetRows_('Driver_Sessions').find(row =>
    row.Token_Hash === hash && !row.Revoked_At && new Date(row.Expires_At).getTime() > now.getTime()
  );
  if (!session) throw new Error('Your session has expired. Please sign in again.');
  const driver = sheetRows_('Drivers').find(row =>
    String(row.Driver_ID) === String(session.Driver_ID) &&
    (row.Active === true || String(row.Active).toLowerCase() === 'true' || String(row.Active) === '1')
  );
  if (!driver) throw new Error('Driver access is inactive. Contact Admin.');
  return { ok:true, driver:{ driverId:String(driver.Driver_ID), displayName:String(driver.Display_Name || ''), email:String(driver.Email || '') } };
}

function logoutDriver(sessionToken) {
  if (typeof sessionToken !== 'string' || sessionToken.length < 40 || sessionToken.length > 100) return {ok:true};
  const hash = sha256Hex_(sessionToken);
  const sh = stagingSpreadsheet_().getSheetByName('Driver_Sessions');
  const rows = sh.getDataRange().getValues();
  const headers = rows.shift().map(String);
  const tokenCol = headers.indexOf('Token_Hash'), revokedCol = headers.indexOf('Revoked_At'), driverCol = headers.indexOf('Driver_ID');
  for (let i=0;i<rows.length;i++) {
    if (rows[i][tokenCol] === hash && !rows[i][revokedCol]) {
      sh.getRange(i+2, revokedCol+1).setValue(new Date());
      appendAudit_(String(rows[i][driverCol]), 'SESSION_REVOKED', 'Driver logout');
      break;
    }
  }
  return {ok:true};
}
