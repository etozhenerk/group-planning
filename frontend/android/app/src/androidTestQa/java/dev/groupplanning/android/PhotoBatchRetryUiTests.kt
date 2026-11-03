package dev.groupplanning.android

import android.net.Uri
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasProgressBarRangeInfo
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTouchInput
import androidx.compose.ui.test.swipeLeft
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import java.util.regex.Pattern
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class PhotoBatchRetryUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
        QaPhotoBatchProbe.arm()
    }

    @Test fun partialCommitKeepsFailedPhotoAcrossRecreationAndDoesNotRepeatSuccess() {
        val photos = mutableListOf<Uri>()
        try {
            repeat(3) { photos += createQaTestPhoto(fixture.context, it) }
            fixture.launch("design").use { activity ->
                fixture.waitText("Настолки у Саши")
                compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
                fixture.waitTag("meeting-add")
                val draft = "Черновик до частичной отправки фото"
                compose.onNodeWithTag("message-composer").performTextInput(draft)
                fixture.device.pressBack()
                compose.onNodeWithTag("meeting-add").performClick()
                compose.onNodeWithTag("add-photo").performClick()
                val picker = Pattern.compile(".*(?:photopicker|providers\\.media).*")
                assertTrue(fixture.device.wait(Until.hasObject(By.pkg(picker)), 10_000))
                // ActivityScenario.recreate() first forces RESUMED, which is impossible
                // while the external picker owns focus. Request the real recreation directly.
                var previous: MainActivity? = null
                activity.onActivity {
                    previous = it
                    it.recreate()
                }
                compose.waitUntil(10_000) {
                    var replaced = false
                    try {
                        activity.onActivity { replaced = it !== previous }
                    } catch (_: IllegalStateException) {
                        // The old instance can already be destroyed before the replacement starts.
                    }
                    replaced
                }
                assertTrue(fixture.device.wait(Until.hasObject(By.pkg(picker)), 10_000))
                val thumbnails = checkNotNull(
                    fixture.device.wait(
                        Until.findObjects(
                            By.pkg(picker).desc(Pattern.compile("(?i).*(Photo|Фото|Фотография).*")),
                        ),
                        10_000,
                    ),
                )
                assertTrue(thumbnails.size >= 3)
                thumbnails.take(3).forEach { it.click() }
                checkNotNull(
                    fixture.device.wait(
                        Until.findObject(
                            By.pkg(picker).text(Pattern.compile("(Add|Добавить|Done|Готово).*")),
                        ),
                        5_000,
                    ),
                ).click()
                fixture.waitTag("upload-sheet")
                val preview =
                    hasContentDescription(fixture.context.getString(R.string.photo_preview))
                compose.waitUntil(10_000) {
                    compose.onAllNodes(preview, useUnmergedTree = true)
                        .fetchSemanticsNodes().size >= 2
                }
                val remove = SemanticsMatcher("Remove selected photo") {
                    it.config.getOrNull(SemanticsProperties.ContentDescription)
                        ?.any { text -> text.startsWith("Убрать ") } == true
                }
                val initial = compose.onAllNodes(remove, useUnmergedTree = true)
                    .fetchSemanticsNodes()
                val removed = initial[1]
                    .config[SemanticsProperties.ContentDescription].single().removePrefix("Убрать ")
                compose.onNodeWithTag("upload-photo-carousel").performTouchInput { swipeLeft() }
                val visibleAfterSwipe = compose.onAllNodes(remove, useUnmergedTree = true)
                    .fetchSemanticsNodes()
                val selectedNames = (initial + visibleAfterSwipe).map {
                    it.config[SemanticsProperties.ContentDescription].single()
                }.toSet()
                assertEquals(3, selectedNames.size)
                compose.onNode(hasContentDescription("Убрать $removed"), useUnmergedTree = true)
                    .performClick()
                val submit = compose.onNodeWithText("Отправить").performScrollTo()
                val readyWidth = submit.fetchSemanticsNode().boundsInRoot.width
                submit.performClick()
                compose.waitUntil(10_000) { QaPhotoBatchProbe.failureEntered }
                val progress = hasProgressBarRangeInfo(ProgressBarRangeInfo.Indeterminate)
                compose.onAllNodes(progress and hasAnyAncestor(hasTestTag("upload-sheet")))
                    .assertCountEquals(1)
                compose.onAllNodes(progress and hasAnyAncestor(hasTestTag("upload-photo-carousel")))
                    .assertCountEquals(0)
                val busyWidth = compose.onNode(
                    hasContentDescription("Отправить") and
                        hasAnyAncestor(hasTestTag("upload-sheet")),
                ).fetchSemanticsNode().boundsInRoot.width
                assertEquals(readyWidth, busyWidth, 1f)
                fixture.screenshot("photo-batch-general-progress")
                QaPhotoBatchProbe.releaseFailure()
                fixture.waitText(fixture.context.getString(R.string.upload_error))
                compose.onAllNodes(preview, useUnmergedTree = true).assertCountEquals(1)
                val moreTop = compose.onNodeWithText(
                    fixture.context.getString(R.string.upload_more),
                ).fetchSemanticsNode().boundsInRoot.top
                val retryTop = compose.onNodeWithText(fixture.context.getString(R.string.retry))
                    .fetchSemanticsNode().boundsInRoot.top
                assertEquals(moreTop, retryTop, 1f)
                fixture.screenshot("photo-batch-partial-error")
                activity.recreate()
                fixture.waitTag("upload-sheet")
                compose.onAllNodes(preview, useUnmergedTree = true).assertCountEquals(1)
                QaPhotoBatchProbe.allowRetry()
                compose.onNodeWithText(fixture.context.getString(R.string.retry))
                    .performScrollTo().performClick()
                fixture.waitAbsent("upload-sheet")
                compose.onNodeWithTag("message-composer").assertTextContains(draft)
                assertEquals(listOf(1, 2), QaPhotoBatchProbe.publishCounts.values.sorted())
                val feed = ChatReadLiveApi(fixture.context).request(
                    "design",
                    "meetings/deb00000-0000-4000-8000-000000000002/feed",
                ).getJSONArray("entries")
                val names = (0 until feed.length()).flatMap { index ->
                    val attachments = feed.getJSONObject(index).getJSONObject("payload")
                        .optJSONArray("attachments")
                    if (attachments == null) {
                        emptyList()
                    } else {
                        (0 until attachments.length()).map {
                            attachments.getJSONObject(it).getString("file_name")
                        }
                    }
                }
                assertEquals(2, names.size)
                assertTrue(removed !in names)
                fixture.screenshot("photo-batch-retry-completed")
            }
        } finally {
            QaPhotoBatchProbe.reset()
            photos.forEach { fixture.context.contentResolver.delete(it, null, null) }
        }
    }
}
