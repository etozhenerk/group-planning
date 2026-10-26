package dev.groupplanning.android.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetValue
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun ActionSheet(
    title: String,
    close: () -> Unit,
    modifier: Modifier = Modifier,
    canClose: Boolean = true,
    content: @Composable ColumnScope.() -> Unit,
) {
    val sheet = rememberModalBottomSheetState(
        skipPartiallyExpanded = true,
        confirmValueChange = { it != SheetValue.Hidden || canClose },
    )
    ModalBottomSheet(
        onDismissRequest = { if (canClose) close() },
        sheetState = sheet,
        containerColor = DesignTokens.colorSurface,
        contentColor = DesignTokens.colorText,
        shape = RoundedCornerShape(
            topStart = DesignTokens.radiusSheet,
            topEnd = DesignTokens.radiusSheet,
        ),
        modifier = modifier.statusBarsPadding().padding(top = DesignTokens.spaceS12),
    ) {
        Column(Modifier.fillMaxWidth().imePadding().testTag("chat-action-sheet")) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = DesignTokens.spaceS20),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
            ) {
                Text(
                    title,
                    Modifier.weight(1f).semantics { heading() },
                    fontSize = DesignTokens.typographySizeMobileActionHeading,
                    lineHeight = DesignTokens.typographySizeMobileActionHeading *
                        DesignTokens.componentActionHeadingLineHeight,
                    letterSpacing = with(LocalDensity.current) {
                        -DesignTokens.componentActionHeadingTrackingMobile.toSp()
                    },
                    fontWeight = FontWeight(DesignTokens.typographyWeightBold.toInt()),
                )
                val closeLabel = stringResource(R.string.experience_close)
                IconButton(
                    close,
                    Modifier.size(DesignTokens.targetAndroid).semantics {
                        contentDescription = closeLabel
                    }.testTag("close-action-sheet"),
                    enabled = canClose,
                ) { AppIcon(R.drawable.ic_close) }
            }
            Column(
                Modifier.fillMaxWidth().verticalScroll(rememberScrollState())
                    .padding(DesignTokens.spaceS20),
                verticalArrangement = Arrangement.spacedBy(DesignTokens.componentActionFieldGap),
                content = content,
            )
        }
    }
}
