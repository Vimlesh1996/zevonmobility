package com.zevon.mobility.updater;

import java.util.Locale;

/** Pure validation policy for the interactive APK updater. */
final class ApkUpdatePolicy {
    private static final String OFFICIAL_URL =
        "^https://github\\.com/Vimlesh1996/zevonmobility/releases/download/v[0-9]+\\.[0-9]+\\.[0-9]+/ZEVON-Mobility-v[0-9]+\\.[0-9]+\\.[0-9]+\\.apk$";
    private static final String OFFICIAL_FILE =
        "^ZEVON-Mobility-v[0-9]+\\.[0-9]+\\.[0-9]+\\.apk$";

    private ApkUpdatePolicy() {}

    static boolean isSha256(String value) {
        return value != null && value.matches("(?i)[a-f0-9]{64}");
    }

    static boolean isOfficialReleaseUrl(String url, String fileName) {
        return url != null && fileName != null &&
            fileName.matches(OFFICIAL_FILE) &&
            url.matches(OFFICIAL_URL) &&
            url.endsWith("/" + fileName);
    }

    static boolean isExpectedPackage(String actualPackage, String expectedPackage) {
        return actualPackage != null && actualPackage.equals(expectedPackage);
    }

    static boolean isMatchingSigner(String candidate, String installed, String expected) {
        if (!isSha256(candidate) || !isSha256(installed) || !isSha256(expected)) return false;
        return candidate.toUpperCase(Locale.ROOT).equals(expected.toUpperCase(Locale.ROOT)) &&
            installed.toUpperCase(Locale.ROOT).equals(expected.toUpperCase(Locale.ROOT));
    }

    static boolean isNewerExpectedVersion(long candidate, long expected, long installed) {
        return candidate > 0 && candidate == expected && candidate > installed;
    }
}
