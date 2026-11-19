#!/usr/bin/env python3
"""Send an FCM topic notification after a ZEVON signed APK release."""
import json
import os
import re
import sys
import urllib.request

from google.auth.transport.requests import Request
from google.oauth2 import service_account

tag = os.environ.get("RELEASE_TAG", "")
repo = os.environ.get("GITHUB_REPOSITORY", "Vimlesh1996/zevonmobility")
topic = os.environ.get("FCM_UPDATE_TOPIC", "zevon-app-updates").strip()
if not re.fullmatch(r"v\d+\.\d+\.\d+", tag):
    raise SystemExit(f"Invalid release tag: {tag!r}")
if not re.fullmatch(r"[A-Za-z0-9_-]{1,900}", topic):
    raise SystemExit("Invalid FCM_UPDATE_TOPIC.")
try:
    info = json.loads(os.environ["FCM_SERVICE_ACCOUNT_JSON"])
except (KeyError, json.JSONDecodeError) as exc:
    raise SystemExit("FCM_SERVICE_ACCOUNT_JSON must be valid service-account JSON.") from exc
project = info.get("project_id")
if not project:
    raise SystemExit("Service-account JSON has no project_id.")
credentials = service_account.Credentials.from_service_account_info(
    info, scopes=["https://www.googleapis.com/auth/firebase.messaging"]
)
credentials.refresh(Request())
payload = {
    "message": {
        "topic": topic,
        "notification": {
            "title": "ZEVON Mobility update available",
            "body": f"Version {tag} is ready. Open ZEVON to download the update.",
        },
        "data": {
            "type": "zevon_app_update",
            "version": tag[1:],
            "releaseTag": tag,
            "releaseUrl": f"https://github.com/{repo}/releases/tag/{tag}",
        },
        "android": {"priority": "NORMAL"},
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
        print(f"FCM notification accepted for topic {topic}: {result.get('name', 'ok')}")
except Exception as exc:
    print(f"FCM send failed: {exc}", file=sys.stderr)
    raise
