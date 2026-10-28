package dev.groupplanning.android.support

import dev.groupplanning.android.state.SupportDescriptionIssue
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class SupportDescriptionIssueTests {
    @Test fun whitespaceDoesNotMakeAShortDescriptionValid() {
        assertEquals(
            SupportDescriptionIssue.TooShort,
            SupportDescriptionIssue.inspect(" 123456789\n"),
        )
        assertNull(SupportDescriptionIssue.inspect(" 1234567890\n"))
    }

    @Test fun emojiUseTheSameUnicodeLimitAsTheApi() {
        assertEquals(
            SupportDescriptionIssue.TooShort,
            SupportDescriptionIssue.inspect("🙂".repeat(9)),
        )
        assertNull(SupportDescriptionIssue.inspect("🙂".repeat(10)))
        assertNull(SupportDescriptionIssue.inspect("🙂".repeat(3000)))
        assertEquals(
            SupportDescriptionIssue.TooLong,
            SupportDescriptionIssue.inspect("🙂".repeat(3001)),
        )
    }
}
