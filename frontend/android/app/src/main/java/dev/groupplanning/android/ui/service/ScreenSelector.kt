package dev.groupplanning.android.ui.service

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R

@Composable
internal fun ScreenSelector(value: String, enabled: Boolean, change: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val screens = listOf(
        "meetings" to R.string.screen_meetings,
        "calendar" to R.string.screen_calendar,
        "invitation" to R.string.screen_invitation,
        "meeting_chat" to R.string.screen_chat,
        "profile" to R.string.screen_profile,
        "memories" to R.string.screen_memories,
        "sign_in" to R.string.screen_signin,
        "other" to R.string.screen_other,
    )
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(stringResource(R.string.support_screen), fontSize = 13.sp)
        Box {
            Surface(
                { expanded = !expanded },
                enabled = enabled,
                modifier = Modifier.fillMaxWidth(),
                color = Color(0xff25262c),
                shape = RoundedCornerShape(12.dp),
                border = BorderStroke(1.dp, Color(0x14ffffff)),
            ) {
                Row(
                    Modifier.padding(13.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text(
                        stringResource(
                            screens.first {
                                it.first == value
                            }.second,
                        ),
                        fontSize = 13.sp,
                    )
                    Text("⌄")
                }
            }
            DropdownMenu(expanded, { expanded = false }) {
                screens.forEach { (key, label) ->
                    DropdownMenuItem({ Text(stringResource(label)) }, {
                        change(key)
                        expanded =
                            false
                    })
                }
            }
        }
    }
}
