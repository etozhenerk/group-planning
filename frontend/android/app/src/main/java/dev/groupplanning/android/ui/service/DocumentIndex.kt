package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ActionSheet
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun DocumentIndex(
    sections: List<Pair<Int, Int?>>,
    close: () -> Unit,
    choose: (Int) -> Unit,
) {
    var pending by remember { mutableStateOf<Int?>(null) }
    var closing by remember { mutableStateOf(false) }
    ActionSheet(
        stringResource(R.string.document_contents),
        {
            val selected = pending
            close()
            selected?.let(choose)
        },
        modifier = Modifier.testTag("document-index-sheet"),
        animateClose = true,
        closeRequested = closing,
    ) {
        Column(Modifier.fillMaxWidth().padding(bottom = DesignTokens.spaceS12)) {
            sections.forEachIndexed { index, (title, _) ->
                Surface({
                    pending = index
                    closing = true
                }, color = Palette.surface) {
                    Box(
                        Modifier.fillMaxWidth()
                            .heightIn(min = DesignTokens.componentMobileAboutIndexRowHeight)
                            .padding(vertical = DesignTokens.spaceS12 + DesignTokens.spaceS2),
                    ) {
                        Text(
                            stringResource(title),
                            fontSize = DesignTokens.typographySizeButton,
                            lineHeight =
                            DesignTokens.componentMobileAboutIndexRowLineHeight.value.sp,
                        )
                    }
                }
                if (index != sections.lastIndex) HorizontalDivider(color = DesignTokens.colorLine)
            }
        }
    }
}
