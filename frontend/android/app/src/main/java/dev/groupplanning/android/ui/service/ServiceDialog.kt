package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import dev.groupplanning.android.R
import dev.groupplanning.android.state.SupportViewModel
import dev.groupplanning.android.ui.components.PageBack
import dev.groupplanning.android.ui.meetings.MeetingsHeader
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
                    Column {
                        if (page != "help" && page != "support") MeetingsHeader()
                        if (page != "help" && page != "support") {
                            Box(
                                Modifier.padding(
                                    start = DesignTokens.spaceS20,
                                    top = DesignTokens.spaceS24,
                                ),
                            ) {
                                PageBack(close = back)
                            }
                        }
                        if (page == "support" &&
                            support != null
                        ) {
                            SupportForm(support, { go("privacy") }, back, {
                                history = history.filter { it != "support" && it != "help" }
                                navigate("help")
                            })
                        } else if (page == "help") {
                            Column(Modifier.verticalScroll(rememberScrollState())) {
                                ServiceScreenHeader(
                                    stringResource(R.string.help_title_new),
                                    back = back,
                                )
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
                        } else {
                            Column(
                                Modifier.verticalScroll(rememberScrollState()).padding(
                                    start = 20.dp,
                                    end = 20.dp,
                                    top = 10.dp,
                                    bottom = 24.dp,
                                ),
                                verticalArrangement = Arrangement.spacedBy(24.dp),
                            ) {
                                val title = when (page) {
                                    "about" -> R.string.about_title
                                    "privacy" -> R.string.privacy_title
                                    "cookies" -> R.string.cookies_title
                                    else -> R.string.help_heading
                                }
                                Text(
                                    stringResource(title),
                                    fontSize = 28.sp,
                                    fontWeight = FontWeight.Bold,
                                )
                                when (page) {
                                    "about" -> {
                                        Text(
                                            stringResource(R.string.service_tagline),
                                            fontSize = 13.sp,
                                            color = Palette.muted,
                                        )
                                        AboutContent { go("support") }
                                    }
                                    "privacy", "cookies" -> LegalContent(page == "cookies", go)
                                    else -> {
                                        Text(
                                            stringResource(R.string.help_intro),
                                            fontSize = 13.sp,
                                            color = Palette.muted,
                                        )
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
}
