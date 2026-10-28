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
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
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
        if (previous == null) {
            close()
        } else {
            history = history.dropLast(1)
            navigate(previous)
        }
    }
    Dialog(back, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(Modifier.fillMaxSize().testTag("service-page"), color = Palette.background) {
            Box(Modifier.fillMaxSize().safeDrawingPadding()) {
                Column {
                    MeetingsHeader()
                    TextButton(back, Modifier.padding(start = 8.dp, top = 28.dp)) {
                        Text(
                            stringResource(R.string.experience_back),
                            fontSize = DesignTokens.typographySizeSmall,
                        )
                    }
                    if (page == "support" &&
                        support != null
                    ) {
                        SupportForm(support, { go("privacy") }, close)
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
