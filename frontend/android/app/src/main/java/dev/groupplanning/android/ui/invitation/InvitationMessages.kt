package dev.groupplanning.android.ui.invitation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.FeedPage
import dev.groupplanning.android.data.repository.ResourceState
import dev.groupplanning.android.data.session.ClientSnapshot
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.state.InvitationIssue
import dev.groupplanning.android.ui.theme.Palette
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@Composable
internal fun InvitationMessages(
    feed: ResourceState<FeedPage>?,
    snapshot: ClientSnapshot,
    reload: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val user = (snapshot.session as? SessionState.Authenticated)?.profile
    val entries = feed?.value?.entries.orEmpty().filter { it.messageText != null }
    LazyColumn(modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        if (feed?.error != null) {
            item { InvitationProblem(InvitationIssue.Load, true, reload) }
        } else if (feed?.value == null) {
            item { CircularProgressIndicator() }
        } else if (entries.isEmpty()) {
            item { Text(stringResource(R.string.chat_empty), color = Palette.muted) }
        }
        items(entries, key = { it.id }) { entry ->
            val alignment = if (entry.actor.id == user?.id) Alignment.End else Alignment.Start
            Column(
                Modifier.fillMaxWidth(),
                horizontalAlignment = alignment,
            ) {
                Text(
                    entry.actor.displayName + " · " + DateTimeFormatter.ofPattern("HH:mm")
                        .withZone(ZoneId.systemDefault()).format(entry.occurredAt.instant),
                    color = Palette.muted,
                    fontSize = 12.sp,
                )
                Surface(shape = RoundedCornerShape(16.dp), color = Palette.message) {
                    Text(
                        entry.messageText.orEmpty(),
                        Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                    )
                }
            }
        }
    }
}
