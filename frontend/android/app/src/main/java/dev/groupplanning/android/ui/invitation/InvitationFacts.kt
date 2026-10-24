package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.InvitationPreview
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.meetingTime
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun InvitationFacts(value: InvitationPreview, showTitle: Boolean = true) {
    Column(verticalArrangement = Arrangement.spacedBy(20.dp)) {
        if (showTitle) {
            Text(
                value.title,
                Modifier.semantics {
                    heading()
                },
                fontSize = 30.sp,
                fontWeight = FontWeight.Bold,
            )
        }
        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AppIcon(R.drawable.ic_calendar)
            Text(meetingTime(value.startsAt, value.timezone, value.startsOn), color = Palette.muted)
        }
        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AppIcon(R.drawable.ic_place)
            Text(value.place ?: stringResource(R.string.place_unknown), color = Palette.muted)
        }
        value.description?.takeIf { it.isNotBlank() }?.let { Text(it) }
    }
}
