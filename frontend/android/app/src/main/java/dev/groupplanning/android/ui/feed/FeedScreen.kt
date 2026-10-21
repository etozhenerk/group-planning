package dev.groupplanning.android.ui.feed

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.repeatOnLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.UserProfile
import dev.groupplanning.android.state.feed.FeedViewModel
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun FeedScreen(model: FeedViewModel, profile: UserProfile, modifier: Modifier = Modifier) {
    val state by model.state.collectAsStateWithLifecycle()
    val messages by model.sender.state.collectAsStateWithLifecycle()
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    LaunchedEffect(model, lifecycle) {
        lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) { model.runActive() }
    }
    if (state.revoked) return
    Column(modifier.imePadding()) {
        FeedTimeline(
            state,
            messages,
            profile,
            model::history,
            model.sender::retry,
            model.sender::recoverRejected,
            Modifier.weight(1f),
        )
        if (state.loadError || messages.storageError) {
            TextButton(model::refresh, Modifier.padding(horizontal = 16.dp)) {
                Text(
                    stringResource(
                        if (messages.storageError) {
                            R.string.message_storage_error
                        } else {
                            R.string.feed_load_error
                        },
                    ),
                    color = Palette.error,
                )
            }
        }
        Column(
            Modifier.padding(horizontal = 16.dp).padding(bottom = 12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            MessageComposer(messages, model.sender::edit, model.sender::send)
        }
    }
}
