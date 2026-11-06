package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun InvitationExample() {
    Box(Modifier.fillMaxWidth().height(DesignTokens.componentMobileOnboardingArtworkHeight)) {
        OnboardingPhoto(
            R.drawable.onboarding_boardgame,
            Modifier.padding(
                horizontal = DesignTokens.componentMobileOnboardingInvitationPhotoInset,
            )
                .height(DesignTokens.componentMobileOnboardingInvitationPhotoHeight)
                .rotate(DesignTokens.componentMobileOnboardingInvitationPhotoAngle)
                .clip(RoundedCornerShape(DesignTokens.radiusCover))
                .border(
                    DesignTokens.componentMobileOnboardingPhotoFrameWidth,
                    DesignTokens.colorPhotoFrame,
                    RoundedCornerShape(DesignTokens.radiusCover),
                ),
        )
        Box(Modifier.offset(y = DesignTokens.componentMobileOnboardingInvitationCardTop)) {
            OnboardingMeetingPreview()
        }
        Row(
            Modifier.fillMaxWidth().offset(
                y = DesignTokens.componentMobileOnboardingInvitationResponseTop,
            ),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
        ) {
            listOf(
                R.string.rsvp_going,
                R.string.rsvp_maybe,
                R.string.rsvp_not_going,
            ).forEachIndexed {
                    index,
                    title,
                ->
                Surface(
                    Modifier.weight(1f),
                    shape = RoundedCornerShape(DesignTokens.componentButtonRadius),
                    color = if (index ==
                        0
                    ) {
                        DesignTokens.colorAction
                    } else {
                        DesignTokens.colorBackground
                    },
                    contentColor = if (index ==
                        0
                    ) {
                        DesignTokens.colorActionText
                    } else {
                        DesignTokens.colorText
                    },
                    border = BorderStroke(DesignTokens.spaceS1, DesignTokens.colorBorderStrong),
                ) {
                    Box(
                        Modifier.heightIn(min = DesignTokens.targetAndroid),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            stringResource(title),
                            fontSize = DesignTokens.typographySizeSmall,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                }
            }
        }
    }
}
