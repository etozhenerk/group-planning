package dev.groupplanning.android.media

import dev.groupplanning.android.ui.media.PhotoStackNavigation
import org.junit.Assert.assertEquals
import org.junit.Test

class PhotoStackNavigationTests {
    @Test fun eitherStackSwipeAdvancesAndLastPhotoRestarts() {
        for (direction in listOf(-1, 1)) {
            assertEquals(1, PhotoStackNavigation.target(0, direction, 3, true))
            assertEquals(2, PhotoStackNavigation.target(1, direction, 3, true))
            assertEquals(0, PhotoStackNavigation.target(2, direction, 3, true))
        }
    }

    @Test fun fullscreenAndKeyboardPreservePreviousAndNext() {
        assertEquals(0, PhotoStackNavigation.target(1, -1, 3, false))
        assertEquals(2, PhotoStackNavigation.target(1, 1, 3, false))
        assertEquals(2, PhotoStackNavigation.target(0, -1, 3, false))
        assertEquals(0, PhotoStackNavigation.target(2, 1, 3, false))
    }

    @Test fun emptyAndSinglePhotoStayAtZero() {
        for (count in 0..1) {
            assertEquals(0, PhotoStackNavigation.target(0, 1, count, true))
            assertEquals(0, PhotoStackNavigation.target(0, -1, count, false))
        }
    }
}
