package dev.groupplanning.android.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetValue
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveableStateHolder
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.feed.LocalChatPresentation
import dev.groupplanning.android.ui.motion.LocalMotionEnabled
import dev.groupplanning.android.ui.theme.DesignTokens
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ActionSheet(
    title: String,
    close: () -> Unit,
    modifier: Modifier = Modifier,
    canClose: Boolean = true,
    animateClose: Boolean = false,
    canDismiss: Boolean = canClose,
    actions: (@Composable ColumnScope.() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val contentState = rememberSaveableStateHolder()
    val presentation = LocalChatPresentation.current
    LaunchedEffect(Unit) { presentation.dismiss() }
    val window = LocalWindowInfo.current.containerSize
    val height = with(LocalDensity.current) { window.height.toDp() }
    val reserve = if (height < DesignTokens.breakpointChatCompactHeight) {
        DesignTokens.componentMobileSheetCompactTopReserve
    } else {
        DesignTokens.componentMobileSheetTopReserve
    }
    val sheet = rememberModalBottomSheetState(
        skipPartiallyExpanded = true,
        confirmValueChange = {
            if (it == SheetValue.Hidden && !canDismiss) {
                if (canClose) close()
                false
            } else {
                true
            }
        },
    )
    val closeScope = rememberCoroutineScope()
    val motion = LocalMotionEnabled.current
    var closing by remember { mutableStateOf(false) }
    val requestClose: () -> Unit = {
        if (canClose && !closing) {
            if (animateClose && motion) {
                closing = true
                closeScope.launch {
                    sheet.hide()
                    close()
                }
            } else {
                close()
            }
        }
    }
    CompositionLocalProvider(LocalMobileSheet provides true) {
        ModalBottomSheet(
            onDismissRequest = { if (canClose) close() },
            sheetState = sheet,
            containerColor = DesignTokens.colorSurface,
            contentColor = DesignTokens.colorText,
            shape = RoundedCornerShape(
                topStart = DesignTokens.componentMobileSheetRadius,
                topEnd = DesignTokens.componentMobileSheetRadius,
            ),
            modifier = modifier.statusBarsPadding().padding(top = reserve),
        ) {
            Column(Modifier.fillMaxWidth().imePadding().testTag("chat-action-sheet")) {
                Row(
                    Modifier.fillMaxWidth().heightIn(
                        min = DesignTokens.componentMobileSheetHeaderHeight,
                    )
                        .padding(horizontal = DesignTokens.componentMobileSheetGrabInsetInline),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
                ) {
                    Text(
                        title,
                        Modifier.weight(1f).semantics { heading() },
                        fontSize = DesignTokens.typographySizeMobileSheetTitle,
                        lineHeight = DesignTokens.typographySizeMobileSheetTitle *
                            DesignTokens.typographyLineHeightMobileSheetTitle,
                        fontWeight = FontWeight(
                            DesignTokens.typographyWeightMobileSheetTitle.toInt(),
                        ),
                    )
                    val closeLabel = stringResource(R.string.experience_close)
                    IconButton(
                        requestClose,
                        Modifier.size(DesignTokens.targetAndroid).semantics {
                            contentDescription = closeLabel
                        }.testTag("close-action-sheet"),
                        enabled = canClose && !closing,
                    ) { AppIcon(R.drawable.ic_close) }
                }
                contentState.SaveableStateProvider(title) {
                    Column(
                        Modifier.weight(1f, fill = false).fillMaxWidth()
                            .verticalScroll(rememberScrollState()).padding(
                                start = DesignTokens.componentMobileSheetContentInsetInline,
                                end = DesignTokens.componentMobileSheetContentInsetInline,
                                top = DesignTokens.componentMobileSheetContentInsetTop,
                                bottom = DesignTokens.componentMobileSheetContentInsetBottom,
                            ),
                        verticalArrangement = Arrangement.spacedBy(
                            DesignTokens.componentMobileFormGroupGap,
                        ),
                        content = content,
                    )
                }
                if (actions != null) {
                    HorizontalDivider(color = DesignTokens.colorLine)
                    Column(
                        Modifier.fillMaxWidth().padding(
                            start = DesignTokens.componentMobileSheetContentInsetInline,
                            end = DesignTokens.componentMobileSheetContentInsetInline,
                            top = DesignTokens.componentMobileSheetFooterInsetBlock,
                            bottom = DesignTokens.componentMobileSheetFooterInsetBottom,
                        ),
                        verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
                        content = actions,
                    )
                }
            }
        }
    }
}
