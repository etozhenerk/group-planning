package dev.groupplanning.android.ui.feed

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
import androidx.compose.ui.res.colorResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.ui.theme.Palette
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
internal fun FeedMessage(
    author: UserProfile,
    time: ApiInstant,
    text: String,
    own: Boolean,
    modifier: Modifier = Modifier,
    status: @Composable () -> Unit = {},
) {
    Row(
        modifier.fillMaxWidth().padding(
            start = if (own) 28.dp else 0.dp,
            end = if (own) 0.dp else 28.dp,
        ),
        horizontalArrangement = Arrangement.spacedBy(
            10.dp,
            if (own) Alignment.End else Alignment.Start,
        ),
        verticalAlignment = Alignment.Top,
    ) {
        if (!own) FeedAvatar(author.displayName)
        Column(
            Modifier.weight(1f, fill = false),
            horizontalAlignment = if (own) Alignment.End else Alignment.Start,
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    if (own) stringResource(R.string.feed_you) else author.displayName,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp,
                    modifier = Modifier.weight(1f, false),
                )
                Text(
                    time.instant.atZone(
                        ZoneId.systemDefault(),
                    ).format(DateTimeFormatter.ofPattern("HH:mm")),
                    color = Palette.muted,
                    fontSize = 11.sp,
                )
            }
            Text(
                text,
                Modifier.background(
                    if (own) colorResource(R.color.own_message) else Palette.message,
                    RoundedCornerShape(
                        topStart = if (own) 20.dp else 6.dp,
                        topEnd = if (own) 6.dp else 20.dp,
                        bottomEnd = 20.dp,
                        bottomStart = 20.dp,
                    ),
                ).padding(horizontal = 14.dp, vertical = 10.dp),
                color = if (own) Palette.actionText else Palette.text,
                fontSize = 15.sp,
            )
            status()
        }
        if (own) FeedAvatar(author.displayName)
    }
}
