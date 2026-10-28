package dev.groupplanning.android.ui.service

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SupportSuccess(
    reference: String,
    email: Boolean,
    close: () -> Unit,
    again: () -> Unit,
) {
    Column(
        Modifier.fillMaxWidth().padding(top = 65.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(18.dp),
    ) {
        Box(
            Modifier.padding(bottom = 12.dp).size(76.dp).rotate(-8f)
                .background(Color(0xff384b42), RoundedCornerShape(28.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text("✓", fontSize = 32.sp, color = Color(0xffc3e0c8))
        }
        Text(
            stringResource(R.string.support_reference, reference),
            fontSize = 12.sp,
            color = Palette.muted,
        )
        Text(
            stringResource(R.string.support_sent),
            fontSize = 28.sp,
            lineHeight = 32.2.sp,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
        )
        Text(
            stringResource(
                if (email) {
                    R.string.support_success_email
                } else {
                    R.string.support_success_body
                },
            ),
            fontSize = 14.sp,
            lineHeight = 25.2.sp,
            color = Palette.muted,
            textAlign = TextAlign.Center,
        )
        CompactButton(
            stringResource(R.string.experience_back),
            Modifier.padding(top = DesignTokens.spaceS12).testTag("support-success-back"),
            primary = true,
            click = close,
        )
        TextButton(again) { Text(stringResource(R.string.support_another), fontSize = 13.sp) }
    }
}
