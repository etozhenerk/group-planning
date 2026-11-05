package dev.groupplanning.android.ui.create

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
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
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.CreatedMeeting
import dev.groupplanning.android.state.CreationViewModel
import dev.groupplanning.android.ui.components.PageBack
import dev.groupplanning.android.ui.components.RequiredLegend
import dev.groupplanning.android.ui.components.StatusPanel
import dev.groupplanning.android.ui.covers.CoverEditor
import dev.groupplanning.android.ui.meetingform.MeetingFields
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun CreationScreen(
    model: CreationViewModel,
    back: () -> Unit,
    created: (CreatedMeeting) -> Unit,
) {
    val state by model.state.collectAsStateWithLifecycle()
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
    Column(Modifier.fillMaxSize().imePadding()) {
        Column(
            Modifier.weight(1f).verticalScroll(rememberScrollState())
                .padding(horizontal = DesignTokens.spaceS20)
                .padding(
                    top = DesignTokens.componentMobilePageInsetTop,
                    bottom = DesignTokens.spaceS12,
                )
                .testTag("create-form"),
            verticalArrangement = Arrangement.spacedBy(
                DesignTokens.spaceS20 + DesignTokens.spaceS2,
            ),
        ) {
            Column {
                PageBack(
                    enabled = !state.busy && !state.preparingCover,
                    label = stringResource(R.string.back_to_meetings),
                    close = close,
                )
                Text(
                    stringResource(R.string.create_new_title),
                    Modifier.semantics { heading() },
                    fontWeight = FontWeight.Bold,
                    fontSize = DesignTokens.typographySizeMobileActionHeading,
                )
                RequiredLegend(sentence = true)
            }
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
                CoverEditor(
                    value = state.record.value.cover,
                    enabled = state.editable,
                    busy = model::preparingCover,
                    change = { cover ->
                        model.change { it.copy(cover = cover) }
                    },
                )
                MeetingFields(
                    state.record.value,
                    state.editable,
                    state.ambiguous,
                    model::change,
                    validationAttempt = state.validationAttempt,
                )
            }
        }
        if (state.ready) CreationSubmissionFooter(state, model::submit)
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
