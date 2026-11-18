/**
 * ZEVON DRIVER AUTH — GOOGLE APPS SCRIPT STAGING
 * Bind ONLY to the separate staging spreadsheet. Never run against production.
 * Uses Google-maintained Apps Script OAuth2 library.
 */
const DRIVER_AUTH = {
  TABS: {
    Drivers: ['Driver_ID','Display_Name','Email','Active','Created_At','Updated_At'],
    Driver_Sessions: ['Token_Hash','Driver_ID','Google_Sub','Created_At','Expires_At','Revoked_At'],
    Driver_Audit: ['Audit_ID','Driver_ID','Event_Type','Event_At','Detail']
  },
  SESSION_SECONDS: 4 * 60 * 60,
  FLOW_SECONDS: 10 * 60,
  MAX_ATTEMPTS_PER_WINDOW: 8,
  WINDOW_SECONDS: 10 * 60
};

function doGet() {
  const template = HtmlService.createTemplateFromFile('Index');
  try {
    template.authUrl = createGoogleAuthorizationUrl_();
    template.configError = '';
  } catch (error) {
    template.authUrl = '';
    template.configError = safeMessage_(error);
  }
  return template.evaluate().setTitle('ZEVON Driver Sign-In — Staging');
}

function setupDriverAuthStaging() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Bind this script to a NEW staging spreadsheet first.');
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
  return 'Staging auth tabs are ready. Add only a test driver to Drivers.';
}

function checkDriverAuthConfig() {
  const p = PropertiesService.getScriptProperties();
  const result = {
    clientIdPresent: !!p.getProperty('ZEVON_OAUTH_CLIENT_ID'),
    clientSecretPresent: !!p.getProperty('ZEVON_OAUTH_CLIENT_SECRET'),
    stagingSheetConfigured: !!p.getProperty('DRIVER_AUTH_STAGING_SHEET_ID'),
    oauthLibraryAvailable: typeof OAuth2 !== 'undefined'
  };
  Logger.log(JSON.stringify(result));
  return result;
}

function logDriverAuthRedirectUri() {
  const uri = createOAuthService_().getRedirectUri();
  Logger.log(uri);
  return uri;
}

function createGoogleAuthorizationUrl_() {
  return createOAuthService_().getAuthorizationUrl();
}

function createOAuthService_() {
  const props = PropertiesService.getScriptProperties();
  const clientId = props.getProperty('ZEVON_OAUTH_CLIENT_ID');
  const clientSecret = props.getProperty('ZEVON_OAUTH_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('OAuth configuration is incomplete. Check Script Properties.');
  if (typeof OAuth2 === 'undefined') throw new Error('OAuth2 library is not available. Add the Google OAuth2 library first.');

  return OAuth2.createService('ZEVON_DRIVER')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/v2/auth')
    .setTokenUrl('https://oauth2.googleapis.com/token')
    .setClientId(clientId)
    .setClientSecret(clientSecret)
    .setCallbackFunction('authCallback')
    .setPropertyStore(props)
    .setCache(CacheService.getScriptCache())
    .setLock(LockService.getScriptLock())
    .setScope('openid email profile')
    .setParam('prompt', 'select_account')
    .setParam('access_type', 'online');
}

function authCallback(request) {
  const service = createOAuthService_();
  let identity;
  try {
    if (!service.handleCallback(request)) {
      service.reset();
      return renderCallback_({ok:false, message:'Google authorization was not completed. Please try again.'});
    }
    const accessToken = service.getAccessToken();
    if (!accessToken) throw new Error('Google did not return an access token.');
    const response = UrlFetchApp.fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      method:'get',
      headers:{Authorization:'Bearer ' + accessToken},
      muteHttpExceptions:true
    });
    if (response.getResponseCode() !== 200) throw new Error('Could not retrieve the verified Google account profile.');
    const profile = JSON.parse(response.getContentText());
    if (!profile.sub || !profile.email || String(profile.email_verified) !== 'true') {
      throw new Error('Google account email is not verified.');
    }
    identity = {
      sub:String(profile.sub),
      email:String(profile.email).trim().toLowerCase(),
      name:String(profile.name || '').slice(0,120)
    };
  } catch (error) {
    try { service.reset(); } catch (ignored) {}
    appendAuditSafe_('', 'OAUTH_FAILED', safeMessage_(error));
    return renderCallback_({ok:false, message:'Google sign-in could not be completed. ' + safeMessage_(error)});
  } finally {
    try { service.reset(); } catch (ignored) {}
  }

  try {
    const result = createDriverSession_(identity);
    return renderCallback_({
      ok:true,
      message:'Google sign-in successful. This staging account is approved.',
      driverName:result.driver.displayName,
      driverId:result.driver.driverId,
      sessionToken:result.sessionToken,
      expiresAt:result.expiresAt
    });
  } catch (error) {
    appendAuditSafe_('', 'LOGIN_DENIED', 'No active driver allowlist match or session creation failed.');
    return renderCallback_({ok:false, message:safeMessage_(error)});
  }
}

function renderCallback_(data) {
  const template = HtmlService.createTemplateFromFile('Callback');
  template.ok = !!data.ok;
  template.message = String(data.message || '');
  template.driverName = String(data.driverName || '');
  template.driverId = String(data.driverId || '');
  template.sessionToken = String(data.sessionToken || '');
  template.expiresAt = String(data.expiresAt || '');
  return template.evaluate().setTitle('ZEVON Driver Sign-In — Staging');
}

function createDriverSession_(identity) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const cache = CacheService.getScriptCache();
    const attemptKey = 'zevon_login_attempts_' + sha256Hex_(identity.email);
    const attempts = Number(cache.get(attemptKey) || 0);
    if (attempts >= DRIVER_AUTH.MAX_ATTEMPTS_PER_WINDOW) {
      throw new Error('Too many login attempts. Please wait and try again.');
    }
    cache.put(attemptKey, String(attempts + 1), DRIVER_AUTH.WINDOW_SECONDS);

    const driver = sheetRows_('Drivers').find(row =>
      String(row.Email || '').trim().toLowerCase() === identity.email && isActive_(row.Active)
    );
    if (!driver) throw new Error('This Google account is not approved for ZEVON Driver access. Contact Admin.');

    const rawToken = randomHex_(32);
    const now = new Date();
    const expires = new Date(now.getTime() + DRIVER_AUTH.SESSION_SECONDS * 1000);
    stagingSpreadsheet_().getSheetByName('Driver_Sessions')
      .appendRow([sha256Hex_(rawToken), String(driver.Driver_ID), identity.sub, now, expires, '']);
    appendAudit_(String(driver.Driver_ID), 'SESSION_CREATED', 'Google OAuth2 Sign-In staging session');
    return {
      sessionToken:rawToken,
      expiresAt:expires.toISOString(),
      driver:{driverId:String(driver.Driver_ID),displayName:String(driver.Display_Name || identity.name || '')}
    };
  } finally {
    lock.releaseLock();
  }
}

function stagingSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('DRIVER_AUTH_STAGING_SHEET_ID');
  if (!id) throw new Error('Staging spreadsheet is not configured. Run setupDriverAuthStaging from the new staging sheet.');
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

function isActive_(value) {
  return value === true || String(value).toLowerCase() === 'true' || String(value) === '1';
}

function appendAudit_(driverId, eventType, detail) {
  stagingSpreadsheet_().getSheetByName('Driver_Audit')
    .appendRow([Utilities.getUuid(), driverId || '', eventType, new Date(), String(detail || '').slice(0,240)]);
}

function appendAuditSafe_(driverId, eventType, detail) {
  try { appendAudit_(driverId, eventType, detail); } catch (ignored) {}
}

function getMyDriverProfile(sessionToken) {
  if (typeof sessionToken !== 'string' || sessionToken.length !== 64) throw new Error('Please sign in again.');
  const hash = sha256Hex_(sessionToken);
  const now = new Date();
  const session = sheetRows_('Driver_Sessions').find(row =>
    row.Token_Hash === hash && !row.Revoked_At && new Date(row.Expires_At).getTime() > now.getTime()
  );
  if (!session) throw new Error('Your session has expired. Please sign in again.');
  const driver = sheetRows_('Drivers').find(row =>
    String(row.Driver_ID) === String(session.Driver_ID) && isActive_(row.Active)
  );
  if (!driver) throw new Error('Driver access is inactive. Contact Admin.');
  return {ok:true,driver:{driverId:String(driver.Driver_ID),displayName:String(driver.Display_Name || ''),email:String(driver.Email || '')}};
}

function logoutDriver(sessionToken) {
  if (typeof sessionToken !== 'string' || sessionToken.length !== 64) return {ok:true};
  const hash = sha256Hex_(sessionToken);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = stagingSpreadsheet_().getSheetByName('Driver_Sessions');
    const rows = sh.getDataRange().getValues();
    const headers = rows.shift().map(String);
    const tokenCol = headers.indexOf('Token_Hash');
    const revokedCol = headers.indexOf('Revoked_At');
    const driverCol = headers.indexOf('Driver_ID');
    for (let i=0;i<rows.length;i++) {
      if (rows[i][tokenCol] === hash && !rows[i][revokedCol]) {
        sh.getRange(i+2, revokedCol+1).setValue(new Date());
        appendAudit_(String(rows[i][driverCol]), 'SESSION_REVOKED', 'Driver logout');
        break;
      }
    }
    return {ok:true};
  } finally {
    lock.releaseLock();
  }
}

function randomHex_(bytes) {
  const hex = (Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'')).toLowerCase();
  return hex.slice(0, bytes * 2);
}

function sha256Hex_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value)
    .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}

function safeMessage_(error) {
  const message = error && error.message ? String(error.message) : 'Please try again.';
  return message.replace(/[<>]/g,'').slice(0,220);
}
