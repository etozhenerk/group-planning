package dev.groupplanning.android.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.drafts.MeetingDraft
import dev.groupplanning.android.ui.meetingform.FormField
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun MeetingSettingsFields(
    value: MeetingDraft,
    editable: Boolean,
    ambiguous: Boolean,
    change: ((MeetingDraft) -> MeetingDraft) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.componentMobileFormGroupGap)) {
        Column(
            verticalArrangement = Arrangement.spacedBy(DesignTokens.componentMobileFormSectionGap),
        ) {
            FormField(
                stringResource(R.string.meeting_title_field),
                value.title,
                stringResource(R.string.meeting_title_hint),
                editable,
            ) { title -> change { it.copy(title = title) } }
            FormField(
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
                FormField(
                    stringResource(R.string.meeting_place_field),
                    value.place,
                    stringResource(R.string.meeting_place_hint),
                    editable,
                ) { place -> change { it.copy(place = place) } }
            }
        }
    }
}
