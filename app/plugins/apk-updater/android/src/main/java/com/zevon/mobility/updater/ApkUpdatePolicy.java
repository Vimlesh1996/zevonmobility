package com.zevon.mobility.updater;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Pure validation policy for the interactive APK updater. */
final class ApkUpdatePolicy {
    static final long MAX_APK_BYTES = 100L * 1024L * 1024L;
    static final int MAX_REDIRECTS = 5;

    private static final String VERSION = "(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)";
    private static final Pattern OFFICIAL_URL = Pattern.compile(
        "^https://github\\.com/Vimlesh1996/zevonmobility/releases/download/v(" + VERSION +
        ")/ZEVON-Mobility-v(" + VERSION + ")\\.apk$"
    );
    private static final Pattern OFFICIAL_FILE = Pattern.compile(
        "^ZEVON-Mobility-v" + VERSION + "\\.apk$"
    );
    private static final Set<String> TRUSTED_DOWNLOAD_HOSTS = new HashSet<>(Arrays.asList(
        "github.com",
        "objects.githubusercontent.com",
        "release-assets.githubusercontent.com"
    ));

    private ApkUpdatePolicy() {}

    static boolean isSha256(String value) {
        return value != null && value.matches("(?i)[a-f0-9]{64}");
    }

    static long versionCodeFor(String version) {
        if (version == null) return 0L;
        Matcher match = Pattern.compile("^" + VERSION + "$").matcher(version);
        if (!match.matches()) return 0L;
        try {
            long major = Long.parseLong(match.group(1));
            long minor = Long.parseLong(match.group(2));
            long patch = Long.parseLong(match.group(3));
            if (minor > 999L || patch > 999L) return 0L;
            long code = major * 1000000L + minor * 1000L + patch;
            return code > 0L && code <= 2147483647L ? code : 0L;
        } catch (NumberFormatException ignored) {
            return 0L;
        }
    }

    static boolean isMatchingVersion(String version, long versionCode) {
        return versionCode > 0L && versionCodeFor(version) == versionCode;
    }

    static boolean isOfficialReleaseUrl(String url, String fileName) {
        if (url == null || fileName == null || !OFFICIAL_FILE.matcher(fileName).matches()) return false;
        Matcher match = OFFICIAL_URL.matcher(url);
        if (!match.matches() || !url.endsWith("/" + fileName)) return false;
        return match.group(1).equals(match.group(5)) && versionCodeFor(match.group(1)) > 0L;
    }

    static boolean isOfficialReleaseUrl(String url, String fileName, String expectedVersion) {
        return isMatchingVersion(expectedVersion, versionCodeFor(expectedVersion)) &&
            isOfficialReleaseUrl(url, fileName) &&
            url.contains("/releases/download/v" + expectedVersion + "/") &&
            fileName.equals("ZEVON-Mobility-v" + expectedVersion + ".apk");
    }

    /**
     * Redirects are restricted to exact HTTPS GitHub release hosts. No suffix or
     * wildcard matching is used, and non-default ports/user-info are rejected.
     */
    static boolean isTrustedDownloadUrl(String value) {
        if (value == null || value.trim().isEmpty()) return false;
        try {
            URL url = new URL(value);
            String host = url.getHost() == null ? "" : url.getHost().toLowerCase(Locale.ROOT);
            return "https".equalsIgnoreCase(url.getProtocol()) &&
                (url.getPort() == -1 || url.getPort() == 443) &&
                url.getUserInfo() == null &&
                TRUSTED_DOWNLOAD_HOSTS.contains(host);
        } catch (Exception ignored) {
            return false;
        }
    }

    static boolean isRedirectStatus(int status) {
        return status == 301 || status == 302 || status == 303 || status == 307 || status == 308;
    }

    static URL resolveTrustedRedirect(URL current, String location) throws Exception {
        return resolveTrustedRedirect(current, location, 0);
    }

    static URL resolveTrustedRedirect(URL current, String location, int redirectCount) throws Exception {
        if (redirectCount < 0 || redirectCount >= MAX_REDIRECTS) {
            throw new SecurityException("APK download exceeded the maximum redirect count.");
        }
        if (current == null || location == null || location.trim().isEmpty()) {
            throw new SecurityException("The APK server returned an invalid redirect.");
        }
        URL next = new URL(current, location.trim());
        if (!isTrustedDownloadUrl(next.toExternalForm())) {
            throw new SecurityException("APK redirect target is not an approved HTTPS GitHub host.");
        }
        return next;
    }

    /**
     * Copies an untrusted stream to disk with a strict byte ceiling. Any rejected
     * or failed copy removes the partial output; the caller owns the input stream.
     */
    static long copyBoundedToFile(InputStream in, File out, long maxBytes) throws IOException {
        if (in == null || out == null || maxBytes < 0) {
            throw new IllegalArgumentException("A valid input, output file and byte limit are required.");
        }
        long totalBytesRead = 0L;
        try (FileOutputStream fos = new FileOutputStream(out)) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = in.read(buffer)) != -1) {
                if (!canAppendBytes(totalBytesRead, count, maxBytes)) {
                    throw new SecurityException("APK exceeds the maximum permitted download size.");
                }
                totalBytesRead += count;
                fos.write(buffer, 0, count);
            }
            fos.getFD().sync();
            return totalBytesRead;
        } catch (IOException | SecurityException e) {
            if (out.exists()) out.delete();
            throw e;
        }
    }

    static boolean canAppendBytes(long totalBytesRead, long incomingBytes) {
        return canAppendBytes(totalBytesRead, incomingBytes, MAX_APK_BYTES);
    }

    static boolean canAppendBytes(long totalBytesRead, long incomingBytes, long maxBytes) {
        return maxBytes >= 0 && totalBytesRead >= 0 && incomingBytes >= 0 &&
            totalBytesRead <= maxBytes && incomingBytes <= maxBytes - totalBytesRead;
    }

    static boolean tryAcquireDownload(AtomicBoolean inProgress) {
        return inProgress != null && inProgress.compareAndSet(false, true);
    }

    static void releaseDownload(AtomicBoolean inProgress) {
        if (inProgress != null) inProgress.set(false);
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
