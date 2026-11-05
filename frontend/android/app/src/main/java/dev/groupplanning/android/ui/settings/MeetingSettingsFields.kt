package dev.groupplanning.android.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.drafts.MeetingDraft
import dev.groupplanning.android.ui.meetingform.CreationTextField
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingSettingsFields(
    value: MeetingDraft,
    editable: Boolean,
    ambiguous: Boolean,
    titleError: String? = null,
    validationAttempt: Int = 0,
    change: ((MeetingDraft) -> MeetingDraft) -> Unit,
) {
    val titleFocus = remember { FocusRequester() }
    LaunchedEffect(validationAttempt, titleError) {
        if (titleError !=
            null
        ) {
            titleFocus.requestFocus()
        }
    }
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.componentMobileFormGroupGap)) {
        Column(
            verticalArrangement = Arrangement.spacedBy(DesignTokens.componentMobileFormSectionGap),
        ) {
            CreationTextField(
                stringResource(R.string.meeting_title_field),
                value.title,
                stringResource(R.string.meeting_title_hint),
                editable,
                modifier = Modifier.focusRequester(titleFocus),
                required = true,
                errorText = titleError,
            ) { title -> change { it.copy(title = title) } }
            CreationTextField(
                stringResource(R.string.meeting_description_field),
                value.description,
                stringResource(R.string.meeting_description_hint),
                editable,
                minLines = 2,
            ) { description -> change { it.copy(description = description) } }
        }
        Column {
            HorizontalDivider(color = DesignTokens.colorLine)
            Column(
                Modifier.padding(top = DesignTokens.componentMobileFormGroupGap),
                verticalArrangement = Arrangement.spacedBy(
                    DesignTokens.componentMobileFormSectionGap,
                ),
            ) {
                MeetingSettingsSchedule(value, editable, ambiguous, change)
                CreationTextField(
                    stringResource(R.string.meeting_place_field),
                    value.place,
                    stringResource(R.string.meeting_place_hint),
                    editable,
                ) { place -> change { it.copy(place = place) } }
            }
        }
    }
}
