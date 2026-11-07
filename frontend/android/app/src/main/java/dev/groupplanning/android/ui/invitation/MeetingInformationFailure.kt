package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingInformationFailure(retry: () -> Unit) {
    Surface(
        Modifier.fillMaxWidth().padding(vertical = DesignTokens.spaceS20),
        color = DesignTokens.colorBackground,
        shape = RoundedCornerShape(DesignTokens.spaceS20),
        border = BorderStroke(DesignTokens.spaceS1, DesignTokens.colorLine),
    ) {
        Column(
            Modifier.padding(
                horizontal = DesignTokens.spaceS20,
                vertical = DesignTokens.componentMobileInfoErrorInsetBlock,
            ),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(
                Modifier.padding(bottom = DesignTokens.spaceS24).size(DesignTokens.spaceS64)
                    .background(
                        DesignTokens.colorSurface,
                        RoundedCornerShape(DesignTokens.spaceS20),
                    ),
                contentAlignment = Alignment.Center,
            ) {
                ChatIcon(
                    ChatSymbol.Calendar,
                    Modifier.size(DesignTokens.componentMobileInfoErrorGlyphSize),
                    tint = DesignTokens.colorMuted,
                )
            }
            Text(
                stringResource(R.string.info_error),
                Modifier.padding(bottom = DesignTokens.spaceS12),
                fontSize = DesignTokens.typographySizeCardTitle,
                lineHeight = DesignTokens.componentMobileInfoErrorTitleLineHeight.value.sp,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
            )
            Text(
                stringResource(R.string.info_error_description),
                Modifier.padding(bottom = DesignTokens.spaceS24),
                color = DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeButton,
                lineHeight = DesignTokens.componentMobileInfoErrorBodyLineHeight.value.sp,
                textAlign = TextAlign.Center,
            )
            Surface(
                onClick = retry,
                color = DesignTokens.colorAction,
                contentColor = DesignTokens.colorActionText,
                shape = RoundedCornerShape(DesignTokens.spaceS12),
            ) {
                Row(
                    Modifier.fillMaxWidth().heightIn(min = DesignTokens.targetAndroid)
                        .padding(
                            horizontal = DesignTokens.spaceS16,
                            vertical = DesignTokens.componentMobileInfoErrorActionInsetBlock,
                        ),
                    horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        stringResource(R.string.meetings_retry_load),
                        Modifier.weight(1f),
                        fontSize = DesignTokens.typographySizeButton,
                    )
                    ChatIcon(
                        ChatSymbol.Right,
                        Modifier.size(DesignTokens.componentMobileStateRefreshActionGlyphSize),
                        tint = DesignTokens.colorActionText,
                    )
                }
            }
        }
    }
}
