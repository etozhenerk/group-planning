package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
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
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MeetingListHeading(showCreate: Boolean, create: () -> Unit) {
    val label = stringResource(R.string.meetings_create_accessible)
    BoxWithConstraints(Modifier.fillMaxWidth()) {
        val titleSize = (maxWidth.value * DesignTokens.componentMobileMeetingsTitleWidthRatio)
            .coerceIn(
                DesignTokens.componentMobileMeetingsTitleMinimum.value,
                DesignTokens.componentMobileMeetingsTitleMaximum.value,
            ).sp
        Row(
            Modifier.fillMaxWidth().testTag("meetings-heading")
                .heightIn(min = DesignTokens.componentMobileMeetingsHeadingMinimumHeight)
                .padding(horizontal = DesignTokens.spaceS20)
                .padding(
                    top = DesignTokens.componentMobileMeetingsHeadingInsetTop,
                    bottom = DesignTokens.componentMobileMeetingsHeadingInsetBottom,
                ),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
        ) {
            Text(
                stringResource(R.string.meetings_title),
                Modifier.weight(1f).semantics { heading() },
                fontSize = titleSize,
                fontWeight = FontWeight(DesignTokens.componentMobileMeetingsTitleWeight.toInt()),
                letterSpacing = (-DesignTokens.componentMobileMeetingsTitleTracking.value).sp,
                lineHeight = titleSize * DesignTokens.componentMobileMeetingsTitleLineHeight,
            )
            if (showCreate) {
                Surface(
                    onClick = create,
                    modifier = Modifier.defaultMinSize(
                        DesignTokens.targetAndroid,
                        DesignTokens.targetAndroid,
                    )
                        .semantics { contentDescription = label },
                    shape = RoundedCornerShape(DesignTokens.componentButtonRadius),
                    color = Palette.action,
                    contentColor = Palette.actionText,
                ) {
                    Row(
                        Modifier.padding(
                            horizontal = DesignTokens.componentMobileMeetingsCreateInsetInline,
                            vertical = DesignTokens.spaceS10,
                        ),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
                    ) {
                        AppIcon(
                            R.drawable.ic_plus,
                            Modifier.size(DesignTokens.componentMobileMeetingsCreateIconSize),
                            Palette.actionText,
                        )
                        if (LocalDensity.current.fontScale < 1.5f) {
                            Text(
                                stringResource(R.string.meetings_create),
                                fontSize = DesignTokens.typographySizeSmall,
                                fontWeight = FontWeight.SemiBold,
                            )
                        }
                    }
                }
            }
        }
    }
}
