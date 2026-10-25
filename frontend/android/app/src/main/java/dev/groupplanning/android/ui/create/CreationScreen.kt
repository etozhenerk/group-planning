package dev.groupplanning.android.ui.create

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.CreatedMeeting
import dev.groupplanning.android.state.CreationViewModel
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.components.StatusPanel
import dev.groupplanning.android.ui.covers.CoverEditor
import dev.groupplanning.android.ui.meetingform.MeetingFields
import dev.groupplanning.android.ui.meetings.MeetingsHeader
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun CreationScreen(
    model: CreationViewModel,
    back: () -> Unit,
    created: (CreatedMeeting) -> Unit,
) {
    val state by model.state.collectAsStateWithLifecycle()
    var coverExpanded by rememberSaveable { mutableStateOf(false) }
    var confirm by rememberSaveable { mutableStateOf(false) }
    val close = {
        if (!state.busy && !state.preparingCover) {
            if (state.record.value.isEmpty) back() else confirm = true
        }
    }
    BackHandler { close() }
    LaunchedEffect(state.created, state.closed) {
        state.created?.let(created)
        if (state.closed) back()
    }
    Box(Modifier.fillMaxSize().imePadding()) {
        Column(Modifier.fillMaxSize()) {
            MeetingsHeader()
            TextButton(
                onClick = close,
                enabled = !state.busy && !state.preparingCover,
                modifier = Modifier.padding(start = 8.dp, top = 28.dp),
            ) {
                AppIcon(R.drawable.ic_back)
                Text(stringResource(R.string.my_meetings), color = Palette.muted, fontSize = 13.sp)
            }
            Column(
                Modifier.fillMaxSize().verticalScroll(
                    rememberScrollState(),
                ).padding(start = 20.dp, end = 20.dp, bottom = 24.dp).testTag("create-form"),
                verticalArrangement = Arrangement.spacedBy(24.dp),
            ) {
                Text(
                    stringResource(R.string.create_new_title),
                    Modifier.semantics {
                        heading()
                    },
                    fontWeight = FontWeight.Bold,
                    fontSize = 28.sp,
                )
                if (!state.ready) {
                    if (state.problem == null) {
                        CircularProgressIndicator()
                    } else {
                        StatusPanel(
                            stringResource(R.string.create_draft_error),
                            stringResource(R.string.create_retry_hint),
                            model::load,
                        )
                    }
                } else {
                    Column(
                        Modifier.fillMaxWidth().background(
                            Palette.surface,
                            RoundedCornerShape(22.dp),
                        ).padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(18.dp),
                    ) {
                        MeetingFields(
                            state.record.value,
                            state.editable,
                            state.ambiguous,
                            model::change,
                        )
                        TextButton({ coverExpanded = !coverExpanded }) {
                            Text(stringResource(R.string.cover_title), fontSize = 13.sp)
                        }
                        if (coverExpanded) {
                            CoverEditor(
                                value = state.record.value.cover,
                                enabled = state.editable,
                                busy = model::preparingCover,
                                change = { cover ->
                                    model.change { it.copy(cover = cover) }
                                },
                            )
                        }
                        state.problem?.let {
                            Text(it, Modifier.testTag("create-problem"), color = Palette.error)
                        }
                        state.warning?.let { Text(it, color = Palette.error) }
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                        ) {
                            CompactButton(
                                stringResource(R.string.experience_cancel),
                                enabled = state.editable,
                                click = close,
                            )
                            CompactButton(
                                stringResource(
                                    if (state.frozen) {
                                        R.string.create_retry
                                    } else {
                                        R.string.meetings_create_accessible
                                    },
                                ),
                                Modifier.testTag("create-submit"),
                                primary = true,
                                enabled = !state.preparingCover,
                                busy = state.busy,
                                click = model::submit,
                            )
                        }
                    }
                }
            }
        }
    }
    if (confirm) {
        AlertDialog(
            onDismissRequest = { confirm = false },
            title = { Text(stringResource(R.string.create_close_title)) },
            text = { Text(stringResource(R.string.create_close_body)) },
            confirmButton = {
                TextButton({
                    confirm = false
                    model.saveAndClose()
                }) { Text(stringResource(R.string.create_save_close)) }
            },
            dismissButton = {
                TextButton({ confirm = false }) { Text(stringResource(R.string.create_continue)) }
            },
        )
    }
}
