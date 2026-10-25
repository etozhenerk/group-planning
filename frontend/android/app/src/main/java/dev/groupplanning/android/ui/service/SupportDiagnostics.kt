package dev.groupplanning.android.ui.service

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SupportDiagnostics(checked: Boolean, enabled: Boolean, change: (Boolean) -> Unit) {
    Row(
        Modifier.toggleable(
            checked,
            enabled = enabled,
            role = Role.Checkbox,
            onValueChange = change,
        ).padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Surface(
            Modifier.padding(top = 2.dp).size(16.dp),
            shape = RoundedCornerShape(3.dp),
            color = if (checked) Palette.accent else Color.Transparent,
            border = BorderStroke(1.dp, Palette.muted),
        ) {
            if (checked) Text("✓", color = Palette.actionText, fontSize = 12.sp)
        }
        Column {
            Text(
                stringResource(R.string.support_diagnostics),
                fontSize = 12.sp,
                lineHeight = 18.sp,
                color = Color(0xffccc6d5),
            )
            Text(
                stringResource(R.string.support_diagnostics_hint),
                fontSize = 10.sp,
                lineHeight = 15.sp,
                color = Color(0xff9995a5),
                modifier = Modifier.padding(top = 3.dp),
            )
        }
    }
}
