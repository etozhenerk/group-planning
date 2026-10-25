package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.brand.BrandWordmark
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MeetingsHeader(name: String, logout: () -> Unit, deleteAccount: () -> Unit) {
    var menu by remember { mutableStateOf(false) }
    Row(
        Modifier.fillMaxWidth().padding(24.dp, 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BrandWordmark(compact = true)
        Box {
            Surface(
                onClick = { menu = true },
                modifier = Modifier.size(48.dp).semantics {
                    contentDescription = "Профиль: $name"
                },
                shape = CircleShape,
                color = Palette.accent,
                contentColor = Palette.actionText,
            ) {
                Box(contentAlignment = Alignment.Center) { Text(name.take(1)) }
            }
            DropdownMenu(menu, onDismissRequest = { menu = false }) {
                DropdownMenuItem(text = {
                    Text(stringResource(R.string.delete_account), color = Palette.error)
                }, onClick = {
                    menu = false
                    deleteAccount()
                })
                DropdownMenuItem(text = { Text("Выйти") }, onClick = {
                    menu = false
                    logout()
                })
            }
        }
    }
}
