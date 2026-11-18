PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS drivers (
 driver_id TEXT PRIMARY KEY NOT NULL, display_name TEXT NOT NULL,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE, active INTEGER NOT NULL DEFAULT 0 CHECK(active IN(0,1)),
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_drivers_email_active ON drivers(email,active);
CREATE TABLE IF NOT EXISTS driver_sessions (
 token_hash TEXT PRIMARY KEY NOT NULL, driver_id TEXT NOT NULL, google_sub TEXT NOT NULL,
 created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, revoked_at INTEGER,
 FOREIGN KEY(driver_id) REFERENCES drivers(driver_id)
);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_driver ON driver_sessions(driver_id,expires_at);
CREATE TABLE IF NOT EXISTS driver_audit (
 audit_id INTEGER PRIMARY KEY AUTOINCREMENT, driver_id TEXT, event_type TEXT NOT NULL,
 event_at INTEGER NOT NULL, detail TEXT NOT NULL, FOREIGN KEY(driver_id) REFERENCES drivers(driver_id)
);
CREATE TABLE IF NOT EXISTS auth_attempts (
 attempt_id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL COLLATE NOCASE, attempted_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_email_time ON auth_attempts(email,attempted_at);
