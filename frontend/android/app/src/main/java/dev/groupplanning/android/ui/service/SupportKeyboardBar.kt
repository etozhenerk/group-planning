package dev.groupplanning.android.ui.service

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun SupportKeyboardBar(done: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().height(DesignTokens.targetAndroid)
            .background(DesignTokens.colorBackground)
            .padding(horizontal = DesignTokens.spaceS20),
        horizontalArrangement = Arrangement.End,
    ) {
        TextButton(done, Modifier.height(DesignTokens.targetAndroid).testTag("support-done")) {
            Text(
                stringResource(R.string.support_keyboard_done),
                fontSize = DesignTokens.typographySizeSmall,
                lineHeight =
                DesignTokens.typographySizeSmall * DesignTokens.typographyLineHeightBody,
                color = DesignTokens.colorAccent,
            )
        }
    }
}
