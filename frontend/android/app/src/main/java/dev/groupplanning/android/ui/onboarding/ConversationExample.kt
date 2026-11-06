package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MessageReaction
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.feed.ReactionChip
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ConversationExample() {
    Column(
        Modifier.widthIn(max = DesignTokens.componentMobileOnboardingChatMaximumWidth),
        verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS16),
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
            verticalAlignment = Alignment.Top,
        ) {
            UserAvatar(
                OnboardingExamples.author.displayName,
                null,
                size = DesignTokens.componentMobileChatMessageAvatar,
                avatarColor = DesignTokens.colorRosterMint,
            )
            Surface(
                Modifier.weight(1f),
                shape = RoundedCornerShape(DesignTokens.radiusCard),
                color = DesignTokens.colorMessage,
            ) {
                Column(
                    Modifier.padding(DesignTokens.spaceS8),
                    verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
                ) {
                    Text(
                        stringResource(R.string.onboarding_chat_author),
                        color = DesignTokens.colorMuted,
                        fontSize = DesignTokens.typographySizeLabel,
                    )
                    OnboardingPhoto(
                        R.drawable.onboarding_dinner,
                        Modifier.height(
                            DesignTokens.componentMobileOnboardingInvitationPhotoHeight,
                        ),
                    )
                    ReactionChip(
                        MessageReaction("👍", 3, true, emptyList()),
                        remember {
                            FocusRequester()
                        },
                        {},
                        {},
                    )
                }
            }
        }
        OnboardingChatFile()
    }
}
