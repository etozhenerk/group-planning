package dev.groupplanning.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun DesignCheckbox(
    label: String,
    checked: Boolean,
    enabled: Boolean,
    change: (Boolean) -> Unit,
) {
    Row(
        Modifier.fillMaxWidth().heightIn(min = 26.dp).semantics { contentDescription = label }
            .toggleable(
                value = checked,
                enabled = enabled,
                role = Role.Checkbox,
                onValueChange = change,
            ),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Box(
            Modifier.size(
                18.dp,
            ).background(
                if (checked) Palette.accent else Color.Transparent,
                RoundedCornerShape(4.dp),
            )
                .border(
                    1.dp,
                    if (checked) Palette.accent else Color(0xff65656f),
                    RoundedCornerShape(4.dp),
                ),
            contentAlignment = Alignment.Center,
        ) {
            if (checked) AppIcon(R.drawable.ic_check, Modifier.size(14.dp), Palette.background)
        }
        Text(label, fontSize = 13.sp, lineHeight = 19.5.sp)
    }
}
