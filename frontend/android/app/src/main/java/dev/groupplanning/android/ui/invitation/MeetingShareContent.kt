package dev.groupplanning.android.ui.invitation

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.InvitationPreview
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.components.meetingTime
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingShareContent(preview: InvitationPreview, url: String) {
    val context = LocalContext.current
    val label = stringResource(R.string.invitation_share)
    var copied by rememberSaveable { mutableStateOf(false) }
    Surface(
        color = DesignTokens.colorBackground,
        shape = RoundedCornerShape(DesignTokens.componentMobileFieldRadius),
    ) {
        Column(
            Modifier.fillMaxWidth().padding(DesignTokens.componentMobileChatInlineInset),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS6),
        ) {
            Text(preview.title, fontSize = DesignTokens.typographySizeButton)
            Text(
                meetingTime(preview.startsAt, preview.timezone, preview.startsOn),
                color = DesignTokens.colorMuted,
                fontSize = DesignTokens.typographySizeLabel,
            )
        }
    }
    SelectionContainer { Text(url, fontSize = DesignTokens.typographySizeCaption) }
    CompactButton(
        stringResource(
            if (copied) R.string.invitation_link_copied else R.string.invitation_copy_link,
        ),
        Modifier.fillMaxWidth(),
    ) {
        context.getSystemService(ClipboardManager::class.java)
            .setPrimaryClip(ClipData.newPlainText(label, url))
        copied = true
    }
    CompactButton(label, Modifier.fillMaxWidth(), primary = true) {
        context.startActivity(
            Intent.createChooser(
                Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, url)
                },
                label,
            ),
        )
    }
}
