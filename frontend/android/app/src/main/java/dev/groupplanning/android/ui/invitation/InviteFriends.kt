package dev.groupplanning.android.ui.invitation

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun InviteFriends(url: String) {
    val context = LocalContext.current
    val label = stringResource(R.string.invite_friends)
    Column(
        Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Box(
            Modifier.size(64.dp).background(Color(0x12d6cce9), RoundedCornerShape(22.dp)),
            contentAlignment = Alignment.Center,
        ) { AppIcon(R.drawable.ic_invitation) }
        Text(
            stringResource(R.string.invite_prompt),
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            stringResource(R.string.invite_explanation),
            fontSize = 14.sp,
            lineHeight = 23.1.sp,
            textAlign = TextAlign.Center,
            color = Palette.muted,
        )
        CompactButton(label, primary = true, click = {
            context.startActivity(
                Intent.createChooser(
                    Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, url)
                    },
                    label,
                ),
            )
        })
    }
}
