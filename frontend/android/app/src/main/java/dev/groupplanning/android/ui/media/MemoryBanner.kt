package dev.groupplanning.android.ui.media

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MeetingMedia
import dev.groupplanning.android.state.media.MediaViewModel

@Composable
internal fun MemoryBanner(photos: List<MeetingMedia>, model: MediaViewModel, open: () -> Unit) {
    Surface(
        open,
        Modifier.padding(start = 14.dp, end = 14.dp, top = 14.dp).fillMaxWidth(),
        shape = RoundedCornerShape(19.dp),
        color = Color(0xff3a3540),
        border = BorderStroke(1.dp, Color(0x22d6cce9)),
    ) {
        Row(
            Modifier.heightIn(min = 142.dp).padding(horizontal = 17.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    stringResource(R.string.memories_after),
                    fontSize = 10.sp,
                    color = Color(0xffc7bace),
                )
                Text(
                    stringResource(R.string.memories_title),
                    fontSize = 21.sp,
                    fontWeight = FontWeight.Bold,
                    lineHeight = 26.25.sp,
                )
                Text(
                    stringResource(
                        if (photos.isEmpty()) {
                            R.string.memories_add
                        } else {
                            R.string.memories_open
                        },
                    ),
                    Modifier.padding(top = 8.dp).background(
                        Color(0xffe5dbe9),
                        RoundedCornerShape(11.dp),
                    ).padding(horizontal = 11.dp, vertical = 8.dp),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xff28232b),
                )
            }
            Box(Modifier.size(99.dp, 105.dp)) {
                if (photos.isEmpty()) {
                    Text(
                        "✦",
                        Modifier.align(Alignment.Center).rotate(12f),
                        fontSize = 68.sp,
                        color = Color(0xffcbb7dc),
                    )
                }
                photos.take(3).forEachIndexed { index, photo ->
                    Surface(
                        Modifier.align(Alignment.CenterEnd).offset(x = (16 - index * 20).dp)
                            .size(71.dp, 88.dp).rotate(listOf(14f, 3f, -10f)[index]),
                        shape = RoundedCornerShape(9.dp),
                        color = Color(0xffd4c9d1),
                    ) {
                        PrivateImage(
                            photo.id.toString(),
                            "",
                            { model.content(photo) },
                            Modifier.padding(3.dp).clip(RoundedCornerShape(6.dp)),
                            cached = model.cached(photo),
                            loadBitmap = { model.bitmap(photo) },
                        )
                    }
                }
            }
        }
    }
}
