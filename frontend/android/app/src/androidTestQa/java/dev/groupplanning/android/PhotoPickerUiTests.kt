package dev.groupplanning.android

import android.content.ContentValues
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.provider.MediaStore
import android.util.Log
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.assertWidthIsEqualTo
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeLeft
import androidx.compose.ui.unit.dp
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import java.util.regex.Pattern
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class PhotoPickerUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test fun systemPhotoPickerPublishesSelectedPhotoWithoutCaption() {
        val photos = mutableListOf<Uri>()
        try {
            repeat(3) { photos += createPhoto(it) }
            fixture.launch("design").use {
                fixture.waitText("Настолки у Саши")
                compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
                fixture.waitTag("meeting-add")
                compose.onNodeWithTag("meeting-add").performClick()
                compose.onNodeWithTag("add-photo").performClick()
                val picker = Pattern.compile(".*(?:photopicker|providers\\.media).*")
                assertTrue(fixture.device.wait(Until.hasObject(By.pkg(picker)), 10_000))
                fixture.screenshot("design-photo-picker")
                val output = checkNotNull(
                    androidx.test.platform.app.InstrumentationRegistry
                        .getArguments().getString("additionalTestOutputDir"),
                )
                fixture.device.dumpWindowHierarchy(java.io.File(output, "photo-picker.xml"))
                val thumbnails = fixture.device.wait(
                    Until.findObjects(
                        By.pkg(picker).desc(
                            Pattern.compile("(?i).*(Photo|Фото|Фотография).*"),
                        ),
                    ),
                    10_000,
                )
                assertTrue(checkNotNull(thumbnails).size >= 3)
                thumbnails.take(3).forEach { it.click() }
                Log.i("PhotoPickerUiTests", "Selected thumbnails: ${thumbnails.size}")
                fixture.screenshot("design-photo-picker-selected")
                val confirm = fixture.device.wait(
                    Until.findObject(By.text(Pattern.compile("(Add|Добавить|Done|Готово).*"))),
                    5_000,
                )
                checkNotNull(confirm).click()
                fixture.waitTag("upload-sheet")
                fixture.waitText("Видно участникам встречи")
                compose.waitUntil(15_000) {
                    compose.onAllNodes(
                        hasContentDescription(fixture.context.getString(R.string.photo_preview)),
                    ).fetchSemanticsNodes().isNotEmpty()
                }
                compose.onNodeWithText("Подпись").assertDoesNotExist()
                compose.onNodeWithTag("home-navigation").assertDoesNotExist()
                compose.onAllNodes(
                    hasContentDescription(fixture.context.getString(R.string.photo_preview)),
                    useUnmergedTree = true,
                )[0].assertWidthIsEqualTo(176.dp).assertHeightIsEqualTo(132.dp)
                fixture.screenshot("design-upload-photo")
                compose.onNodeWithTag("upload-photo-carousel").performTouchInput { swipeLeft() }
                fixture.screenshot("design-upload-photo-scrolled")
                compose.onNodeWithText(fixture.context.getString(R.string.upload_more))
                    .performScrollTo().performClick()
                assertTrue(fixture.device.wait(Until.hasObject(By.pkg(picker)), 10_000))
                fixture.device.pressBack()
                fixture.waitTag("upload-sheet")
                compose.onNodeWithText("Отправить").performScrollTo()
                    .performSemanticsAction(SemanticsActions.OnClick) { it() }
                fixture.waitAbsent("upload-sheet")
                fixture.waitTag("message-composer")
                compose.waitUntil(15_000) {
                    compose.onAllNodes(
                        hasContentDescription(fixture.context.getString(R.string.experience_photo)),
                    ).fetchSemanticsNodes().isNotEmpty()
                }
            }
        } finally {
            photos.forEach { fixture.context.contentResolver.delete(it, null, null) }
        }
    }

    private fun createPhoto(index: Int): Uri {
        val resolver = fixture.context.contentResolver
        val photo = checkNotNull(
            resolver.insert(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, "somewhere-qa-photo-$index.png")
                    put(MediaStore.MediaColumns.MIME_TYPE, "image/png")
                    put(MediaStore.MediaColumns.IS_PENDING, 1)
                },
            ),
        )
        val bitmap = Bitmap.createBitmap(256, 256, Bitmap.Config.ARGB_8888)
        try {
            bitmap.eraseColor(Color.rgb(130 + index * 20, 108, 164))
            checkNotNull(resolver.openOutputStream(photo)).use {
                check(bitmap.compress(Bitmap.CompressFormat.PNG, 100, it))
            }
            resolver.update(
                photo,
                ContentValues().apply {
                    put(MediaStore.MediaColumns.IS_PENDING, 0)
                },
                null,
                null,
            )
            return photo
        } finally {
            bitmap.recycle()
        }
    }
}
