package dev.groupplanning.android.ui.savedinvitations

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.layout
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SavedInvitationsHeader(count: Int?, hasMore: Boolean) {
    BoxWithConstraints(Modifier.fillMaxWidth()) {
        val titleSize = (maxWidth.value * DesignTokens.componentMobileMeetingsTitleWidthRatio)
            .coerceIn(
                DesignTokens.componentMobileMeetingsTitleMinimum.value,
                DesignTokens.componentMobileMeetingsTitleMaximum.value,
            ).sp
        Row(
            Modifier.fillMaxWidth()
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
                stringResource(R.string.home_invitations),
                Modifier.weight(1f, false).layout { measurable, constraints ->
                    // Не обрезать последний глиф при дробном размере шрифта.
                    val width = (measurable.maxIntrinsicWidth(constraints.maxHeight) + 1)
                        .coerceIn(constraints.minWidth, constraints.maxWidth)
                    val content = measurable.measure(
                        constraints.copy(minWidth = width, maxWidth = width),
                    )
                    layout(content.width, content.height) { content.placeRelative(0, 0) }
                }.testTag("invitations-heading").semantics {
                    heading()
                },
                fontSize = titleSize,
                lineHeight = titleSize * DesignTokens.componentMobileMeetingsTitleLineHeight,
                fontWeight = FontWeight(DesignTokens.componentMobileMeetingsTitleWeight.toInt()),
                letterSpacing = (-DesignTokens.componentMobileMeetingsTitleTracking.value).sp,
            )
            if (count != null) {
                val accessible =
                    stringResource(
                        if (hasMore) {
                            R.string.saved_invitations_count_more
                        } else {
                            R.string.saved_invitations_count
                        },
                        count,
                    )
                Box(
                    Modifier.defaultMinSize(
                        DesignTokens.componentMobileInvitationsCounterSize,
                        DesignTokens.componentMobileInvitationsCounterSize,
                    )
                        .background(
                            Palette.surface,
                            RoundedCornerShape(
                                DesignTokens.componentMobileInvitationsCounterRadius,
                            ),
                        )
                        .padding(horizontal = DesignTokens.spaceS4)
                        .semantics { contentDescription = accessible },
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        "$count" + if (hasMore) "+" else "",
                        color = Palette.muted,
                        fontSize = DesignTokens.typographySizeSmall,
                    )
                }
            }
        }
    }
}
