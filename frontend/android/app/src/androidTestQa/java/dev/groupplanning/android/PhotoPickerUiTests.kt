package dev.groupplanning.android

import android.content.ContentValues
import android.graphics.Bitmap
import android.graphics.Color
import android.provider.MediaStore
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import java.util.regex.Pattern
import org.junit.Before
import org.junit.Rule
import org.junit.Test

class PhotoPickerUiTests {
    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test fun systemPhotoPickerPublishesSelectedPhotoWithoutCaption() {
        val resolver = fixture.context.contentResolver
        val photo = checkNotNull(
            resolver.insert(
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, "somewhere-qa-photo.png")
                    put(MediaStore.MediaColumns.MIME_TYPE, "image/png")
                    put(MediaStore.MediaColumns.IS_PENDING, 1)
                },
            ),
        )
        try {
            val bitmap = Bitmap.createBitmap(256, 256, Bitmap.Config.ARGB_8888)
            bitmap.eraseColor(Color.rgb(130, 108, 164))
            checkNotNull(resolver.openOutputStream(photo)).use {
                check(bitmap.compress(Bitmap.CompressFormat.PNG, 100, it))
            }
            bitmap.recycle()
            resolver.update(
                photo,
                ContentValues().apply {
                    put(MediaStore.MediaColumns.IS_PENDING, 0)
                },
                null,
                null,
            )
            fixture.launch("design").use {
                fixture.waitText("Настолки у Саши")
                compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
                fixture.waitTag("meeting-add")
                compose.onNodeWithTag("meeting-add").performClick()
                compose.onNodeWithTag("add-photo").performClick()
                val thumbnail = fixture.device.wait(
                    Until.findObject(By.desc(Pattern.compile("(?i)(Photo|Фото|Фотография).*"))),
                    10_000,
                )
                checkNotNull(thumbnail).click()
                val confirm = fixture.device.wait(
                    Until.findObject(By.text(Pattern.compile("(Add|Добавить).*"))),
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
                fixture.screenshot("design-upload-photo")
                compose.onNodeWithText("Отправить").performScrollTo()
                    .performSemanticsAction(SemanticsActions.OnClick) { it() }
                fixture.waitText("Отправлено")
                fixture.device.pressBack()
                fixture.waitTag("message-composer")
                compose.waitUntil(15_000) {
                    compose.onAllNodes(
                        hasContentDescription(fixture.context.getString(R.string.experience_photo)),
                    ).fetchSemanticsNodes().isNotEmpty()
                }
            }
        } finally {
            resolver.delete(photo, null, null)
        }
    }
}
