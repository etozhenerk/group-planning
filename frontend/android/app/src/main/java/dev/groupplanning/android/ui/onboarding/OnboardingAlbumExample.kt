package dev.groupplanning.android.ui.onboarding

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.media.AlbumDownloadIcon
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun OnboardingAlbumExample() {
    Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS16)) {
        BoxWithConstraints(
            Modifier.fillMaxWidth().height(DesignTokens.componentMobileOnboardingPhotoStoryHeight),
        ) {
            OnboardingPhoto(
                R.drawable.onboarding_boardgame,
                Modifier.width(
                    maxWidth - DesignTokens.componentMobileOnboardingHeroPhotoTrailingSpace,
                )
                    .height(
                        DesignTokens.componentMobileOnboardingHeroPhotoHeight,
                    ).rotate(DesignTokens.componentMobileOnboardingHeroPhotoAngle)
                    .clip(
                        RoundedCornerShape(DesignTokens.radiusCover),
                    ).border(
                        DesignTokens.componentMobileOnboardingPhotoFrameWidth,
                        DesignTokens.colorPhotoFrame,
                        RoundedCornerShape(DesignTokens.radiusCover),
                    ),
            )
            OnboardingPhoto(
                R.drawable.onboarding_dinner,
                Modifier.align(
                    Alignment.TopEnd,
                ).offset(y = DesignTokens.componentMobileOnboardingSecondPhotoTop)
                    .size(
                        DesignTokens.componentMobileOnboardingSecondPhotoWidth,
                        DesignTokens.componentMobileOnboardingSecondPhotoHeight,
                    )
                    .rotate(
                        DesignTokens.componentMobileOnboardingSecondPhotoAngle,
                    ).clip(RoundedCornerShape(DesignTokens.radiusCover))
                    .border(
                        DesignTokens.componentMobileOnboardingPhotoFrameWidth,
                        DesignTokens.colorPhotoFrame,
                        RoundedCornerShape(DesignTokens.radiusCover),
                    ),
            )
        }
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8),
        ) {
            Column(
                Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS4),
            ) {
                Text(
                    stringResource(R.string.onboarding_boardgame),
                    fontSize = DesignTokens.typographySizeSmall,
                )
                Text(
                    stringResource(R.string.onboarding_photo_count),
                    fontSize = DesignTokens.typographySizeLabel,
                    color = DesignTokens.colorMuted,
                )
            }
            AlbumDownloadIcon(
                Modifier.size(DesignTokens.componentButtonIconSize),
                DesignTokens.colorText,
            )
            Text(
                stringResource(R.string.onboarding_save_all),
                fontSize = DesignTokens.typographySizeSmall,
            )
        }
    }
}
