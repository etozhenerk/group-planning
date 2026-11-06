package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.CalendarDay
import dev.groupplanning.android.state.CalendarSelection
import dev.groupplanning.android.ui.meetings.CalendarGrid
import dev.groupplanning.android.ui.theme.DesignTokens
import java.time.LocalDate

@Composable
internal fun PlansExample() {
    var calendar by rememberSaveable { mutableStateOf(false) }
    val insetInline = DesignTokens.componentMobileOnboardingExampleSwitcherInsetInline
    val insetBlock = DesignTokens.componentMobileOnboardingExampleSwitcherInsetBlock
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS20)) {
        Row(
            Modifier.align(Alignment.CenterHorizontally),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4),
        ) {
            listOf(false, true).forEach { choice ->
                Surface(
                    onClick = {
                        calendar = choice
                    },
                    shape = RoundedCornerShape(DesignTokens.radiusPill),
                    color = if (choice ==
                        calendar
                    ) {
                        DesignTokens.colorSurface
                    } else {
                        DesignTokens.colorBackground
                    },
                    modifier = Modifier.heightIn(min = DesignTokens.targetAndroid),
                ) {
                    Text(
                        stringResource(
                            if (choice) R.string.onboarding_calendar else R.string.onboarding_list,
                        ),
                        Modifier.padding(
                            horizontal = insetInline,
                            vertical = insetBlock,
                        ),
                        color = if (choice ==
                            calendar
                        ) {
                            DesignTokens.colorText
                        } else {
                            DesignTokens.colorMuted
                        },
                        fontSize = DesignTokens.typographySizeSmall,
                    )
                }
            }
        }
        if (calendar) {
            CalendarGrid(
                CalendarSelection(calendar = true, upcomingDay = LocalDate.parse("2026-11-07")),
                listOf(CalendarDay("2026-11-07", 1), CalendarDay("2026-11-08", 1)),
            ) {
            }
        } else {
            OnboardingMeetingPreview(photo = true)
            OnboardingMeetingPreview(coffee = true)
        }
    }
}
