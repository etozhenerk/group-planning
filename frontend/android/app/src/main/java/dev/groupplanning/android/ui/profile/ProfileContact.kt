package dev.groupplanning.android.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ProfileContact(icon: Int, label: Int, value: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Box(Modifier.size(44.dp), contentAlignment = Alignment.Center) { AppIcon(icon) }
        Column {
            Text(stringResource(label), fontSize = 12.sp, lineHeight = 18.sp, color = Palette.muted)
            Text(value, fontSize = 15.sp, lineHeight = 22.5.sp)
        }
    }
}
