package dev.groupplanning.android.ui.datepoll

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.size
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.state.datepoll.DatePollDraft
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.components.RequiredFieldLabel
import dev.groupplanning.android.ui.meetingform.CreationFieldHint
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.LocalDate

@Composable
internal fun DatePollOptionsFields(
    draft: DatePollDraft,
    enabled: Boolean,
    showErrors: Boolean,
    change: ((DatePollDraft) -> DatePollDraft) -> Unit,
) {
    val removeLabel = stringResource(R.string.poll_remove)
    Column(
        verticalArrangement = Arrangement.spacedBy(DesignTokens.componentMobileFormDateOptionGap),
    ) {
        RequiredFieldLabel(
            stringResource(R.string.poll_dates_label),
            required = true,
            fontSize = DesignTokens.typographySizeSmall,
            fontWeight = FontWeight.SemiBold,
        )
        draft.dates.forEachIndexed { index, day ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(
                    DesignTokens.componentMobileFormDateDeleteGap,
                ),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    DatePollDayField(
                        stringResource(R.string.poll_option, index + 1),
                        day,
                        enabled,
                        hideLabel = true,
                    ) { next ->
                        change {
                            it.copy(
                                dates = it.dates.mapIndexed { i, old ->
                                    if (i == index) next else old
                                },
                            )
                        }
                    }
                }
                if (draft.dates.size > 2) {
                    TextButton(
                        {
                            change {
                                it.copy(dates = it.dates.filterIndexed { i, _ -> i != index })
                            }
                        },
                        enabled = enabled,
                        modifier = Modifier.semantics { contentDescription = removeLabel },
                    ) {
                        ChatIcon(
                            ChatSymbol.Close,
                            Modifier.size(DesignTokens.componentMobileFieldIconSize),
                        )
                    }
                }
            }
            if (showErrors && draft.dates.count { it == day } > 1) {
                CreationFieldHint(stringResource(R.string.poll_duplicate))
            }
        }
        if (draft.dates.size < 20) {
            TextButton(
                {
                    change {
                        it.copy(
                            dates = it.dates +
                                LocalDate.parse(it.dates.last()).plusDays(1).toString(),
                        )
                    }
                },
                enabled = enabled,
                modifier = Modifier.heightIn(min = DesignTokens.targetAndroid),
                colors = ButtonDefaults.textButtonColors(contentColor = DesignTokens.colorAccent),
            ) {
                ChatIcon(ChatSymbol.Plus, Modifier.size(DesignTokens.componentMobileFieldIconSize))
                Text(stringResource(R.string.poll_add_date))
            }
        }
    }
}
