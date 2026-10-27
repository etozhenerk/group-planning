package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.Participant
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.ui.theme.DesignTokens

@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun ParticipantChips(
    participants: List<Participant>,
    focus: FocusRequester,
    expand: () -> Unit,
) {
    val preview = participants.filter {
        it.role == "organizer" || it.rsvp == RsvpAnswer.Going
    }.take(3)
    val currentCount = participants.count { it.role == "organizer" || it.rsvp == RsvpAnswer.Going }
    val remaining = (currentCount - preview.size).coerceAtLeast(0)
    val description = stringResource(R.string.participants_show_all, currentCount)
    val colors = listOf(
        DesignTokens.colorRosterSand,
        DesignTokens.colorRosterLilac,
        DesignTokens.colorRosterMint,
    )
    Box(
        Modifier.fillMaxWidth().defaultMinSize(minHeight = DesignTokens.targetAndroid)
            .focusProperties {
                canFocus = true
            }.focusRequester(focus).clickable(role = Role.Button, onClick = expand)
            .testTag("participants-expand").semantics(mergeDescendants = true) {
                contentDescription = description
            },
        contentAlignment = Alignment.CenterStart,
    ) {
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(
                -DesignTokens.componentMobilePeopleChipOverlap,
            ),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
        ) {
            preview.forEachIndexed { index, participant ->
                ParticipantNameChip(participant.user, colors[index])
            }
            if (remaining > 0 || preview.isEmpty()) {
                val shape = RoundedCornerShape(DesignTokens.componentParticipantChipRadius)
                Box(
                    Modifier.align(Alignment.CenterVertically)
                        .heightIn(min = DesignTokens.componentParticipantChipHeight)
                        .clip(shape).background(DesignTokens.colorParticipantChipMore)
                        .border(DesignTokens.spaceS2, DesignTokens.colorSurface, shape).padding(
                            horizontal = DesignTokens.componentMobilePeopleChipMoreInsetInline,
                            vertical = DesignTokens.componentMobilePeopleChipMoreInsetBlock,
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        stringResource(
                            if (preview.isEmpty()) {
                                R.string.participants_count
                            } else {
                                R.string.participants_more
                            },
                            if (preview.isEmpty()) currentCount else remaining,
                        ),
                        Modifier.testTag("participants-more"),
                        color = DesignTokens.colorText,
                        fontSize = DesignTokens.typographySizeParticipantChipMore,
                        lineHeight = DesignTokens.typographySizeParticipantChipMore *
                            DesignTokens.typographyLineHeightBody,
                    )
                }
            }
        }
    }
}
