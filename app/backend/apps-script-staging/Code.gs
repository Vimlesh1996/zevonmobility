/**
 * ZEVON DRIVER AUTH — GOOGLE APPS SCRIPT STAGING
 * Bind ONLY to the separate staging spreadsheet. Never run against production.
 * Uses Google-maintained Apps Script OAuth2 library.
 */
const DRIVER_AUTH = {
  TABS: {
    Drivers: ['Driver_ID','Display_Name','Email','Active','Created_At','Updated_At'],
    Admins: ['Admin_ID','Display_Name','Email','Active','Created_At','Updated_At'],
    Driver_Sessions: ['Token_Hash','Driver_ID','Google_Sub','Created_At','Expires_At','Revoked_At','Account_Type','Admin_ID'],
    Driver_Audit: ['Audit_ID','Driver_ID','Event_Type','Event_At','Detail'],
    Trip_Assignments: ['Assignment_ID','Booking_ID','Driver_ID','Trip_Date','Pickup_Time','Pickup_Location','Drop_Location','Passenger_Count','Vehicle_Display','Trip_Status','Assigned_At','Accepted_At','Started_At','Completed_At','Rejected_At','Rejection_Reason','Notes'],
    Trip_Events: ['Event_ID','Assignment_ID','Driver_ID','Event_Type','Event_At','Reason','Actor']
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
    const result = createAccountSession_(identity);
    return renderCallback_({
      ok:true,
      message:'Google sign-in successful. This staging account is approved.',
      driverName:result.account.displayName,
      driverId:result.account.id,
      accountType:result.account.type,
      driverEmail:identity.email,
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

function createAccountSession_(identity) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const cache = CacheService.getScriptCache();
    const attemptKey = 'zevon_login_attempts_' + sha256Hex_(identity.email);
    const attempts = Number(cache.get(attemptKey) || 0);
    if (attempts >= DRIVER_AUTH.MAX_ATTEMPTS_PER_WINDOW) throw new Error('Too many login attempts. Please wait and try again.');
    cache.put(attemptKey, String(attempts + 1), DRIVER_AUTH.WINDOW_SECONDS);

    const admin = sheetRows_('Admins').find(row => String(row.Email || '').trim().toLowerCase() === identity.email && isActive_(row.Active));
    const driver = admin ? null : sheetRows_('Drivers').find(row => String(row.Email || '').trim().toLowerCase() === identity.email && isActive_(row.Active));
    if (!admin && !driver) throw new Error('This Google account is not approved for ZEVON Driver or Admin access.');

    const type = admin ? 'ADMIN' : 'DRIVER';
    const account = admin
      ? {type:type,id:String(admin.Admin_ID),displayName:String(admin.Display_Name || identity.name || '')}
      : {type:type,id:String(driver.Driver_ID),displayName:String(driver.Display_Name || identity.name || '')};
    const rawToken = randomHex_(32), now = new Date();
    const expires = new Date(now.getTime() + DRIVER_AUTH.SESSION_SECONDS * 1000);
    stagingSpreadsheet_().getSheetByName('Driver_Sessions')
      .appendRow([sha256Hex_(rawToken), driver ? String(driver.Driver_ID) : '', identity.sub, now, expires, '', type, admin ? String(admin.Admin_ID) : '']);
    appendAudit_(account.id, type + '_SESSION_CREATED', 'Google OAuth2 staging sign-in');
    return {sessionToken:rawToken,expiresAt:expires.toISOString(),account:account};
  } finally { lock.releaseLock(); }
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


function getSessionAccount_(sessionToken) {
  if (typeof sessionToken !== 'string' || sessionToken.length !== 64) throw new Error('Please sign in again.');
  const hash = sha256Hex_(sessionToken), now = new Date();
  const session = sheetRows_('Driver_Sessions').find(row => row.Token_Hash === hash && !row.Revoked_At && new Date(row.Expires_At).getTime() > now.getTime());
  if (!session) throw new Error('Your session has expired. Please sign in again.');
  const type = String(session.Account_Type || 'DRIVER').toUpperCase();
  if (type === 'ADMIN') {
    const admin = sheetRows_('Admins').find(row => String(row.Admin_ID) === String(session.Admin_ID) && isActive_(row.Active));
    if (!admin) throw new Error('Admin access is inactive.');
    return {type:'ADMIN',id:String(admin.Admin_ID),displayName:String(admin.Display_Name || ''),email:String(admin.Email || '')};
  }
  const driver = sheetRows_('Drivers').find(row => String(row.Driver_ID) === String(session.Driver_ID) && isActive_(row.Active));
  if (!driver) throw new Error('Driver access is inactive.');
  return {type:'DRIVER',id:String(driver.Driver_ID),displayName:String(driver.Display_Name || ''),email:String(driver.Email || '')};
}

function getAdminPortalData(sessionToken) {
  const admin = getSessionAccount_(sessionToken);
  if (admin.type !== 'ADMIN') throw new Error('Admin permission required.');
  const drivers = sheetRows_('Drivers').filter(r=>isActive_(r.Active)).map(r=>({driverId:String(r.Driver_ID),name:String(r.Display_Name || ''),email:String(r.Email || '')}));
  const trips = sheetRows_('Trip_Assignments').map(r=>({assignmentId:String(r.Assignment_ID||''),bookingId:String(r.Booking_ID||''),driverId:String(r.Driver_ID||''),tripDate:formatPortalDate_(r.Trip_Date),pickupTime:formatPortalTime_(r.Pickup_Time),pickupLocation:String(r.Pickup_Location||''),dropLocation:String(r.Drop_Location||''),status:String(r.Trip_Status||'ASSIGNED').toUpperCase()}));
  return {ok:true,admin:admin,drivers:drivers,trips:trips};
}

function createDriverAssignment(sessionToken, payload) {
  const admin = getSessionAccount_(sessionToken);
  if (admin.type !== 'ADMIN') throw new Error('Admin permission required.');
  payload = payload || {};
  const driverId=String(payload.driverId||'').trim(), bookingId=String(payload.bookingId||'').trim();
  const date=String(payload.tripDate||'').trim(), time=String(payload.pickupTime||'').trim();
  const pickup=String(payload.pickupLocation||'').trim(), drop=String(payload.dropLocation||'').trim();
  const passengers=Math.max(1,Math.min(99,Number(payload.passengerCount)||1));
  if(!driverId||!bookingId||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||!pickup||!drop) throw new Error('Please complete all required trip fields.');
  const driver=sheetRows_('Drivers').find(r=>String(r.Driver_ID)===driverId&&isActive_(r.Active));
  if(!driver) throw new Error('Select an active driver.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const sh=stagingSpreadsheet_().getSheetByName('Trip_Assignments');
    const id='STG-'+Utilities.getUuid().slice(0,8).toUpperCase(), now=new Date();
    const dateParts=date.split('-').map(Number), tripDate=new Date(dateParts[0],dateParts[1]-1,dateParts[2]);
    const row={Assignment_ID:id,Booking_ID:bookingId,Driver_ID:driverId,Trip_Date:tripDate,Pickup_Time:time,Pickup_Location:pickup,Drop_Location:drop,Passenger_Count:passengers,Vehicle_Display:String(payload.vehicleDisplay||'Staging vehicle'),Trip_Status:'ASSIGNED',Assigned_At:now,Accepted_At:'',Started_At:'',Completed_At:'',Rejected_At:'',Rejection_Reason:'',Notes:String(payload.notes||'').slice(0,300)};
    const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
    sh.appendRow(headers.map(h=>row[h]===undefined?'':row[h]));
    stagingSpreadsheet_().getSheetByName('Trip_Events').appendRow([Utilities.getUuid(),id,driverId,'TRIP_ASSIGNED',now,'','ADMIN']);
    appendAudit_(admin.id,'TRIP_ASSIGNED','Assignment '+id+' created for '+driverId);
    return {ok:true,assignmentId:id};
  }finally{lock.releaseLock();}
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


/** Driver portal: returns only assignments owned by the authenticated driver. */
function getDriverPortalData(sessionToken) {
  const profile = getMyDriverProfile(sessionToken);
  const all = sheetRows_('Trip_Assignments');
  const trips = all.filter(r => String(r.Driver_ID) === profile.driver.driverId)
    .map(r => ({
      assignmentId:String(r.Assignment_ID || ''),
      bookingId:String(r.Booking_ID || ''),
      tripDate:formatPortalDate_(r.Trip_Date),
      pickupTime:formatPortalTime_(r.Pickup_Time),
      pickupLocation:String(r.Pickup_Location || ''),
      dropLocation:String(r.Drop_Location || ''),
      passengerCount:String(r.Passenger_Count || ''),
      vehicleDisplay:String(r.Vehicle_Display || ''),
      status:String(r.Trip_Status || 'ASSIGNED').toUpperCase(),
      notes:String(r.Notes || '')
    })).sort((a,b) => (a.tripDate + a.pickupTime).localeCompare(b.tripDate + b.pickupTime));
  const counts = {assigned:0,accepted:0,started:0,completed:0,rejected:0};
  trips.forEach(t => { const k=t.status.toLowerCase(); if (counts[k] !== undefined) counts[k]++; });
  return {ok:true,driver:profile.driver,counts:counts,trips:trips};
}

/** Driver may change only their own assignment and only through allowed transitions. */
function updateDriverTripStatus(sessionToken, assignmentId, action, reason) {
  const profile = getMyDriverProfile(sessionToken);
  assignmentId = String(assignmentId || '').trim();
  action = String(action || '').toUpperCase();
  if (!assignmentId || assignmentId.length > 100) throw new Error('Invalid trip assignment.');
  const transitions = {
    ACCEPT: {from:'ASSIGNED',to:'ACCEPTED',event:'TRIP_ACCEPTED'},
    REJECT: {from:'ASSIGNED',to:'REJECTED',event:'TRIP_REJECTED'},
    START: {from:'ACCEPTED',to:'STARTED',event:'TRIP_STARTED'},
    COMPLETE: {from:'STARTED',to:'COMPLETED',event:'TRIP_COMPLETED'}
  };
  const rule = transitions[action];
  if (!rule) throw new Error('Unsupported trip action.');
  reason = String(reason || '').trim().slice(0,300);
  if (action === 'REJECT' && !reason) throw new Error('Please enter a reason for rejecting this trip.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = stagingSpreadsheet_().getSheetByName('Trip_Assignments');
    if (!sh || sh.getLastRow() < 2) throw new Error('Trip assignment not found.');
    const data = sh.getDataRange().getValues();
    const headers = data[0].map(String);
    const idx = {}; headers.forEach((h,i)=>idx[h]=i);
    const rowIndex = data.findIndex((row,i)=>i>0 && String(row[idx.Assignment_ID])===assignmentId && String(row[idx.Driver_ID])===profile.driver.driverId);
    if (rowIndex < 1) throw new Error('Trip assignment not found for this driver.');
    const row = data[rowIndex];
    const current = String(row[idx.Trip_Status] || 'ASSIGNED').toUpperCase();
    if (current !== rule.from) throw new Error('This action is not allowed from the current trip status: ' + current);
    const now = new Date();
    sh.getRange(rowIndex+1,idx.Trip_Status+1).setValue(rule.to);
    const timestampColumn = {ACCEPT:'Accepted_At',START:'Started_At',COMPLETE:'Completed_At',REJECT:'Rejected_At'}[action];
    if (idx[timestampColumn] !== undefined) sh.getRange(rowIndex+1,idx[timestampColumn]+1).setValue(now);
    if (action === 'REJECT' && idx.Rejection_Reason !== undefined) sh.getRange(rowIndex+1,idx.Rejection_Reason+1).setValue(reason);
    const eventSheet = stagingSpreadsheet_().getSheetByName('Trip_Events');
    eventSheet.appendRow([Utilities.getUuid(),assignmentId,profile.driver.driverId,rule.event,now,reason,'DRIVER']);
    appendAudit_(profile.driver.driverId,rule.event,'Assignment '+assignmentId+' changed from '+current+' to '+rule.to);
    return {ok:true,status:rule.to};
  } finally {
    lock.releaseLock();
  }
}

function formatPortalTime_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
  if (typeof value === 'number' && isFinite(value)) {
    const minutes = Math.round(value * 24 * 60);
    return ('0' + Math.floor(minutes / 60) % 24).slice(-2) + ':' + ('0' + minutes % 60).slice(-2);
  }
  return String(value || '');
}

function formatPortalDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(value || '');
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
