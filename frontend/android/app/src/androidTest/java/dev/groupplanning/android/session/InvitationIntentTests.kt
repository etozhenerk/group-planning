package dev.groupplanning.android.session

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import dev.groupplanning.android.BuildConfig
import org.junit.Assert.assertEquals
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class InvitationIntentTests {
    private val context = InstrumentationRegistry.getInstrumentation().targetContext
    private val token = "QUFBQUFBQUFBQUFBQUFBQQ"

    @Test fun installedManifestClaimsOnlyInvitationPaths() {
        assumeTrue(BuildConfig.API_ORIGIN.isNotEmpty())
        val production = !context.packageName.endsWith(".uitesthost")
        for (path in listOf("i", "invitations")) {
            assertEquals(production, resolves("${BuildConfig.API_ORIGIN}/$path/$token"))
        }
        for (url in listOf(
            "${BuildConfig.API_ORIGIN}/api/v1/auth/yandex/callback",
            "${BuildConfig.API_ORIGIN}/meetings/123",
            "${BuildConfig.API_ORIGIN}/",
            "https://other.example/i/$token",
            "${BuildConfig.API_ORIGIN.replace("https:", "http:")}/i/$token",
        )) {
            assertEquals(url, false, resolves(url))
        }
    }

    private fun resolves(url: String): Boolean {
        // Package restriction tests the installed manifest, not domain verification.
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            .addCategory(Intent.CATEGORY_BROWSABLE)
            .setPackage(context.packageName)
        return context.packageManager.queryIntentActivities(
            intent,
            PackageManager.MATCH_DEFAULT_ONLY,
        )
            .any { it.activityInfo.name == "dev.groupplanning.android.MainActivity" }
    }
}
