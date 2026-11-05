package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MeetingDisplayButton(calendar: Boolean, choose: () -> Unit) {
    val title = stringResource(
        if (calendar) R.string.meetings_show_calendar else R.string.meetings_show_list,
    )
    Surface(
        onClick = choose,
        modifier = Modifier.size(DesignTokens.targetAndroid).testTag("meeting-display-toggle")
            .semantics { contentDescription = title },
        color = DesignTokens.colorNavigation,
        shape = RoundedCornerShape(DesignTokens.radiusControl),
    ) {
        Box(contentAlignment = Alignment.Center) {
            AppIcon(
                if (calendar) R.drawable.ic_calendar else R.drawable.ic_list,
                Modifier.size(DesignTokens.componentMobileMeetingsViewIconSize),
                tint = Palette.muted,
            )
        }
    }
}
