#!/usr/bin/env python3
"""Generate the public updater manifest from the exact signed release APK."""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

PACKAGE = "com.zevon.mobility"
REPOSITORY = "Vimlesh1996/zevonmobility"
VERSION_RE = re.compile(r"^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)$")


def version_code(version_tag):
    match = VERSION_RE.fullmatch(version_tag or "")
    if not match:
        raise ValueError("Release tag must be vMAJOR.MINOR.PATCH without leading zeroes")
    major, minor, patch = map(int, match.groups())
    if minor > 999 or patch > 999:
        raise ValueError("MINOR and PATCH must be between 0 and 999")
    code = major * 1_000_000 + minor * 1_000 + patch
    if code < 1 or code > 2_147_483_647:
        raise ValueError("Calculated Android versionCode is outside the supported range")
    return code


def build_manifest(apk_path, tag, aapt="aapt", apksigner="apksigner", notes=""):
    apk = Path(apk_path)
    if not apk.is_file():
        raise ValueError("Signed APK does not exist")
    version = tag[1:]
    expected_code = version_code(tag)
    badging = subprocess.check_output([aapt, "dump", "badging", str(apk)], text=True)
    package = re.search(r"^package: name='([^']+)' versionCode='([0-9]+)' versionName='([^']+)'", badging, re.M)
    if not package:
        raise ValueError("Unable to read APK package/version metadata")
    package_name, code_text, apk_version = package.groups()
    if package_name != PACKAGE or apk_version != version or int(code_text) != expected_code:
        raise ValueError("Signed APK package/version metadata does not match release tag")
    certs = subprocess.check_output([apksigner, "verify", "--print-certs", str(apk)], text=True, stderr=subprocess.STDOUT)
    signers = re.findall(r"Signer #[0-9]+ certificate SHA-256 digest: ([a-fA-F0-9]{64})", certs)
    if len(signers) != 1:
        raise ValueError("APK must have exactly one current SHA-256 signer certificate")
    digest_state = hashlib.sha256()
    with apk.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest_state.update(chunk)
    digest = digest_state.hexdigest()
    filename = "ZEVON-Mobility-v" + version + ".apk"
    if apk.name != filename:
        raise ValueError("APK filename must be " + filename)
    return {
        "version": version,
        "versionCode": expected_code,
        "packageName": PACKAGE,
        "apkUrl": "https://github.com/" + REPOSITORY + "/releases/download/" + tag + "/" + filename,
        "sha256": digest,
        "signerSha256": signers[0].upper(),
        "notes": notes[:1000],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apk", required=True)
    parser.add_argument("--tag", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--aapt", default="aapt")
    parser.add_argument("--apksigner", default="apksigner")
    parser.add_argument("--notes", default="A verified ZEVON Mobility update.")
    args = parser.parse_args()
    manifest = build_manifest(args.apk, args.tag, args.aapt, args.apksigner, args.notes)
    Path(args.output).write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("Generated update manifest for", manifest["version"], "versionCode", manifest["versionCode"])


if __name__ == "__main__":
    main()
