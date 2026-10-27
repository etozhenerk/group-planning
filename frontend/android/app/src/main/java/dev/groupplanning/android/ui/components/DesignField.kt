package dev.groupplanning.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun DesignField(
    value: String,
    change: (String) -> Unit,
    label: String,
    placeholder: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    error: Boolean = false,
    minHeight: Dp = 46.dp,
    singleLine: Boolean = false,
    background: Color = Color(0xff1d1e22),
) {
    if (LocalMobileSheet.current) {
        MobileField(value, change, label, placeholder, modifier, enabled, error, singleLine)
        return
    }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(label, fontSize = 13.sp, lineHeight = 19.5.sp)
        BasicTextField(
            value,
            change,
            modifier.fillMaxWidth().heightIn(min = minHeight)
                .background(background, RoundedCornerShape(12.dp))
                .border(
                    1.dp,
                    if (error) Palette.error else Color(0x14ffffff),
                    RoundedCornerShape(12.dp),
                ).padding(horizontal = 14.dp, vertical = 13.dp),
            enabled = enabled,
            singleLine = singleLine,
            textStyle = TextStyle(color = Palette.text, fontSize = 13.sp, lineHeight = 20.8.sp),
            cursorBrush = SolidColor(Palette.accent),
            decorationBox = { inner ->
                Box {
                    if (value.isEmpty()) {
                        Text(
                            placeholder,
                            color = Color(0xff777780),
                            fontSize = 13.sp,
                            lineHeight = 20.8.sp,
                        )
                    }
                    inner()
                }
            },
        )
    }
}
