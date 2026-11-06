package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun LegalContent(title: Int, body: Int?, modifier: Modifier = Modifier) {
    Column(
        modifier,
        verticalArrangement = Arrangement.spacedBy(
            DesignTokens.spaceS12 + DesignTokens.spaceS2,
        ),
    ) {
        Text(
            stringResource(title),
            Modifier.semantics { heading() },
            fontSize = DesignTokens.typographySizeCalendarTitleMobile,
            lineHeight = (DesignTokens.spaceS24 + DesignTokens.spaceS1).value.sp,
            fontWeight = FontWeight.SemiBold,
        )
        body?.let {
            Text(
                stringResource(it),
                fontSize = DesignTokens.typographySizeButton,
                lineHeight = DesignTokens.spaceS24.value.sp,
            )
        }
        if (title == R.string.legal_operator) {
            Text(
                stringResource(R.string.legal_operator_note),
                fontSize = DesignTokens.typographySizeButton,
                lineHeight = DesignTokens.spaceS24.value.sp,
                color = Palette.muted,
            )
        }
    }
}
