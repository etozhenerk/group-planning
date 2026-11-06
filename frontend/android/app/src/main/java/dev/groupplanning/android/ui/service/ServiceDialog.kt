package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import dev.groupplanning.android.R
import dev.groupplanning.android.state.SupportViewModel
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ServiceDialog(
    page: String,
    support: SupportViewModel?,
    navigate: (String) -> Unit,
    close: () -> Unit,
) {
    val pageState = rememberSaveableStateHolder()
    var history by rememberSaveable { mutableStateOf<List<String>>(emptyList()) }
    val go: (String) -> Unit = { target ->
        if (target != page) {
            history = history + page
            if (target == "idea") support?.edit { it.copy(kind = "idea") }
            navigate(if (target == "idea") "support" else target)
        }
    }
    val back = {
        val previous = history.lastOrNull()
        if (page == "support" && support?.state?.value?.receipt != null) {
            support.reset()
            history = history.filter { it != "support" && it != "help" }
            navigate("help")
        } else if (previous == null) {
            close()
        } else {
            history = history.dropLast(1)
            navigate(previous)
        }
    }
    Dialog(
        back,
        properties = DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false,
        ),
    ) {
        Surface(Modifier.fillMaxSize().testTag("service-page"), color = Palette.background) {
            Box(Modifier.fillMaxSize().safeDrawingPadding()) {
                pageState.SaveableStateProvider(page) {
                    when {
                        page == "support" && support != null -> {
                            SupportForm(support, { go("privacy") }, back, {
                                history = history.filter { it != "support" && it != "help" }
                                navigate("help")
                            })
                        }
                        page == "privacy" || page == "cookies" -> {
                            DocumentReader(page == "cookies", back, go)
                        }
                        else -> Column(Modifier.verticalScroll(rememberScrollState())) {
                            ServiceScreenHeader(
                                stringResource(
                                    if (page == "about") {
                                        R.string.about_title
                                    } else {
                                        R.string.help_title
                                    },
                                ),
                                back = back,
                            )
                            if (page == "about") {
                                AboutContent()
                            } else {
                                Column(
                                    Modifier.padding(horizontal = DesignTokens.spaceS20)
                                        .padding(bottom = DesignTokens.spaceS40),
                                ) {
                                    HelpContent {
                                        support?.edit { it.copy(kind = "question") }
                                        go("support")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
