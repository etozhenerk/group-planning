package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.media.PrivateImage
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SupportSelectedAttachment(
    name: String,
    bytes: ByteArray,
    enabled: Boolean,
    remove: () -> Unit,
) {
    Surface(
        color = Palette.surface,
        shape = RoundedCornerShape(DesignTokens.componentMobileServiceFieldRadius),
    ) {
        Row(
            Modifier.fillMaxWidth().padding(DesignTokens.spaceS12),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
        ) {
            PrivateImage(
                name,
                stringResource(R.string.photo_preview),
                { bytes },
                Modifier.size(
                    DesignTokens.componentMobileSupportAttachmentWidth,
                    DesignTokens.componentMobileSupportAttachmentPreviewHeight,
                ).clip(RoundedCornerShape(DesignTokens.spaceS8)),
            )
            Column(
                Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4),
            ) {
                Text(
                    name,
                    fontSize = DesignTokens.typographySizeCaption,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    stringResource(R.string.support_attached),
                    fontSize = DesignTokens.typographySizeLabel,
                    color = Palette.muted,
                )
            }
            IconButton(remove, enabled = enabled) {
                ServiceIcon(
                    ChatSymbol.Close,
                    DesignTokens.spaceS20,
                    Palette.muted,
                    description = stringResource(R.string.support_remove_attachment),
                )
            }
        }
    }
}
