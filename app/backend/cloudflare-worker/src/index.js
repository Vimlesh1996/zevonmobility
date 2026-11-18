const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);
const SESSION_DEFAULT_SECONDS = 4 * 60 * 60;
const LOGIN_WINDOW_SECONDS = 10 * 60;
const LOGIN_MAX_ATTEMPTS = 10;
let jwksMemo = { keys: [], expiresAt: 0 };

function json(data, status = 200, origin = "") {
  const headers = {"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","vary":"Origin"};
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "GET, POST, OPTIONS";
    headers["access-control-allow-headers"] = "Authorization, Content-Type";
    headers["access-control-max-age"] = "600";
  }
  return new Response(JSON.stringify(data), {status, headers});
}
function base64UrlToBytes(value) {
  const padded=value.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-value.length%4)%4);
  const binary=atob(padded); return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
function decodeJsonPart(value) { return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value))); }
function base64Url(bytes) {
  let binary=""; for(const byte of bytes) binary+=String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
}
async function sha256Hex(value) {
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
}
async function googleKeys(forceRefresh=false) {
  if(!forceRefresh&&jwksMemo.expiresAt>Date.now()&&jwksMemo.keys.length) return jwksMemo.keys;
  const response=await fetch(GOOGLE_JWKS_URL,{cf:{cacheTtl:3600,cacheEverything:true}});
  if(!response.ok) throw new Error("Google signing keys unavailable");
  const payload=await response.json(); if(!Array.isArray(payload.keys)) throw new Error("Invalid Google signing keys");
  jwksMemo={keys:payload.keys,expiresAt:Date.now()+50*60*1000}; return jwksMemo.keys;
}
async function verifyGoogleCredential(token,clientId) {
  if(typeof token!=="string"||token.length>12000) throw new Error("Invalid credential");
  const parts=token.split("."); if(parts.length!==3) throw new Error("Invalid credential format");
  const header=decodeJsonPart(parts[0]), claims=decodeJsonPart(parts[1]);
  if(header.alg!=="RS256"||typeof header.kid!=="string") throw new Error("Unsupported credential");
  let jwk=(await googleKeys()).find(k=>k.kid===header.kid&&k.alg==="RS256"&&k.use==="sig");
  if(!jwk) jwk=(await googleKeys(true)).find(k=>k.kid===header.kid&&k.alg==="RS256"&&k.use==="sig");
  if(!jwk) throw new Error("Unknown Google signing key");
  const publicKey=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  const valid=await crypto.subtle.verify({name:"RSASSA-PKCS1-v1_5"},publicKey,base64UrlToBytes(parts[2]),new TextEncoder().encode(parts[0]+"."+parts[1]));
  if(!valid) throw new Error("Invalid credential signature");
  const now=Math.floor(Date.now()/1000), audience=Array.isArray(claims.aud)?claims.aud:[claims.aud];
  if(!GOOGLE_ISSUERS.has(claims.iss)||!audience.includes(clientId)) throw new Error("Invalid issuer or audience");
  if(claims.azp&&claims.azp!==clientId) throw new Error("Invalid authorized party");
  if(!Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.iat)||claims.iat>now+60) throw new Error("Expired or invalid credential time");
  if(claims.email_verified!==true||typeof claims.sub!=="string"||!claims.sub||typeof claims.email!=="string"||!claims.email.includes("@")) throw new Error("Unverified identity");
  return {googleSub:claims.sub,email:claims.email.trim().toLowerCase()};
}
function bearer(request) {
  const match=(request.headers.get("authorization")||"").match(/^Bearer ([A-Za-z0-9_-]{40,100})$/);
  return match?match[1]:null;
}
async function readJson(request) {
  if(!(request.headers.get("content-type")||"").toLowerCase().includes("application/json")) throw new Error("Expected JSON");
  const text=await request.text(); if(text.length>16000) throw new Error("Request too large"); return JSON.parse(text);
}
async function recordAttempt(db,email) {
  const now=Math.floor(Date.now()/1000), since=now-LOGIN_WINDOW_SECONDS;
  const row=await db.prepare("SELECT COUNT(*) AS n FROM auth_attempts WHERE email = ? AND attempted_at >= ?").bind(email,since).first();
  if((row?.n||0)>=LOGIN_MAX_ATTEMPTS) return false;
  await db.prepare("INSERT INTO auth_attempts (email,attempted_at) VALUES (?,?)").bind(email,now).run();
  await db.prepare("DELETE FROM auth_attempts WHERE attempted_at < ?").bind(now-86400).run();
  return true;
}
async function createDriverSession(env,driver,googleSub) {
  const bytes=new Uint8Array(32); crypto.getRandomValues(bytes); const token=base64Url(bytes);
  const hash=await sha256Hex(token), now=Math.floor(Date.now()/1000);
  const ttl=Math.min(Math.max(Number(env.SESSION_TTL_SECONDS)||SESSION_DEFAULT_SECONDS,900),28800), expiresAt=now+ttl;
  await env.DB.prepare("INSERT INTO driver_sessions (token_hash,driver_id,google_sub,created_at,expires_at) VALUES (?,?,?,?,?)").bind(hash,driver.driver_id,googleSub,now,expiresAt).run();
  await env.DB.prepare("INSERT INTO driver_audit (driver_id,event_type,event_at,detail) VALUES (?,'SESSION_CREATED',?,'Google Sign-In')").bind(driver.driver_id,now).run();
  return {token,expiresAt};
}
async function currentDriver(env,request) {
  const token=bearer(request); if(!token) return null;
  const hash=await sha256Hex(token), now=Math.floor(Date.now()/1000);
  return await env.DB.prepare("SELECT d.driver_id,d.display_name,d.email FROM driver_sessions s JOIN drivers d ON d.driver_id=s.driver_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND d.active=1").bind(hash,now).first();
}
async function handle(request,env) {
  const allowed=env.ALLOWED_ORIGIN, origin=request.headers.get("origin")||"";
  if(!allowed||origin!==allowed) return json({ok:false,error:"ORIGIN_NOT_ALLOWED"},403);
  if(request.method==="OPTIONS") return json({ok:true},200,origin);
  const url=new URL(request.url);
  if(url.pathname==="/health"&&request.method==="GET") return json({ok:true,service:"zevon-driver-auth",mode:"staging"},200,origin);
  if(url.pathname==="/v1/driver/session"&&request.method==="POST") {
    let body; try{body=await readJson(request);}catch{return json({ok:false,error:"INVALID_REQUEST"},400,origin);}
    let identity; try{identity=await verifyGoogleCredential(body.credential,env.GOOGLE_CLIENT_ID);}catch{return json({ok:false,error:"GOOGLE_VERIFICATION_FAILED"},401,origin);}
    if(!(await recordAttempt(env.DB,identity.email))) return json({ok:false,error:"TRY_AGAIN_LATER"},429,origin);
    const driver=await env.DB.prepare("SELECT driver_id,display_name,email FROM drivers WHERE email=? AND active=1 LIMIT 1").bind(identity.email).first();
    if(!driver) {
      await env.DB.prepare("INSERT INTO driver_audit (driver_id,event_type,event_at,detail) VALUES (NULL,'LOGIN_DENIED',?,'No active driver allowlist match')").bind(Math.floor(Date.now()/1000)).run();
      return json({ok:false,error:"DRIVER_NOT_APPROVED"},403,origin);
    }
    const session=await createDriverSession(env,driver,identity.googleSub);
    return json({ok:true,data:{sessionToken:session.token,expiresAt:session.expiresAt,driver:{driverId:driver.driver_id,displayName:driver.display_name}}},200,origin);
  }
  if(url.pathname==="/v1/driver/me"&&request.method==="GET") {
    const driver=await currentDriver(env,request); if(!driver) return json({ok:false,error:"UNAUTHENTICATED"},401,origin);
    return json({ok:true,data:{driverId:driver.driver_id,displayName:driver.display_name,email:driver.email}},200,origin);
  }
  if(url.pathname==="/v1/driver/logout"&&request.method==="POST") {
    const token=bearer(request); if(!token) return json({ok:false,error:"UNAUTHENTICATED"},401,origin);
    const hash=await sha256Hex(token), now=Math.floor(Date.now()/1000);
    const session=await env.DB.prepare("SELECT driver_id FROM driver_sessions WHERE token_hash=? AND revoked_at IS NULL AND expires_at>?").bind(hash,now).first();
    if(!session) return json({ok:false,error:"UNAUTHENTICATED"},401,origin);
    await env.DB.prepare("UPDATE driver_sessions SET revoked_at=? WHERE token_hash=?").bind(now,hash).run();
    await env.DB.prepare("INSERT INTO driver_audit (driver_id,event_type,event_at,detail) VALUES (?,'SESSION_REVOKED',?,'Driver logout')").bind(session.driver_id,now).run();
    return json({ok:true},200,origin);
  }
  return json({ok:false,error:"NOT_FOUND"},404,origin);
}
export default {async fetch(request,env){const origin=request.headers.get("origin")||"";try{return await handle(request,env);}catch{return json({ok:false,error:"INTERNAL_ERROR"},500,origin===env.ALLOWED_ORIGIN?origin:"");}}};
