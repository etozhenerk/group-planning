package dev.groupplanning.android.ui.service

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ProfileServiceNavigation(open: (String) -> Unit) {
    Surface(
        Modifier.fillMaxWidth().padding(top = 20.dp),
        shape = RoundedCornerShape(20.dp),
        color = Palette.surface,
        border = BorderStroke(1.dp, Color(0x0affffff)),
    ) {
        Column {
            val links = listOf(
                "help" to R.string.help_title,
                "support" to R.string.support_title,
                "idea" to R.string.support_idea_action,
                "about" to R.string.about_title,
                "privacy" to R.string.privacy_short,
                "cookies" to R.string.cookies_title,
            )
            links.forEachIndexed { index, (page, label) ->
                Surface(onClick = { open(page) }, color = Color.Transparent) {
                    Row(Modifier.fillMaxWidth().padding(horizontal = 18.dp, vertical = 16.dp)) {
                        Text(stringResource(label), Modifier.weight(1f), fontSize = 14.sp)
                        Text("›", color = Palette.muted, fontSize = 18.sp)
                    }
                }
                if (index < links.lastIndex) {
                    HorizontalDivider(color = Color(0x0affffff))
                }
            }
        }
    }
}
