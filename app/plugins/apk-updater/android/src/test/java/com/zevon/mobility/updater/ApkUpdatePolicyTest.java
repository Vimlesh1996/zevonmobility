package com.zevon.mobility.updater;

import org.junit.Test;
import java.util.Arrays;
import static org.junit.Assert.*;

public class ApkUpdatePolicyTest {
    private static final String HASH =
        "A37023520C83251D22A5EF560041AD78A380ED0266DF9B550685155B82990453";
    private static final String APK =
        "ZEVON-Mobility-v1.0.9.apk";
    private static final String URL =
        "https://github.com/Vimlesh1996/zevonmobility/releases/download/v1.0.9/" + APK;

    private static String otherHash() {
        char[] value = new char[64];
        Arrays.fill(value, 'B');
        return new String(value);
    }

    @Test
    public void acceptsOnlyExactOfficialReleaseAssetUrl() {
        assertTrue(ApkUpdatePolicy.isOfficialReleaseUrl(URL, APK));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(
            "http://github.com/Vimlesh1996/zevonmobility/releases/download/v1.0.9/" + APK, APK));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(
            "https://github.com/attacker/zevonmobility/releases/download/v1.0.9/" + APK, APK));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(
            "https://github.com/Vimlesh1996/other/releases/download/v1.0.9/" + APK, APK));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(
            "https://github.com/Vimlesh1996/zevonmobility/releases/download/v1.0.9/other.apk", APK));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(URL, "../" + APK));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(
            "https://github.com/Vimlesh1996/zevonmobility/releases/download/v01.0.9/" + APK, APK));
        assertFalse(ApkUpdatePolicy.isOfficialReleaseUrl(
            "https://github.com/Vimlesh1996/zevonmobility/releases/download/v1.0.8/" + APK, APK));
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
    public void requiresManifestVersionToMatchAndAdvanceInstalledVersion() {
        assertTrue(ApkUpdatePolicy.isNewerExpectedVersion(1000009, 1000009, 1000008));
        assertFalse(ApkUpdatePolicy.isNewerExpectedVersion(1000008, 1000009, 1000008));
        assertFalse(ApkUpdatePolicy.isNewerExpectedVersion(1000009, 1000009, 1000009));
        assertFalse(ApkUpdatePolicy.isNewerExpectedVersion(1000008, 1000008, 1000009));
        assertFalse(ApkUpdatePolicy.isNewerExpectedVersion(0, 0, 0));
    }
}
