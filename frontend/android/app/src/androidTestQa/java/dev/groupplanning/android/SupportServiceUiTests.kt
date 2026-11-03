package dev.groupplanning.android

import android.content.ContentValues
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.provider.MediaStore
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.lifecycle.ViewModelProvider
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import dev.groupplanning.android.state.AppViewModel
import java.util.UUID
import java.util.regex.Pattern
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class SupportServiceUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test fun systemScreenshotCancelSelectionAndRemovalPreserveDescription() {
        val resolver = fixture.context.contentResolver
        val name = "somewhere-support-${UUID.randomUUID()}.png"
        val image = checkNotNull(
            resolver.insert(
                MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, name)
                    put(MediaStore.MediaColumns.MIME_TYPE, "image/png")
                    put(MediaStore.MediaColumns.IS_PENDING, 1)
                },
            ),
        )
        try {
            val bitmap = Bitmap.createBitmap(128, 128, Bitmap.Config.ARGB_8888)
            try {
                bitmap.eraseColor(Color.MAGENTA)
                checkNotNull(resolver.openOutputStream(image)).use {
                    assertTrue(bitmap.compress(Bitmap.CompressFormat.PNG, 100, it))
                }
            } finally {
                bitmap.recycle()
            }
            resolver.update(
                image,
                ContentValues().apply { put(MediaStore.MediaColumns.IS_PENDING, 0) },
                null,
                null,
            )
            fixture.launch("calendar").use { activity ->
                openProfile()
                compose.onNodeWithText("Сообщить о проблеме").performScrollTo().performClick()
                fixture.waitTag("support-description")
                val description = "Скриншот через системный выбор Android"
                compose.onNodeWithTag("support-description").performClick()
                    .performTextInput(description)
                fixture.device.pressBack()
                repeat(2) {
                    openPicker()
                    fixture.device.pressBack()
                    fixture.waitTag("support-description")
                    compose.onNodeWithTag("support-description").assertTextContains(description)
                }
                openPicker()
                fixture.screenshot("support-system-screenshot-picker")
                val file = fixture.device.wait(Until.findObject(By.text(name)), 3_000)
                if (file != null) {
                    file.click()
                } else {
                    // Android 16's Compose picker also matches its Photos tab by description.
                    // Select the measured square thumbnail; the decoded pixel check below
                    // verifies that the result is our synthetic image, not another item.
                    val width = fixture.device.displayWidth
                    val photo = fixture.device.findObjects(By.clickable(true)).first {
                        val bounds = it.visibleBounds
                        bounds.width() in width / 4..width / 2 &&
                            kotlin.math.abs(bounds.width() - bounds.height()) <= 4
                    }
                    photo.click()
                }
                fixture.device.wait(
                    Until.findObject(
                        By.pkg(Pattern.compile(".*(?:photopicker|providers.media).*"))
                            .text(Pattern.compile("^(Add|Select|Done|Готово|Добавить|Выбрать).*$")),
                    ),
                    1_000,
                )?.click()
                assertTrue(
                    fixture.device.wait(
                        Until.gone(By.pkg(Pattern.compile(".*(?:photopicker|providers.media).*"))),
                        5_000,
                    ),
                )
                val preview =
                    hasContentDescription(fixture.context.getString(R.string.photo_preview))
                compose.waitUntil(15_000) {
                    try {
                        compose.onAllNodes(preview).fetchSemanticsNodes().isNotEmpty()
                    } catch (_: IllegalStateException) {
                        // Picker finish precedes the activity's resumed Compose root.
                        false
                    }
                }
                var selected: ByteArray? = null
                activity.onActivity {
                    selected = ViewModelProvider(it)[AppViewModel::class.java]
                        .support?.state?.value?.screenshot?.bytes
                }
                val decoded = checkNotNull(
                    BitmapFactory.decodeByteArray(
                        checkNotNull(selected),
                        0,
                        checkNotNull(selected).size,
                    ),
                )
                try {
                    assertEquals(128, decoded.width)
                    assertEquals(128, decoded.height)
                    assertEquals(Color.MAGENTA, decoded.getPixel(64, 64))
                } finally {
                    decoded.recycle()
                }
                fixture.screenshot("support-system-screenshot-selected")
                compose.onNodeWithText(fixture.context.getString(R.string.experience_remove))
                    .performScrollTo().performClick()
                compose.onNode(preview).assertDoesNotExist()
                compose.onNodeWithTag("support-description").assertTextContains(description)
            }
        } finally {
            resolver.delete(image, null, null)
        }
    }

    @Test fun actualBuildAndDocumentsReturnToTheProfile() {
        fixture.launch("calendar").use {
            openProfile()
            compose.onNodeWithText(fixture.context.getString(R.string.about_title))
                .performScrollTo().performClick()
            fixture.waitTag("service-page")
            compose.onNodeWithText(BuildConfig.VERSION_NAME).performScrollTo().assertIsDisplayed()
            compose.onNodeWithText(BuildConfig.VERSION_CODE.toString())
                .performScrollTo().assertIsDisplayed()
            fixture.screenshot("support-actual-build")
            backToProfile()
            for (label in listOf(R.string.privacy_short, R.string.cookies_title)) {
                compose.onNodeWithText(fixture.context.getString(label))
                    .performScrollTo().performClick()
                fixture.waitTag("service-page")
                fixture.screenshot("support-document-$label")
                backToProfile()
            }
        }
    }

    private fun openProfile() {
        fixture.waitTag("meetings-list")
        compose.onNodeWithTag("home-profile").performClick()
        fixture.waitText("Яндекс ID")
    }

    private fun backToProfile() {
        compose.onNodeWithText("Назад").performClick()
        fixture.waitAbsent("service-page")
        compose.onNodeWithTag("home-profile").assertIsSelected()
    }

    private fun openPicker() {
        compose.onNodeWithText(fixture.context.getString(R.string.support_screenshot))
            .performScrollTo().performClick()
        assertTrue(
            fixture.device.wait(
                Until.hasObject(
                    By.pkg(Pattern.compile(".*(?:documentsui|photopicker|providers.media).*")),
                ),
                10_000,
            ),
        )
    }
}
