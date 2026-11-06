package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.feed.ChatReceipt
import dev.groupplanning.android.ui.feed.FeedMessageFooter
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun OnboardingChatFile() {
    Row(
        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
        verticalAlignment = Alignment.Bottom,
    ) {
        Spacer(Modifier.width(DesignTokens.spaceS16))
        Surface(
            Modifier.weight(1f),
            shape = RoundedCornerShape(DesignTokens.radiusCard),
            color = DesignTokens.colorOwnMessage,
            contentColor = DesignTokens.colorOwnText,
        ) {
            Column(
                Modifier.padding(DesignTokens.spaceS12),
                verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    ChatIcon(ChatSymbol.File)
                    Column {
                        Text(
                            stringResource(R.string.onboarding_chat_file),
                            fontSize = DesignTokens.typographySizeSmall,
                        )
                        Text(
                            stringResource(R.string.onboarding_chat_file_size),
                            fontSize = DesignTokens.typographySizeCaption,
                        )
                    }
                }
                FeedMessageFooter(OnboardingExamples.entry.occurredAt, true, {}, {
                    ChatReceipt(ServerCounter("4")) {}
                })
            }
        }
        UserAvatar(
            "Миша",
            null,
            size = DesignTokens.componentMobileChatMessageAvatar,
            avatarColor = DesignTokens.colorRosterSand,
        )
    }
}
