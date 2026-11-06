package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.components.PageBack
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun ServiceScreenHeader(title: String, form: Boolean = false, back: () -> Unit) {
    Column(
        Modifier.fillMaxWidth().padding(horizontal = DesignTokens.spaceS20)
            .padding(bottom = DesignTokens.componentMobileServiceHeaderBottom),
    ) {
        PageBack(close = back)
        Text(
            title,
            Modifier.padding(top = DesignTokens.componentMobileServiceHeadingGap),
            fontSize = DesignTokens.componentMobileServiceTitleSize.value.sp,
            lineHeight = DesignTokens.componentMobileServiceTitleLineHeight.value.sp,
            letterSpacing = -DesignTokens.componentMobileServiceTitleTracking.value.sp,
            fontWeight = FontWeight(DesignTokens.componentMobileServiceTitleWeight.toInt()),
        )
        if (form) {
            Box(Modifier.padding(top = DesignTokens.spaceS10)) {
                dev.groupplanning.android.ui.components.RequiredLegend(sentence = true)
            }
        }
    }
}
