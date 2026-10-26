package dev.groupplanning.android.ui.invitation

import android.content.Intent
import androidx.compose.foundation.layout.size
import androidx.compose.material3.IconButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun InvitationShare(url: String, showLabel: Boolean = false) {
    val context = LocalContext.current
    val title = stringResource(R.string.invitation_share)
    val share = {
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, url)
        }
        context.startActivity(Intent.createChooser(send, title))
    }
    if (showLabel) {
        InvitationShareAction(
            title,
            share,
            Modifier.testTag("information-share"),
        )
    } else {
        IconButton(
            onClick = share,
            modifier = Modifier.size(DesignTokens.targetAndroid).semantics {
                contentDescription = title
            },
        ) {
            AppIcon(R.drawable.ic_share, Modifier.size(DesignTokens.componentButtonIconSize))
        }
    }
}
