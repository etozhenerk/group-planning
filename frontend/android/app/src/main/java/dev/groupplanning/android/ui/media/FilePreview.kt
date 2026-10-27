package dev.groupplanning.android.ui.media

import android.text.format.Formatter
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.Palette
import java.util.Locale

@Composable
internal fun FilePreview(name: String, size: Long) {
    Row(
        Modifier.fillMaxWidth().background(Color(0xff1d1e22), RoundedCornerShape(14.dp))
            .padding(18.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        ChatIcon(ChatSymbol.File)
        Column(Modifier.weight(1f)) {
            Text(name, fontSize = 14.sp, lineHeight = 21.sp, fontWeight = FontWeight.Bold)
            Text(
                name.substringAfterLast('.', "").uppercase(Locale.ROOT) + " · " +
                    Formatter.formatShortFileSize(LocalContext.current, size),
                fontSize = 12.sp,
                lineHeight = 18.sp,
                color = Palette.muted,
            )
        }
    }
}
