package dev.groupplanning.android.ui.meetingform

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun FormField(
    label: String,
    value: String,
    placeholder: String,
    enabled: Boolean,
    minLines: Int = 1,
    onChange: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(label, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
        TextField(
            value, onChange,
            Modifier.fillMaxWidth().semantics {
                contentDescription = label.substringBefore(" ·")
            },
            enabled = enabled, minLines = minLines,
            maxLines = if (minLines >
                1
            ) {
                6
            } else {
                3
            },
            shape = RoundedCornerShape(16.dp), placeholder = {
                Text(placeholder, color = Palette.muted)
            },
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Palette.message,
                unfocusedContainerColor = Palette.message,
                disabledContainerColor = Palette.message,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                disabledIndicatorColor = Color.Transparent,
                disabledTextColor = Palette.muted,
                cursorColor = Palette.accent,
            ),
        )
    }
}
