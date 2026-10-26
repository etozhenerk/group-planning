package dev.groupplanning.android

import android.content.ContentValues
import android.provider.MediaStore
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.junit4.createEmptyComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performSemanticsAction
import androidx.compose.ui.test.performTextInput
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class MediaUploadUiTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() = fixture.configure()

    @Test fun documentCaptionSurvivesRecreationAndPublishes() {
        val resolver = fixture.context.contentResolver
        val document = checkNotNull(
            resolver.insert(
                MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, "Правила игры.pdf")
                    put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                    put(MediaStore.MediaColumns.IS_PENDING, 1)
                },
            ),
        )
        try {
            checkNotNull(resolver.openOutputStream(document)).use {
                it.write("%PDF-1.4\n% Somewhere UI fixture\n%%EOF\n".toByteArray())
            }
            resolver.update(
                document,
                ContentValues().apply {
                    put(MediaStore.MediaColumns.IS_PENDING, 0)
                },
                null,
                null,
            )
            fixture.launch("design").use { activity ->
                fixture.waitText("Настолки у Саши")
                compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick()
                fixture.waitTag("meeting-add")
                compose.onNodeWithTag("meeting-add").performClick()
                compose.onNodeWithTag("add-file").performClick()
                checkNotNull(
                    fixture.device.wait(
                        Until.findObject(By.text("Правила игры.pdf")),
                        10_000,
                    ),
                ).click()
                fixture.waitTag("upload-sheet")
                fixture.screenshot("refresh-upload-selection")
                compose.waitUntil(30_000) {
                    compose.onAllNodes(hasTestTagPrefix()).fetchSemanticsNodes().isNotEmpty()
                }
                compose.onNodeWithTag("home-navigation").assertDoesNotExist()
                fixture.screenshot("design-upload-file")
                compose.onAllNodes(
                    hasTestTagPrefix(),
                )[0].performTextInput("Правила для нашей игры 🍒")
                fixture.device.pressBack()
                activity.recreate()
                fixture.waitTag("upload-sheet")
                compose.onAllNodes(hasTestTagPrefix())[0]
                    .assertTextContains("Правила для нашей игры 🍒")
                compose.onNodeWithText("Отправить").performScrollTo()
                    .performSemanticsAction(SemanticsActions.OnClick) { it() }
                fixture.waitText("Отправлено")
                fixture.screenshot("refresh-upload-sent")
                fixture.device.pressBack()
                fixture.waitAbsent("upload-sheet")
                fixture.waitText("Правила для нашей игры 🍒")
                fixture.waitText("Правила игры.pdf")
                fixture.screenshot("refresh-document-caption")
            }
        } finally {
            resolver.delete(document, null, null)
        }
    }

    private fun hasTestTagPrefix() = androidx.compose.ui.test.SemanticsMatcher(
        "Upload caption",
    ) { node ->
        node.config.getOrElse(androidx.compose.ui.semantics.SemanticsProperties.TestTag) { "" }
            .startsWith("upload-caption-")
    }
}
