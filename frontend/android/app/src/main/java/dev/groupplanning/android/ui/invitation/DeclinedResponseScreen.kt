package dev.groupplanning.android.ui.invitation

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun DeclinedResponseScreen(
    title: String,
    meetings: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val headingFocus = remember { FocusRequester() }
    BackHandler(onBack = meetings)
    LaunchedEffect(Unit) {
        withFrameNanos { }
        headingFocus.requestFocus()
    }
    Column(
        modifier.fillMaxSize().testTag("rsvp-declined")
            .background(DesignTokens.colorBackground)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = DesignTokens.spaceS16)
            .padding(top = DesignTokens.spaceS12, bottom = DesignTokens.spaceS32),
    ) {
        Row(
            Modifier.padding(horizontal = DesignTokens.spaceS4),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                painterResource(R.drawable.ic_brand_compact),
                null,
                Modifier.size(DesignTokens.componentRsvpResultBrandMarkSize),
                tint = DesignTokens.colorText,
            )
            Text(
                "somewhere",
                fontSize = DesignTokens.typographySizeMobileBrandWord,
                fontWeight = FontWeight(DesignTokens.componentRsvpResultBrandWeight.toInt()),
                letterSpacing = -DesignTokens.componentRsvpResultBrandTracking.value.sp,
            )
        }
        Spacer(Modifier.height(DesignTokens.componentRsvpResultMobileCardGap))
        Column(
            Modifier.fillMaxWidth()
                .background(DesignTokens.colorSurface, RoundedCornerShape(DesignTokens.radiusCard))
                .border(
                    DesignTokens.spaceS1,
                    DesignTokens.colorLine,
                    RoundedCornerShape(DesignTokens.radiusCard),
                )
                .padding(
                    horizontal = DesignTokens.componentRsvpResultCardPaddingInline,
                    vertical = DesignTokens.componentRsvpResultCardPaddingBlock,
                ),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Icon(
                painterResource(R.drawable.ic_check),
                null,
                Modifier.size(DesignTokens.componentRsvpResultMobileIconSize)
                    .background(DesignTokens.colorWeekday, CircleShape)
                    .padding(
                        (
                            DesignTokens.componentRsvpResultMobileIconSize -
                                DesignTokens.componentRsvpResultMobileIconGlyph
                            ) /
                            2,
                    ),
                tint = DesignTokens.colorAccent,
            )
            Spacer(Modifier.height(DesignTokens.spaceS24))
            Text(
                stringResource(R.string.rsvp_declined_title),
                Modifier.focusRequester(headingFocus).focusable().semantics { heading() },
                fontSize = DesignTokens.componentRsvpResultMobileHeadingSize.value.sp,
                fontWeight = FontWeight(DesignTokens.typographyWeightMobileSheetTitle.toInt()),
                letterSpacing = -DesignTokens.componentRsvpResultMobileHeadingTracking.value.sp,
                textAlign = TextAlign.Center,
                color = DesignTokens.colorText,
            )
            Spacer(Modifier.height(DesignTokens.spaceS20))
            Text(
                title,
                fontSize = DesignTokens.typographySizeSectionHeading,
                lineHeight = DesignTokens.componentRsvpResultMeetingLineHeight.value.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center,
                color = DesignTokens.colorText,
            )
            Spacer(Modifier.height(DesignTokens.spaceS10))
            Text(
                stringResource(R.string.rsvp_declined_body),
                fontSize = DesignTokens.typographySizeSmall,
                lineHeight = DesignTokens.componentRsvpResultMobileCopyLineHeight.value.sp,
                textAlign = TextAlign.Center,
                color = DesignTokens.colorMuted,
            )
            Spacer(Modifier.height(DesignTokens.componentRsvpResultCardPaddingBlock))
            Surface(
                onClick = meetings,
                Modifier.fillMaxWidth().heightIn(min = DesignTokens.targetAndroid),
                shape = RoundedCornerShape(DesignTokens.radiusControl),
                color = DesignTokens.colorAction,
                contentColor = DesignTokens.colorActionText,
            ) {
                Text(
                    stringResource(R.string.rsvp_declined_meetings),
                    Modifier.padding(DesignTokens.spaceS12),
                    fontSize = DesignTokens.typographySizeButton,
                    fontWeight = FontWeight.SemiBold,
                    textAlign = TextAlign.Center,
                )
            }
        }
    }
}
