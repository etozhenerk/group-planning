package dev.groupplanning.android.ui.datepoll

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Checkbox
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.DatePoll
import dev.groupplanning.android.data.api.models.DatePollOption
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
internal fun DatePollOptionRow(
    option: DatePollOption,
    poll: DatePoll,
    selected: Boolean,
    enabled: Boolean,
    choose: () -> Unit,
) {
    val visible = poll.state != "open" || !poll.settings.hideResults
    val votes = option.votes.takeIf { visible }
    val voters = option.voters.takeIf { visible && !poll.settings.anonymous }.orEmpty()
    var people by remember { mutableStateOf(false) }
    val day = LocalDate.parse(option.date)
    val locale = Locale.forLanguageTag("ru")
    val shape = RoundedCornerShape(DesignTokens.radiusControl)
    Surface(
        color = if (selected) DesignTokens.colorMobileDecisionSelected else Color.Transparent,
        shape = shape,
        border = BorderStroke(
            DesignTokens.spaceS1,
            if (selected) DesignTokens.colorAccent else DesignTokens.colorLine,
        ),
        modifier = Modifier.padding(
            top = DesignTokens.spaceS8,
        ).fillMaxWidth().testTag("poll-option-${option.date}"),
    ) {
        Box {
            if (votes != null) {
                val maximum =
                    poll.options.mapNotNull { it.votes }.maxOrNull()?.coerceAtLeast(1) ?: 1
                Box(Modifier.matchParentSize()) {
                    Box(
                        Modifier.fillMaxHeight().fillMaxWidth(
                            (votes.toFloat() / maximum).coerceIn(0f, 1f),
                        )
                            .background(
                                DesignTokens.colorMobileDecisionVoteFill.copy(
                                    alpha =
                                    DesignTokens.colorMobileDecisionVoteFill.alpha *
                                        DesignTokens.componentMobileDecisionVoteFillOpacity
                                            .toFloat(),
                                ),
                                shape,
                            ),
                    )
                }
            }
            Row(
                Modifier.fillMaxWidth().heightIn(
                    min = DesignTokens.componentMobileDecisionOptionMinimumHeight,
                )
                    .toggleable(selected, enabled = enabled, role = Role.Checkbox) { choose() }
                    .padding(DesignTokens.spaceS10),
                horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS10),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Checkbox(
                    selected,
                    onCheckedChange = null,
                    modifier = Modifier.size(DesignTokens.componentMobileFieldIconSize),
                )
                Column(Modifier.weight(1f)) {
                    Text(
                        day.format(DateTimeFormatter.ofPattern("d MMMM", locale)),
                        fontSize = DesignTokens.typographySizeButton,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        day.format(DateTimeFormatter.ofPattern("EEEE", locale)).replaceFirstChar {
                            it.uppercase(locale)
                        },
                        fontSize = DesignTokens.typographySizeLabel,
                        color = DesignTokens.colorMuted,
                    )
                    if (poll.appliedOptionId ==
                        option.id
                    ) {
                        Text(
                            stringResource(R.string.poll_selected),
                            fontSize = DesignTokens.typographySizeLabel,
                        )
                    }
                }
                if (votes != null) {
                    val count = pluralStringResource(R.plurals.poll_votes, votes, votes)
                    if (voters.isEmpty()) {
                        Text(count, fontSize = DesignTokens.typographySizeSmall)
                    } else {
                        Box {
                            TextButton({
                                people = true
                            }) { Text(count, fontSize = DesignTokens.typographySizeSmall) }
                            DropdownMenu(people, { people = false }) {
                                voters.forEach { user ->
                                    DropdownMenuItem(text = { Text(user.displayName) }, onClick = {
                                        people =
                                            false
                                    })
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
