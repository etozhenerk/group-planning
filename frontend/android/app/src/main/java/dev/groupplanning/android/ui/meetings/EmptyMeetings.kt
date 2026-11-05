package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun EmptyMeetings(period: MeetingPeriod, create: () -> Unit) {
    val past = period == MeetingPeriod.Past
    Column(
        Modifier.fillMaxWidth().padding(
            horizontal = DesignTokens.componentMobileMeetingsEmptyInset,
        ).padding(top = DesignTokens.componentMobileMeetingsEmptyTop).testTag("meetings-empty"),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        AppIcon(
            R.drawable.ic_calendar,
            Modifier.size(DesignTokens.componentMobileMeetingsEmptyGlyph),
            Palette.accent,
        )
        Text(
            stringResource(
                if (past) R.string.calendar_past_empty else R.string.calendar_upcoming_empty,
            ),
            Modifier.padding(top = DesignTokens.spaceS12, bottom = DesignTokens.spaceS10),
            fontSize = DesignTokens.componentMobileStateTitleSize.value.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
        )
        Text(
            stringResource(
                if (past) {
                    R.string.meetings_empty_past_hint
                } else {
                    R.string.meetings_empty_upcoming_hint
                },
            ),
            Modifier.padding(bottom = DesignTokens.spaceS24),
            fontSize = DesignTokens.typographySizeButton,
            color = Palette.muted,
            textAlign = TextAlign.Center,
        )
        if (!past) {
            Surface(
                onClick = create,
                shape = RoundedCornerShape(DesignTokens.componentButtonRadius),
                color = Palette.action,
                contentColor = Palette.actionText,
            ) {
                Row(
                    Modifier.heightIn(min = DesignTokens.targetAndroid)
                        .padding(
                            horizontal = DesignTokens.componentMobileMeetingsEmptyActionInline,
                        ),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
                ) {
                    AppIcon(
                        R.drawable.ic_plus,
                        Modifier.size(DesignTokens.componentMobileMeetingsCreateIconSize),
                        Palette.actionText,
                    )
                    Text(
                        stringResource(R.string.meetings_create_accessible),
                        fontSize = DesignTokens.typographySizeSmall,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }
        }
    }
}
