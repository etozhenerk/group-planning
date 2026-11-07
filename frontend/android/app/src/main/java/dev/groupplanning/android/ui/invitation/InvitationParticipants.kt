package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.Participants
import dev.groupplanning.android.data.api.models.RsvpAnswer
import dev.groupplanning.android.ui.components.PeopleLoadFailure
import dev.groupplanning.android.ui.components.PeopleSkeleton
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun InvitationParticipants(
    value: Participants?,
    information: Boolean = false,
    fallbackCount: Int = 0,
    loading: Boolean = false,
    error: Boolean = false,
    retry: () -> Unit = {},
) {
    val people = value?.participants.orEmpty()
    var expanded by rememberSaveable { mutableStateOf(false) }
    var requestedFocus by remember { mutableStateOf(false) }
    val expandFocus = remember { FocusRequester() }
    val collapseFocus = remember { FocusRequester() }
    LaunchedEffect(expanded) {
        if (requestedFocus) {
            if (expanded) collapseFocus.requestFocus() else expandFocus.requestFocus()
        }
    }
    Column(Modifier.testTag("invitation-people")) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(
                stringResource(
                    if (expanded) {
                        R.string.participants_heading
                    } else if (information) {
                        R.string.info_attending
                    } else {
                        R.string.participants_going
                    },
                ),
                Modifier.weight(1f).semantics { heading() },
                fontSize = if (information) {
                    DesignTokens.typographySizeSectionHeading
                } else {
                    DesignTokens.typographySizeCaption
                },
                color = if (information) DesignTokens.colorText else DesignTokens.colorMuted,
                fontWeight = if (information) FontWeight.SemiBold else FontWeight.Medium,
            )
            Text(
                if (expanded) {
                    (value?.participants?.size ?: fallbackCount).toString()
                } else {
                    (
                        value?.participants?.count {
                            it.role == "organizer" || it.rsvp == RsvpAnswer.Going
                        } ?: fallbackCount
                        ).toString()
                },
                color = DesignTokens.colorMuted,
                fontSize = if (information) {
                    DesignTokens.typographySizeSmall
                } else {
                    DesignTokens.typographySizeCaption
                },
            )
        }
        if (loading) {
            PeopleSkeleton()
        } else if (error) {
            PeopleLoadFailure(retry)
        } else {
            ParticipantChips(people, expandFocus, information) {
                requestedFocus = true
                expanded = !expanded
            }
            if (information && !expanded) {
                androidx.compose.material3.TextButton({
                    requestedFocus = true
                    expanded = true
                }) {
                    Text(
                        stringResource(R.string.info_all_responses, people.size),
                        color = DesignTokens.colorAccent,
                        fontSize = DesignTokens.typographySizeCaption,
                        lineHeight =
                        DesignTokens.typographySizeCaption * DesignTokens.typographyLineHeightBody,
                        fontWeight = FontWeight.Normal,
                    )
                }
            }
            if (expanded) {
                val colors = listOf(
                    DesignTokens.colorRosterSand,
                    DesignTokens.colorRosterLilac,
                    DesignTokens.colorRosterMint,
                    DesignTokens.colorRosterSand,
                    DesignTokens.colorRosterBlue,
                    DesignTokens.colorRosterLilac,
                )
                people.forEachIndexed { index, participant ->
                    ParticipantRosterRow(participant, colors[index % colors.size])
                }
                Box(
                    Modifier.defaultMinSize(minHeight = DesignTokens.targetAndroid)
                        .focusProperties {
                            canFocus = true
                        }.focusRequester(collapseFocus).clickable(role = Role.Button) {
                            requestedFocus = true
                            expanded = false
                        }.testTag("participants-collapse"),
                    contentAlignment = Alignment.CenterStart,
                ) {
                    Text(
                        stringResource(R.string.participants_collapse),
                        color = DesignTokens.colorAccent,
                        fontSize = DesignTokens.typographySizeSmall,
                        lineHeight =
                        DesignTokens.typographySizeSmall * DesignTokens.typographyLineHeightBody,
                    )
                }
            }
        }
    }
}
