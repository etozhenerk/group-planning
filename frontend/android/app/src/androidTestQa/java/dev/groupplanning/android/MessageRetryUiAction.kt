package dev.groupplanning.android

import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.test.ComposeTimeoutException
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.performSemanticsAction
import org.junit.Assert.assertTrue

internal fun ComposeTestRule.retryCurrentMessage(beforeClick: () -> Unit) {
    var actionInvoked = false
    var lastLookupFailure: AssertionError? = null
    try {
        waitUntil(15_000) {
            try {
                onNodeWithTag("message-retry", useUnmergedTree = true)
                    .assertIsDisplayed().assertIsEnabled()
                    .performSemanticsAction(SemanticsActions.OnClick) { click ->
                        actionInvoked = true
                        beforeClick()
                        assertTrue(click())
                    }
                true
            } catch (failure: AssertionError) {
                // Recreating an Activity can resume sending before its retry control settles.
                // Only lookups may wait; an actual click is performed once and must succeed.
                if (actionInvoked) throw failure
                lastLookupFailure = failure
                false
            }
        }
    } catch (failure: ComposeTimeoutException) {
        lastLookupFailure?.let(failure::addSuppressed)
        throw failure
    }
}
