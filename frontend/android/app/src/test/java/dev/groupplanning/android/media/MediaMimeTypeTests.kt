package dev.groupplanning.android.media

import dev.groupplanning.android.data.media.MediaMimeType
import org.junit.Assert.assertEquals
import org.junit.Test

class MediaMimeTypeTests {
    @Test fun documentProvidersWithoutSpecificMimeStillAllowPdfSelection() {
        assertEquals("application/pdf", MediaMimeType.resolved("Билеты.PDF", null))
        assertEquals(
            "application/pdf",
            MediaMimeType.resolved("Билеты.pdf", "application/octet-stream"),
        )
        assertEquals("application/octet-stream", MediaMimeType.resolved("unknown.data", null))
    }

    @Test fun specificProviderMimeIsNotOverriddenByRenamedExtension() {
        assertEquals("text/plain", MediaMimeType.resolved("renamed.pdf", "text/plain"))
        assertEquals(
            "application/pdf",
            MediaMimeType.resolved("file", "application/pdf; charset=UTF-8"),
        )
    }
}
