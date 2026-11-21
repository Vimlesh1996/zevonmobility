package com.zevon.mobility.updater;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Pure validation policy for the interactive APK updater. */
final class ApkUpdatePolicy {
    private static final String VERSION = "(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)";
    private static final Pattern OFFICIAL_URL = Pattern.compile(
        "^https://github\\.com/Vimlesh1996/zevonmobility/releases/download/v(" + VERSION +
        ")/ZEVON-Mobility-v(" + VERSION + ")\\.apk$"
    );
    private static final Pattern OFFICIAL_FILE = Pattern.compile(
        "^ZEVON-Mobility-v" + VERSION + "\\.apk$"
    );

    private ApkUpdatePolicy() {}

    static boolean isSha256(String value) {
        return value != null && value.matches("(?i)[a-f0-9]{64}");
    }

    static boolean isOfficialReleaseUrl(String url, String fileName) {
        if (url == null || fileName == null || !OFFICIAL_FILE.matcher(fileName).matches()) return false;
        Matcher match = OFFICIAL_URL.matcher(url);
        if (!match.matches() || !url.endsWith("/" + fileName)) return false;
        return match.group(1).equals(match.group(5));
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
