package com.zevon.mobility.updater;

import org.junit.Test;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.Arrays;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.junit.Assert.*;

public class ApkUpdatePolicyTest {
    private static final String HASH =
        "A37023520C83251D22A5EF560041AD78A380ED0266DF9B550685155B82990453";
    private static final String APK =
        "ZEVON-Mobility-v1.0.9.apk";
    private static final String URL_VALUE =
        "https://github.com/Vimlesh1996/zevonmobility/releases/download/v1.0.9/" + APK;

    private static String otherHash() {
        char[] value = new char[64];
        Arrays.fill(value, 'B');
        return new String(value);
    }

    @Test
    public void acceptsOnlyExactOfficialReleaseAssetUrl() {
        assertTrue(ApkUpdatePolicy.isOfficialReleaseUrl(URL_VALUE, APK));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(
            "http://github.com/Vimlesh1996/zevonmobility/releases/download/v1.0.9/" + APK, APK));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(
            "https://github.com/attacker/zevonmobility/releases/download/v1.0.9/" + APK, APK));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(
            "https://github.com/Vimlesh1996/other/releases/download/v1.0.9/" + APK, APK));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(
            "https://github.com/Vimlesh1996/zevonmobility/releases/download/v1.0.9/other.apk", APK));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(URL_VALUE, "../" + APK));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(
            "https://github.com/Vimlesh1996/zevonmobility/releases/download/v01.0.9/" + APK, APK));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(
            "https://github.com/Vimlesh1996/zevonmobility/releases/download/v1.0.8/" + APK, APK));
    }

    @Test
    public void acceptsOnlyExactHttpsReleaseHostsOnDefaultPorts() {
        assertTrue(ApkUpdatePolicy.isTrustedDownloadUrl("https://github.com/releases/download/file.apk"));
        assertTrue(ApkUpdatePolicy.isTrustedDownloadUrl("https://objects.githubusercontent.com/assets/file"));
        assertTrue(ApkUpdatePolicy.isTrustedDownloadUrl("https://release-assets.githubusercontent.com/assets/file"));
        assertTrue(ApkUpdatePolicy.isTrustedDownloadUrl("https://release-assets.githubusercontent.com:443/assets/file"));

        assertFalse(ApkUpdatePolicy.isTrustedDownloadUrl("http://release-assets.githubusercontent.com/assets/file"));
        assertFalse(ApkUpdatePolicy.isTrustedDownloadUrl("https://evil-release-assets.githubusercontent.com/assets/file"));
        assertFalse(ApkUpdatePolicy.isTrustedDownloadUrl("https://release-assets.githubusercontent.com.evil.test/file"));
        assertFalse(ApkUpdatePolicy.isTrustedDownloadUrl("https://release-assets.githubusercontent.com:8443/file"));
        assertFalse(ApkUpdatePolicy.isTrustedDownloadUrl("https://github.com@evil.test/file"));
        assertFalse(ApkUpdatePolicy.isTrustedDownloadUrl("https://evil.test/file"));
        assertFalse(ApkUpdatePolicy.isTrustedDownloadUrl("https://githubusercontent.com/assets/file"));
        assertFalse(ApkUpdatePolicy.isTrustedDownloadUrl(null));
    }

    @Test
    public void resolvesRelativeRedirectOnlyWhenFinalUrlIsTrusted() throws Exception {
        URL source = new URL(URL_VALUE);
        URL valid = ApkUpdatePolicy.resolveTrustedRedirect(
            source, "https://release-assets.githubusercontent.com/assets/release.apk");
        assertEquals("release-assets.githubusercontent.com", valid.getHost());

        try {
            ApkUpdatePolicy.resolveTrustedRedirect(source, "http://release-assets.githubusercontent.com/file.apk");
            fail("HTTP redirect must be rejected");
        } catch (SecurityException expected) {
            // Expected.
        }

        try {
            ApkUpdatePolicy.resolveTrustedRedirect(source, "https://attacker.test/file.apk");
            fail("Untrusted redirect host must be rejected");
        } catch (SecurityException expected) {
            // Expected.
        }
    }

    @Test
    public void rejectsRedirectBeyondMaximumHopCount() throws Exception {
        URL source = new URL(URL_VALUE);
        assertEquals("release-assets.githubusercontent.com",
            ApkUpdatePolicy.resolveTrustedRedirect(source,
                "https://release-assets.githubusercontent.com/assets/file.apk",
                ApkUpdatePolicy.MAX_REDIRECTS - 1).getHost());
        try {
            ApkUpdatePolicy.resolveTrustedRedirect(source,
                "https://release-assets.githubusercontent.com/assets/file.apk",
                ApkUpdatePolicy.MAX_REDIRECTS);
            fail("Redirect beyond the configured hop limit must be rejected");
        } catch (SecurityException expected) {
            // Expected.
        }
    }

    @Test
    public void boundedStreamDeletesPartialFileWhenByteLimitIsExceeded() throws Exception {
        File out = File.createTempFile("zevon-apk-limit-", ".apk");
        byte[] payload = new byte[32];
        try {
            ApkUpdatePolicy.copyBoundedToFile(new ByteArrayInputStream(payload), out, 16);
            fail("Oversized stream must be rejected");
        } catch (SecurityException expected) {
            assertFalse("Partial output must be deleted", out.exists());
        } finally {
            if (out.exists()) out.delete();
        }
    }

    @Test
    public void boundedStreamWritesWithinLimit() throws Exception {
        File out = File.createTempFile("zevon-apk-ok-", ".apk");
        byte[] payload = new byte[32];
        try {
            long copied = ApkUpdatePolicy.copyBoundedToFile(new ByteArrayInputStream(payload), out, 32);
            assertEquals(32L, copied);
            assertEquals(32L, out.length());
        } finally {
            if (out.exists()) out.delete();
        }
    }

    @Test
    public void boundedStreamDeletesPartialFileWhenInputFails() throws Exception {
        File out = File.createTempFile("zevon-apk-io-", ".apk");
        java.io.InputStream broken = new java.io.InputStream() {
            private int reads;
            @Override public int read() throws IOException {
                if (reads++ == 0) return 65;
                throw new IOException("simulated stream failure");
            }
        };
        try {
            ApkUpdatePolicy.copyBoundedToFile(broken, out, 100);
            fail("I/O failure must propagate");
        } catch (IOException expected) {
            assertFalse("Partial output must be deleted", out.exists());
        } finally {
            if (out.exists()) out.delete();
            broken.close();
        }
    }

    @Test
    public void recognizesOnlySupportedRedirectStatuses() {
        assertTrue(ApkUpdatePolicy.isRedirectStatus(301));
        assertTrue(ApkUpdatePolicy.isRedirectStatus(302));
        assertTrue(ApkUpdatePolicy.isRedirectStatus(303));
        assertTrue(ApkUpdatePolicy.isRedirectStatus(307));
        assertTrue(ApkUpdatePolicy.isRedirectStatus(308));
        assertFalse(ApkUpdatePolicy.isRedirectStatus(200));
        assertFalse(ApkUpdatePolicy.isRedirectStatus(404));
    }

    @Test
    public void enforcesMaximumDownloadBytesWithoutOverflow() {
        long limit = ApkUpdatePolicy.MAX_APK_BYTES;
        assertTrue(ApkUpdatePolicy.canAppendBytes(0, limit));
        assertTrue(ApkUpdatePolicy.canAppendBytes(limit - 1, 1));
        assertFalse(ApkUpdatePolicy.canAppendBytes(limit, 1));
        assertFalse(ApkUpdatePolicy.canAppendBytes(limit - 10, 11));
        assertFalse(ApkUpdatePolicy.canAppendBytes(-1, 1));
        assertFalse(ApkUpdatePolicy.canAppendBytes(0, -1));
        assertFalse(ApkUpdatePolicy.canAppendBytes(Long.MAX_VALUE, Long.MAX_VALUE));
    }

    @Test
    public void singleFlightGuardRejectsConcurrentAcquisitionAndCanBeReleased() {
        AtomicBoolean inProgress = new AtomicBoolean(false);
        assertTrue(ApkUpdatePolicy.tryAcquireDownload(inProgress));
        assertFalse(ApkUpdatePolicy.tryAcquireDownload(inProgress));
        ApkUpdatePolicy.releaseDownload(inProgress);
        assertTrue(ApkUpdatePolicy.tryAcquireDownload(inProgress));
        ApkUpdatePolicy.releaseDownload(inProgress);
        assertFalse(inProgress.get());
    }

    @Test
    public void validatesSha256Format() {
        assertTrue(ApkUpdatePolicy.isSha256(HASH));
        assertTrue(ApkUpdatePolicy.isSha256(HASH.toLowerCase()));
        assertFalse(ApkUpdatePolicy.isSha256("not-a-hash"));
        assertFalse(ApkUpdatePolicy.isSha256(HASH.substring(1)));
        assertFalse(ApkUpdatePolicy.isSha256(null));
    }

    @Test
    public void requiresTheExpectedApplicationId() {
        assertTrue(ApkUpdatePolicy.isExpectedPackage("com.zevon.mobility", "com.zevon.mobility"));
        assertFalse(ApkUpdatePolicy.isExpectedPackage("com.attacker.app", "com.zevon.mobility"));
        assertFalse(ApkUpdatePolicy.isExpectedPackage(null, "com.zevon.mobility"));
    }

    @Test
    public void requiresCandidateAndInstalledSignersToMatchManifest() {
        assertTrue(ApkUpdatePolicy.isMatchingSigner(HASH, HASH.toLowerCase(), HASH));
        assertFalse(ApkUpdatePolicy.isMatchingSigner(otherHash(), HASH, HASH));
        assertFalse(ApkUpdatePolicy.isMatchingSigner(HASH, otherHash(), HASH));
        assertFalse(ApkUpdatePolicy.isMatchingSigner(HASH, HASH, "bad"));
    }

    @Test
    public void alignsManifestVersionAndVersionCodeWithStrictSemanticVersioning() {
        assertEquals(1000009L, ApkUpdatePolicy.versionCodeFor("1.0.9"));
        assertEquals(2003004L, ApkUpdatePolicy.versionCodeFor("2.3.4"));
        assertTrue(ApkUpdatePolicy.isMatchingVersion("1.0.9", 1000009L));
        assertFalse(ApkUpdatePolicy.isMatchingVersion("1.0.9", 1000008L));
        assertEquals(0L, ApkUpdatePolicy.versionCodeFor("01.0.9"));
        assertEquals(0L, ApkUpdatePolicy.versionCodeFor("1.1000.0"));
        assertEquals(0L, ApkUpdatePolicy.versionCodeFor("1.0.1000"));
        assertEquals(0L, ApkUpdatePolicy.versionCodeFor("2148.0.0"));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(URL_VALUE, APK, "1.0.8"));
        assertTrue(ApkUpdatePolicy.isOfficialReleaseUrl(URL_VALUE, APK, "1.0.9"));
    }

    @Test
    public void requiresManifestVersionToMatchAndAdvanceInstalledVersion() {
        assertTrue(ApkUpdatePolicy.isNewerExpectedVersion(1000009, 1000009, 1000008));
        assertFalse(ApkUpdatePolicy.isNewerExpectedVersion(1000008, 1000009, 1000008));
        assertFalse(ApkUpdatePolicy.isNewerExpectedVersion(1000009, 1000009, 1000009));
        assertFalse(ApkUpdatePolicy.isNewerExpectedVersion(1000008, 1000008, 1000009));
        assertFalse(ApkUpdatePolicy.isNewerExpectedVersion(0, 0, 0));
    }
}
