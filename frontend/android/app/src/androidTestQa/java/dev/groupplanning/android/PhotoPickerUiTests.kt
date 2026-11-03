package dev.groupplanning.android

import android.net.Uri
import android.util.Log
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertHeightIsEqualTo
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertWidthIsEqualTo
import androidx.compose.ui.test.hasContentDescription
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
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import java.util.regex.Pattern
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class PhotoPickerUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
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
                val removeMatcher = SemanticsMatcher("Remove selected photo") {
                    it.config.getOrNull(SemanticsProperties.ContentDescription)
                        ?.any { label -> label.startsWith("Убрать ") } == true
                }
                val remove = compose.onAllNodes(removeMatcher, useUnmergedTree = true)[0]
                remove.assertIsDisplayed()
                val removeNode = remove.fetchSemanticsNode()
                val removedName = removeNode.config[SemanticsProperties.ContentDescription]
                    .single().removePrefix("Убрать ")
                val image = compose.onAllNodes(
                    hasContentDescription(fixture.context.getString(R.string.photo_preview)),
                    useUnmergedTree = true,
                )[0].fetchSemanticsNode().boundsInRoot
                val target = removeNode.boundsInRoot
                assertTrue(target.width >= 48 * compose.density.density - 1)
                assertTrue(target.height >= 48 * compose.density.density - 1)
                assertTrue(target.top < image.top && target.right > image.right)
                fixture.screenshot("design-upload-photo-remove-target")
                remove.performClick()
                compose.onAllNodes(
                    hasContentDescription("Убрать $removedName"),
                    useUnmergedTree = true,
                ).assertCountEquals(0)
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
                val feed = ChatReadLiveApi(fixture.context).request(
                    "design",
                    "meetings/deb00000-0000-4000-8000-000000000002/feed",
                ).getJSONArray("entries")
                val sentNames = (0 until feed.length()).flatMap { index ->
                    val attachments = feed.getJSONObject(index).getJSONObject("payload")
                        .optJSONArray("attachments")
                    if (attachments == null) {
                        emptyList()
                    } else {
                        (0 until attachments.length()).map { item ->
                            attachments.getJSONObject(item).getString("file_name")
                        }
                    }
                }
                assertTrue("Only the two remaining photos publish", sentNames.size == 2)
                assertTrue(removedName !in sentNames)
            }
        } finally {
            photos.forEach { fixture.context.contentResolver.delete(it, null, null) }
        }
    }

    private fun createPhoto(index: Int): Uri = createQaTestPhoto(fixture.context, index)
}
