package dev.groupplanning.android.ui.placepoll

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.state.placepoll.PlacePollIssue
import dev.groupplanning.android.state.placepoll.PlacePollState
import dev.groupplanning.android.state.placepoll.PlacePollViewModel
import dev.groupplanning.android.ui.meetingform.CreationTextField
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun PlacePollFormFields(state: PlacePollState, model: PlacePollViewModel) {
    val draft = state.draft ?: return
    val placeError = when (state.issue) {
        PlacePollIssue.Place -> stringResource(
            if (draft.place.trim().isEmpty()) {
                R.string.place_error_empty
            } else {
                R.string.place_error_long
            },
        )
        PlacePollIssue.Unchanged -> stringResource(R.string.place_error_same)
        else -> null
    }
    val explanationError = state.issue?.takeIf {
        it == PlacePollIssue.Explanation
    }?.let { placeIssueText(it) }
    val focusPlace = remember { FocusRequester() }
    val focusExplanation = remember { FocusRequester() }
    LaunchedEffect(state.validationAttempt) {
        if (placeError != null) {
            focusPlace.requestFocus()
        } else if (explanationError != null) {
            focusExplanation.requestFocus()
        }
    }
    CreationTextField(
        stringResource(
            R.string.place_poll_field,
        ),
        draft.place, stringResource(R.string.place_poll_placeholder),
        state.editable, Modifier.testTag("place-poll-place").focusRequester(focusPlace),
        minLines = 2, required = true, errorText = placeError,
        labelSize = DesignTokens.typographySizeSmall, cornerRadius = DesignTokens.radiusControl,
        minimumHeight =
        DesignTokens.componentMobileFieldTextAreaMinimumHeight + DesignTokens.spaceS4,
    ) { value -> model.change { it.copy(place = value) } }
    CreationTextField(
        stringResource(R.string.place_poll_explanation), draft.explanation,
        stringResource(R.string.place_poll_explanation_hint), state.editable,
        Modifier.testTag("place-poll-explanation").focusRequester(focusExplanation),
        minLines = 3, errorText = explanationError, labelSize = DesignTokens.typographySizeSmall,
        cornerRadius = DesignTokens.radiusControl,
    ) { value -> model.change { it.copy(explanation = value) } }
}
