#!/usr/bin/env python3
"""Send a data-only FCM update event after a ZEVON signed APK release."""
import json
import os
import re
import sys
import urllib.request

from google.auth.transport.requests import Request
from google.oauth2 import service_account

tag = os.environ.get("RELEASE_TAG", "")
repo = os.environ.get("GITHUB_REPOSITORY", "Vimlesh1996/zevonmobility")
topic = "zevon-app-updates"
if not re.fullmatch(r"v\d+\.\d+\.\d+", tag):
    raise SystemExit(f"Invalid release tag: {tag!r}")
if not re.fullmatch(r"[A-Za-z0-9_-]{1,900}", topic):
    raise SystemExit("Invalid FCM_UPDATE_TOPIC.")
try:
    info = json.loads(os.environ["FCM_SERVICE_ACCOUNT_JSON"])
except (KeyError, json.JSONDecodeError) as exc:
    raise SystemExit("FCM_SERVICE_ACCOUNT_JSON must be valid service-account JSON.") from exc
project = info.get("project_id")
if project != "zevon-mobility":
    raise SystemExit(f"Service-account project_id must be zevon-mobility, got {project!r}.")

api = f"https://api.github.com/repos/{repo}/releases/tags/{tag}"
request = urllib.request.Request(api, headers={"Accept": "application/vnd.github+json"})
with urllib.request.urlopen(request, timeout=30) as response:
    release = json.loads(response.read().decode())
asset = next((a for a in release.get("assets", [])
              if re.fullmatch(r"ZEVON-Mobility-v\d+\.\d+\.\d+\.apk", a.get("name", ""))), None)
digest = (asset or {}).get("digest", "")
digest = digest.removeprefix("sha256:")
if not asset or not re.fullmatch(r"[a-fA-F0-9]{64}", digest):
    raise SystemExit("Published release APK or GitHub SHA-256 digest is missing.")
download_url = asset.get("browser_download_url", "")
if not download_url.startswith("https://github.com/") or "/releases/download/" not in download_url:
    raise SystemExit("Release APK URL is not an official GitHub Release URL.")

credentials = service_account.Credentials.from_service_account_info(
    info, scopes=["https://www.googleapis.com/auth/firebase.messaging"]
)
credentials.refresh(Request())
payload = {
    "message": {
        "topic": topic,
        "data": {
            "type": "zevon_app_update",
            "version": tag[1:],
            "releaseTag": tag,
            "downloadUrl": download_url,
            "fileName": asset["name"],
            "sha256": digest.lower(),
        },
        "android": {"priority": "HIGH"},
    }
}
request = urllib.request.Request(
    f"https://fcm.googleapis.com/v1/projects/{project}/messages:send",
    data=json.dumps(payload).encode(),
    headers={
        "Authorization": f"Bearer {credentials.token}",
        "Content-Type": "application/json; charset=UTF-8",
    },
    method="POST",
)
try:
    with urllib.request.urlopen(request, timeout=30) as response:
        result = json.loads(response.read().decode())
        print(f"FCM update event accepted for topic {topic}: {result.get('name', 'ok')}")
except Exception as exc:
    print(f"FCM send failed: {exc}", file=sys.stderr)
    raise
