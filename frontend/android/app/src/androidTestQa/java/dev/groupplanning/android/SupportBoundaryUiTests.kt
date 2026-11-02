package dev.groupplanning.android

import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasAnyAncestor
import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isPopup
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextClearance
import androidx.compose.ui.test.performTextInput
import androidx.lifecycle.ViewModelProvider
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import dev.groupplanning.android.data.api.models.FeedbackReceipt
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import dev.groupplanning.android.state.AppViewModel
import dev.groupplanning.android.state.SupportState
import java.io.File
import java.time.Instant
import java.util.UUID
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

/** TC-SUPPORT-B8F9FF7E: UI boundaries; the configured Go fixture accepts the real HTTP requests. */
class SupportBoundaryUiTests {
    @get:Rule(order = 0)
    val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule(order = 1)
    val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Before fun configure() {
        fixture.configure()
        QaChatProbe.reset()
    }

    @Test fun nineAfterTrimAndThreeThousandAndOneCodePointsNeverReachTheApi() {
        fixture.launch("calendar").use { activity ->
            openForm()
            selectContext(activity)
            assertInvalid(activity, 9, R.string.support_description_short)
            assertInvalid(activity, 3001, R.string.support_description_long)
        }
    }

    @Test fun tenAndThreeThousandCodePointsGetDistinctRealReceiptsOnCleanForms() {
        fixture.launch("calendar").use { activity ->
            openForm()
            selectContext(activity)
            val first = assertAccepted(activity, 10, 1)
            compose.onNodeWithText(fixture.context.getString(R.string.support_another))
                .performScrollTo().performClick()
            fixture.waitTag("support-description")
            assertEquals("", editableDescription())
            assertNull(state(activity).receipt)
            selectContext(activity)
            val second = assertAccepted(activity, 3000, 2)
            assertNotEquals(first.id, second.id)
            assertNotEquals(first.reference, second.reference)
            compose.onNodeWithTag("support-success-back").performClick()
            fixture.waitAbsent("service-page")
            compose.onNodeWithTag("home-profile").assertIsSelected()
        }
    }

    private fun openForm() {
        fixture.waitTag("meetings-list")
        compose.onNodeWithTag("home-profile").performClick()
        fixture.waitText("Яндекс ID")
        compose.onNodeWithText("Сообщить о проблеме").performScrollTo().performClick()
        fixture.waitTag("support-description")
        assertEquals("", editableDescription())
    }

    private fun selectContext(activity: ActivityScenario<MainActivity>) {
        val insideForm = hasAnyAncestor(hasTestTag("service-page"))
        compose.onNode(
            hasText(fixture.context.getString(R.string.support_idea)) and insideForm,
        ).performScrollTo().performClick()
        val label = when (state(activity).screen) {
            "profile" -> R.string.screen_profile
            "other" -> R.string.screen_other
            else -> error("Expected a clean support form opened from the profile")
        }
        compose.onNode(
            hasText(fixture.context.getString(label)) and insideForm,
        ).performScrollTo().performClick()
        compose.onNode(
            hasText(fixture.context.getString(R.string.screen_chat)) and hasAnyAncestor(isPopup()),
        ).performClick()
        assertEquals("idea", state(activity).kind)
        assertEquals("meeting_chat", state(activity).screen)
    }

    private fun assertInvalid(activity: ActivityScenario<MainActivity>, length: Int, error: Int) {
        val value = enterDescription(length)
        submit()
        fixture.waitTag("support-description-error")
        hideKeyboard()
        compose.onNodeWithTag("support-description-error").performScrollTo()
            .assertTextContains(fixture.context.getString(error)).assertIsDisplayed()
        assertEquals(value, editableDescription())
        val actual = state(activity)
        assertEquals(value, actual.description)
        assertEquals("idea", actual.kind)
        assertEquals("meeting_chat", actual.screen)
        assertNull(actual.receipt)
        compose.onNodeWithText("Спасибо, что рассказали").assertDoesNotExist()
        assertEquals(0, postCount())
        record(length, false, actual, value)
    }

    private fun assertAccepted(
        activity: ActivityScenario<MainActivity>,
        length: Int,
        expectedPosts: Int,
    ): FeedbackReceipt {
        val value = enterDescription(length)
        assertNull(state(activity).receipt)
        assertEquals(expectedPosts - 1, postCount())
        submit()
        fixture.waitText("Спасибо, что рассказали")
        // Read only the DTO produced by the real HTTP response; do not edit or submit the model.
        val actual = state(activity)
        val receipt = checkNotNull(actual.receipt)
        assertEquals("accepted", receipt.status)
        assertNotEquals(UUID(0, 0), receipt.id)
        assertTrue(receipt.reference.isNotBlank())
        compose.onNodeWithText(
            fixture.context.getString(R.string.support_reference, receipt.reference),
        ).performScrollTo().assertIsDisplayed()
        assertEquals(expectedPosts, postCount())
        assertEquals("", actual.email)
        assertNull(actual.screenshot)
        assertTrue(!actual.diagnostics)
        record(length, true, actual, value)
        return receipt
    }

    private fun enterDescription(length: Int): String {
        val value = "\n  ${"🙂".repeat(length)}  \n"
        assertEquals(length, value.trim().codePointCount(0, value.trim().length))
        val input = compose.onNodeWithTag("support-description")
        input.performScrollTo().performClick().performTextClearance()
        // One IME semantic insertion also exercises surrogate pairs; no thousands of ADB keys.
        input.performTextInput(value)
        assertEquals(value, editableDescription())
        hideKeyboard()
        return value
    }

    private fun submit() = compose.onNodeWithText("Отправить обращение")
        .performScrollTo().performClick()

    private fun hideKeyboard() {
        if (compose.onAllNodes(hasTestTag("support-done")).fetchSemanticsNodes().isEmpty()) return
        compose.onNodeWithTag("support-done").performClick()
        fixture.waitAbsent("support-done")
    }

    private fun editableDescription(): String = compose.onNodeWithTag("support-description")
        .fetchSemanticsNode().config[SemanticsProperties.EditableText].text

    private fun postCount(): Int = QaChatProbe.requests.count {
        it == "POST /api/v1/support/feedback"
    }

    private fun state(activity: ActivityScenario<MainActivity>): SupportState {
        var result: SupportState? = null
        activity.onActivity {
            val model = ViewModelProvider(it)[AppViewModel::class.java]
            result = checkNotNull(model.support).state.value
        }
        return checkNotNull(result)
    }

    private fun record(length: Int, accepted: Boolean, actual: SupportState, value: String) {
        fixture.screenshot("support-boundary-$length")
        val output = checkNotNull(
            InstrumentationRegistry.getArguments().getString("additionalTestOutputDir"),
        )
        File(output, "support-boundary-$length.json").writeText(
            JSONObject().put("at", Instant.now().toString()).put("trimmedCodePoints", length)
                .put("inputUtf16Units", value.length).put("accepted", accepted)
                .put("kind", actual.kind).put("screen", actual.screen)
                .put("postCount", postCount())
                .put("descriptionRetained", actual.description == value)
                .put("inputPath", "Compose performTextInput / IME semantics")
                .put("receiptId", actual.receipt?.id?.toString() ?: JSONObject.NULL)
                .put("reference", actual.receipt?.reference ?: JSONObject.NULL)
                .put("receiptStatus", actual.receipt?.status ?: JSONObject.NULL).toString(2) + "\n",
        )
    }
}
