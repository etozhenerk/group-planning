package dev.groupplanning.android

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Surface
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.test.assertContentDescriptionEquals
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.state.album.AlbumDownloadState
import dev.groupplanning.android.ui.media.AlbumActions
import dev.groupplanning.android.ui.theme.Palette
import dev.groupplanning.android.ui.theme.SomewhereTheme
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class AlbumActionLayoutTests {
    @get:Rule val appLocale: TestRule = QaAppLocaleRule()

    @get:Rule val compose = createComposeRule()
    private val fixture = InvitationUiFixture(compose)

    @Test fun narrowAndLargeTextKeepAdjacentEqualTargetsAndLoadingHeight() {
        val status = mutableStateOf(AlbumDownloadState.Idle)
        val scale = mutableStateOf(1f)
        compose.setContent {
            SomewhereTheme {
                val density = LocalDensity.current
                CompositionLocalProvider(
                    LocalDensity provides Density(density.density, scale.value),
                ) {
                    Surface(Modifier.fillMaxSize(), color = Palette.background) {
                        Box(Modifier.fillMaxSize()) {
                            Box(Modifier.width(320.dp).padding(20.dp)) {
                                AlbumActions(status.value, true, {}, {}, {}, {}, {})
                            }
                        }
                    }
                }
            }
        }
        for (fontScale in listOf(1f, 1.8f)) {
            compose.runOnIdle {
                scale.value = fontScale
                status.value = AlbumDownloadState.Idle
            }
            val before = compose.onNodeWithTag("album-save").fetchSemanticsNode().boundsInRoot
            for (state in listOf(
                AlbumDownloadState.Idle,
                AlbumDownloadState.Preparing,
                AlbumDownloadState.Saving,
            )) {
                compose.runOnIdle { status.value = state }
                val add = compose.onNodeWithTag("album-add").fetchSemanticsNode().boundsInRoot
                val save = compose.onNodeWithTag("album-save").fetchSemanticsNode().boundsInRoot
                assertEquals(add.top, save.top, 1f)
                assertEquals(add.height, save.height, 1f)
                assertEquals(add.width, save.width, 1f)
                assertEquals(before.height, save.height, 1f)
                assertTrue(add.right < save.left)
                fixture.screenshot("album-component-$fontScale-${state.name.lowercase()}")
            }
            compose.onNodeWithTag("album-save").assertIsNotEnabled()
        }
    }

    @Test fun feedbackActionsAndEmptyAlbumExposeOnlyAvailableActions() {
        val status = mutableStateOf(AlbumDownloadState.PermissionRequired)
        val hasPhotos = mutableStateOf(true)
        var settings = 0
        var acknowledged = 0
        var saves = 0
        compose.setContent {
            SomewhereTheme {
                AlbumActions(
                    status.value,
                    hasPhotos.value,
                    {},
                    { saves += 1 },
                    {},
                    { settings += 1 },
                    { acknowledged += 1 },
                )
            }
        }
        compose.onNodeWithTag(
            "album-save",
        ).assertContentDescriptionEquals("Настройки").performClick()
        assertEquals(1, settings)
        compose.runOnIdle { status.value = AlbumDownloadState.Partial }
        compose.onNodeWithText(
            "Часть фотографий могла сохраниться. Проверьте галерею перед повторной попыткой.",
        )
            .assertExists()
        compose.onNodeWithTag("album-save").assertContentDescriptionEquals("Понятно").performClick()
        assertEquals(1, acknowledged)
        assertEquals(0, saves)
        compose.runOnIdle { status.value = AlbumDownloadState.SaveFailed }
        compose.onNodeWithText("Не удалось сохранить фотографии.").assertExists()
        compose.onNodeWithTag(
            "album-save",
        ).assertContentDescriptionEquals("Повторить").performClick()
        assertEquals(1, saves)
        compose.runOnIdle {
            status.value = AlbumDownloadState.Idle
            hasPhotos.value = false
        }
        compose.onNodeWithTag("album-add").assertExists()
        compose.onNodeWithTag("album-save").assertDoesNotExist()
    }
}
