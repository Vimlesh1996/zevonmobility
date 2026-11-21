#!/usr/bin/env python3
"""Apply a validated release tag and signing configuration to a generated Capacitor Android project."""
import json
import os
import re
from pathlib import Path

root = Path(os.environ.get("APP_ROOT", ".")).resolve()
tag = os.environ.get("RELEASE_TAG", "")
match = re.fullmatch(r"v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)", tag)
if not match:
    raise SystemExit("Release tag must use vMAJOR.MINOR.PATCH without leading zeroes")

major, minor, patch = map(int, match.groups())
if minor > 999 or patch > 999:
    raise SystemExit("MINOR and PATCH must be between 0 and 999")
version_code = major * 1_000_000 + minor * 1_000 + patch
if version_code < 1 or version_code > 2_147_483_647:
    raise SystemExit("Calculated Android versionCode is outside the supported range")
version = f"{major}.{minor}.{patch}"

for key in ("KEY_ALIAS", "STORE_PASSWORD"):
    if not os.environ.get(key):
        raise SystemExit(f"Missing required signing configuration: {key}")
key_password = os.environ.get("KEY_PASSWORD") or os.environ["STORE_PASSWORD"]

package_file = root / "package.json"
package_data = json.loads(package_file.read_text())
package_data["version"] = version
package_file.write_text(json.dumps(package_data, indent=2) + "\n")

html_file = root / "www" / "index.html"
html = html_file.read_text()
html, html_count = re.subn(
    r"(?:Version\s+\d+\.\d+\.\d+|Checking version(?:…|\.{3}))",
    "Version " + version,
    html,
    count=1,
)
if html_count != 1:
    raise SystemExit("Could not update exactly one in-app version label")
html_file.write_text(html)

gradle_file = root / "android" / "app" / "build.gradle"
gradle = gradle_file.read_text()
gradle, code_count = re.subn(
    r"(?m)^(\s*versionCode\s+)\d+\s*$",
    lambda item: item.group(1) + str(version_code),
    gradle,
    count=1,
)
gradle, name_count = re.subn(
    r'(?m)^(\s*versionName\s+)"[^"]+"\s*$',
    lambda item: item.group(1) + '"' + version + '"',
    gradle,
    count=1,
)
if code_count != 1 or name_count != 1:
    raise SystemExit(
        f"Expected exactly one Android versionCode and versionName; found {code_count} and {name_count}"
    )

if "signingConfigs {" in gradle:
    raise SystemExit("Unexpected existing signingConfigs block; inspect before release")

signing = f"""
    signingConfigs {{
        release {{
            storeFile file("../../zevon-release.keystore")
            storePassword System.getenv("STORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD") ?: System.getenv("STORE_PASSWORD")
        }}
    }}
"""
gradle, signing_count = re.subn(
    r"(?m)^(    buildTypes\s*\{\s*release\s*\{)",
    signing + r"\n\1\n            signingConfig signingConfigs.release",
    gradle,
    count=1,
)
if signing_count != 1:
    raise SystemExit("Could not attach release signing config")

gradle_file.write_text(gradle)
print(f"Configured app version {version} (versionCode {version_code})")
