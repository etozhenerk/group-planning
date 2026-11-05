package dev.groupplanning.android.ui.preparation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.state.preparation.PreparationFormIssue
import dev.groupplanning.android.state.preparation.PreparationFormState
import dev.groupplanning.android.ui.meetingform.CreationTextField
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun PreparationTitleField(
    form: PreparationFormState,
    enabled: Boolean,
    change: (String) -> Unit,
) {
    val focus = remember { FocusRequester() }
    val error = if (form.validation ==
        PreparationFormIssue.Title
    ) {
        stringResource(
            if (form.title.trim().isEmpty()) {
                R.string.prep_title_empty
            } else {
                R.string.prep_title_long
            },
        )
    } else {
        null
    }
    LaunchedEffect(form.validationAttempt) { if (error != null) focus.requestFocus() }
    CreationTextField(
        stringResource(
            R.string.prep_title,
        ),
        form.title, stringResource(R.string.prep_placeholder), enabled,
        Modifier.testTag(
            "preparation-title",
        ).focusRequester(focus),
        minLines = 2, required = true, errorText = error,
        labelSize = DesignTokens.typographySizeSmall, cornerRadius = DesignTokens.radiusControl,
        minimumHeight = DesignTokens.componentMobilePreparationTitleFieldMinimumHeight,
        change = change,
    )
}
