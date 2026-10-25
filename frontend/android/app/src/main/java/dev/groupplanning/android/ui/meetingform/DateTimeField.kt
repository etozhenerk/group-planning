package dev.groupplanning.android.ui.meetingform

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun DateTimeField(
    label: String,
    value: String,
    icon: Int,
    enabled: Boolean,
    modifier: Modifier = Modifier,
    open: () -> Unit,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(label, fontSize = 13.sp, lineHeight = 19.5.sp)
        Surface(
            open,
            Modifier.fillMaxWidth().semantics { contentDescription = label },
            enabled = enabled,
            color = Color(0xff1d1e22),
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, Color(0x14ffffff)),
        ) {
            Row(
                Modifier.padding(horizontal = 13.dp, vertical = 13.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    value,
                    Modifier.weight(1f),
                    fontSize = 13.sp,
                    lineHeight = 20.sp,
                    maxLines = 1,
                    color = Palette.text,
                )
                AppIcon(icon, Modifier.size(17.dp))
            }
        }
    }
}
