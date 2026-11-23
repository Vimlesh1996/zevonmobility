#!/usr/bin/env python3
"""Apply ZEVON's narrow Android FileProvider and notification-permission config."""
from pathlib import Path
import os
import xml.etree.ElementTree as ET

ANDROID = "http://schemas.android.com/apk/res/android"
ET.register_namespace("android", ANDROID)
A = lambda name: f"{{{ANDROID}}}{name}"

def main():
    root = Path(os.environ.get("APP_ROOT", Path(__file__).resolve().parents[1]))
    manifest = root / "android/app/src/main/AndroidManifest.xml"
    paths = root / "android/app/src/main/res/xml/file_paths.xml"
    if not manifest.is_file() or not paths.is_file():
        raise SystemExit("Capacitor Android project/template files are missing; run npx cap add android first.")

    tree = ET.parse(manifest)
    app = tree.getroot()
    if app.tag != "manifest":
        raise SystemExit("Unexpected Android manifest root.")
    application = app.find("application")
    if application is None:
        raise SystemExit("Android manifest has no application element.")

    providers = [p for p in application.findall("provider")
                 if p.get(A("name")) == "androidx.core.content.FileProvider"
                 or p.get(A("authorities"), "").endswith(".fileprovider")]
    if len(providers) != 1:
        raise SystemExit(f"Expected exactly one app FileProvider; found {len(providers)}.")
    provider = providers[0]
    authority = provider.get(A("authorities"), "")
    if authority not in ("${applicationId}.fileprovider", "com.zevon.mobility.fileprovider"):
        raise SystemExit(f"Unexpected FileProvider authority: {authority!r}")
    if provider.get(A("name")) != "androidx.core.content.FileProvider":
        raise SystemExit("Unexpected FileProvider implementation.")
    provider.set(A("exported"), "false")
    provider.set(A("grantUriPermissions"), "true")
    metadata = [m for m in provider.findall("meta-data")
                if m.get(A("name")) == "android.support.FILE_PROVIDER_PATHS"]
    if len(metadata) != 1:
        raise SystemExit("Expected exactly one FileProvider paths metadata entry.")
    metadata[0].set(A("resource"), "@xml/file_paths")

    permission = "android.permission.POST_NOTIFICATIONS"
    if not any(p.get(A("name")) == permission for p in app.findall("uses-permission")):
        ET.SubElement(app, "uses-permission", {A("name"): permission})
    tree.write(manifest, encoding="utf-8", xml_declaration=True)

    paths_tree = ET.parse(paths)
    paths_root = paths_tree.getroot()
    if paths_root.tag != "paths":
        raise SystemExit("Unexpected FileProvider paths XML root.")
    for child in list(paths_root):
        paths_root.remove(child)
    ET.SubElement(paths_root, "cache-path", {"name": "apk_updates", "path": "apk-updates/"})
    paths_tree.write(paths, encoding="utf-8", xml_declaration=True)

    # Reparse and assert the exact contract after writing.
    final_manifest = ET.parse(manifest).getroot()
    final_provider = final_manifest.find("application").find("provider")
    if final_provider.get(A("authorities")) != authority:
        raise SystemExit("FileProvider authority changed unexpectedly.")
    if final_provider.get(A("exported")) != "false" or final_provider.get(A("grantUriPermissions")) != "true":
        raise SystemExit("FileProvider must be non-exported and grant URI permissions.")
    final_paths = ET.parse(paths).getroot()
    entries = list(final_paths)
    if len(entries) != 1 or entries[0].tag != "cache-path" or entries[0].get("path") != "apk-updates/":
        raise SystemExit("FileProvider must expose only the dedicated APK update cache directory.")
    print("Android platform config applied: private apk-updates cache path and POST_NOTIFICATIONS declaration.")

if __name__ == "__main__":
    main()
