package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusProperties
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.InvitationPreview
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingChatHeader(
    preview: InvitationPreview,
    people: Int,
    back: () -> Unit,
    information: (MeetingChatOpener) -> Unit,
    share: (() -> Unit)?,
    informationFocus: FocusRequester,
    headingFocus: FocusRequester,
    shareFocus: FocusRequester,
) {
    val window = LocalWindowInfo.current.containerSize
    val density = LocalDensity.current
    val narrow = with(density) { window.width.toDp() < DesignTokens.breakpointChatNarrowWidth }
    val compact = with(density) { window.height.toDp() < DesignTokens.breakpointChatCompactHeight }
    val infoLabel = stringResource(R.string.meeting_information)
    Row(
        Modifier.fillMaxWidth().heightIn(
            min = if (compact) {
                DesignTokens.componentMobileChatCompactHeaderHeight
            } else {
                DesignTokens.componentMobileChatHeaderHeight
            },
        ).padding(horizontal = DesignTokens.componentMobileChatHeaderInset),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS6),
    ) {
        val backLabel = stringResource(R.string.my_meetings)
        IconButton(
            back,
            Modifier.size(DesignTokens.targetAndroid).semantics {
                contentDescription = backLabel
            },
        ) { ChatIcon(ChatSymbol.Left, Modifier.size(DesignTokens.componentMobileChatIconSize)) }
        Box(
            Modifier.size(
                if (narrow) {
                    DesignTokens.componentMobileChatNarrowMarkWidth
                } else {
                    DesignTokens.componentMobileChatMarkWidth
                },
                if (narrow) {
                    DesignTokens.componentMobileChatNarrowMarkHeight
                } else {
                    DesignTokens.componentMobileChatMarkHeight
                },
            ).background(
                DesignTokens.colorMeetingMark,
                RoundedCornerShape(
                    if (narrow) {
                        DesignTokens.componentMobileChatNarrowMarkRadius
                    } else {
                        DesignTokens.componentMobileChatMarkRadius
                    },
                ),
            ),
            contentAlignment = Alignment.Center,
        ) { ChatIcon(ChatSymbol.Calendar, tint = DesignTokens.colorMeetingMarkForeground) }
        val headingLabel = stringResource(R.string.meeting_heading_information, preview.title)
        Column(
            Modifier.weight(1f).heightIn(min = DesignTokens.targetAndroid)
                .focusProperties {
                    canFocus = true
                }.focusRequester(headingFocus).testTag("meeting-heading").semantics {
                    contentDescription = headingLabel
                }.clickable(role = Role.Button) { information(MeetingChatOpener.Heading) },
            verticalArrangement = Arrangement.spacedBy(
                DesignTokens.spaceS2,
                Alignment.CenterVertically,
            ),
        ) {
            Text(
                preview.title,
                fontWeight = FontWeight(DesignTokens.typographyWeightMobileChatTitle.toInt()),
                fontSize = if (narrow) {
                    DesignTokens.typographySizeMobileChatNarrowTitle
                } else {
                    DesignTokens.typographySizeMobileChatTitle
                },
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                meetingChatDate(preview) + " · " +
                    pluralStringResource(R.plurals.experience_participants_count, people, people),
                Modifier.testTag("meeting-header-subtitle"),
                fontSize = DesignTokens.typographySizeLabel,
                color = DesignTokens.colorMuted,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        if (share != null) {
            val label = stringResource(R.string.invitation_share)
            IconButton(
                share,
                Modifier.size(DesignTokens.targetAndroid).focusProperties {
                    canFocus = true
                }.focusRequester(shareFocus).semantics {
                    contentDescription = label
                },
            ) {
                ChatIcon(ChatSymbol.Share, Modifier.size(DesignTokens.componentMobileChatIconSize))
            }
        }
        IconButton(
            { information(MeetingChatOpener.Information) },
            Modifier.size(DesignTokens.targetAndroid).focusProperties {
                canFocus = true
            }.focusRequester(informationFocus)
                .testTag("meeting-information-open").semantics {
                    contentDescription = infoLabel
                },
        ) {
            ChatIcon(
                ChatSymbol.Information,
                Modifier.size(DesignTokens.componentMobileChatIconSize),
            )
        }
    }
}
