package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.PageBack
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette
import kotlinx.coroutines.launch

@Composable
internal fun DocumentReader(cookies: Boolean, back: () -> Unit, open: (String) -> Unit) {
    val scroll = rememberScrollState()
    val sections = legalSections(cookies)
    val offsets = remember { mutableStateMapOf<Int, Int>() }
    var bodyTop by remember { mutableIntStateOf(0) }
    var indexOpen by remember { mutableStateOf(false) }
    var opened by remember { mutableStateOf(false) }
    val trigger = remember { FocusRequester() }
    val scope = rememberCoroutineScope()
    val motion = LocalMotionEnabled.current
    LaunchedEffect(indexOpen) { if (!indexOpen && opened) trigger.requestFocus() }
    Column(Modifier.fillMaxSize()) {
        Row(
            Modifier.fillMaxWidth().padding(horizontal = DesignTokens.spaceS20)
                .padding(bottom = DesignTokens.spaceS12),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            PageBack(close = back)
            Surface(
                {
                    opened = true
                    indexOpen = true
                },
                Modifier.focusRequester(trigger).testTag("document-index-trigger"),
                color = Color.Transparent,
            ) {
                Row(
                    Modifier.heightIn(min = DesignTokens.targetAndroid),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
                ) {
                    ServiceIcon(ChatSymbol.List, DesignTokens.spaceS20, Palette.muted)
                    Text(
                        stringResource(R.string.document_contents),
                        fontSize = DesignTokens.typographySizeSmall,
                        fontWeight = FontWeight.Normal,
                        color = Palette.muted,
                    )
                }
            }
        }
        Column(
            Modifier.weight(1f).fillMaxWidth()
                .onGloballyPositioned { bodyTop = it.positionInRoot().y.toInt() }
                .verticalScroll(scroll).testTag("document-scroll")
                .padding(horizontal = DesignTokens.spaceS20)
                .padding(
                    top = DesignTokens.spaceS12 + DesignTokens.spaceS2,
                    bottom = DesignTokens.spaceS40,
                ),
        ) {
            Text(
                stringResource(if (cookies) R.string.cookies_title else R.string.privacy_title),
                Modifier.semantics { heading() },
                fontSize = DesignTokens.componentMobileAboutDocumentTitleSize.value.sp,
                lineHeight = DesignTokens.componentMobileAboutDocumentTitleLineHeight.value.sp,
                letterSpacing = -DesignTokens.componentMobileAboutDocumentTitleTracking.value.sp,
                fontWeight = FontWeight(DesignTokens.componentMobileServiceTitleWeight.toInt()),
            )
            Spacer(Modifier.height(DesignTokens.spaceS24))
            DocumentStatus()
            Spacer(Modifier.height(DesignTokens.spaceS24 + DesignTokens.spaceS6))
            sections.forEachIndexed { index, (title, text) ->
                LegalContent(
                    title,
                    text,
                    Modifier.onGloballyPositioned {
                        offsets[index] = it.positionInRoot().y.toInt() + scroll.value - bodyTop
                    }.padding(bottom = DesignTokens.spaceS32 + DesignTokens.spaceS2),
                )
            }
            TextButton({ open(if (cookies) "privacy" else "cookies") }) {
                Text(
                    stringResource(if (cookies) R.string.privacy_title else R.string.cookies_title),
                    fontSize = DesignTokens.typographySizeSmall,
                    color = Palette.accent,
                )
            }
        }
    }
    if (indexOpen) {
        DocumentIndex(sections, { indexOpen = false }) { index ->
            scope.launch {
                val destination = offsets[index] ?: return@launch
                if (motion) scroll.animateScrollTo(destination) else scroll.scrollTo(destination)
            }
        }
    }
}
