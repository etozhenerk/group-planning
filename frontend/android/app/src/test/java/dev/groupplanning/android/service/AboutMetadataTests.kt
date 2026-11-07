package dev.groupplanning.android.service

import dev.groupplanning.android.ui.service.AboutMetadata
import org.junit.Assert.assertEquals
import org.junit.Test

class AboutMetadataTests {
    @Test
    fun completeVersionAndMissingBuildKeepTheirMeaning() {
        assertEquals(
            AboutMetadata.Release("1.0.0-rc.2", "42"),
            AboutMetadata.from("1.0.0-rc.2", "42"),
        )
        assertEquals(AboutMetadata.Local, AboutMetadata.from(null, null))
        assertEquals(AboutMetadata.Local, AboutMetadata.from(" ", "0"))
        assertEquals(AboutMetadata.Release("1.0.0", null), AboutMetadata.from("1.0.0", "0"))
    }
}
