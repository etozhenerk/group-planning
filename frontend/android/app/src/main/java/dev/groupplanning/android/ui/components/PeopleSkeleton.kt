package dev.groupplanning.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun PeopleSkeleton() {
    if (!rememberLoadingVisible(true)) return
    val label = stringResource(R.string.info_people_loading)
    val shape = RoundedCornerShape(DesignTokens.componentInvitationStateLoadingRadius)
    Column(
        Modifier.fillMaxWidth().padding(vertical = DesignTokens.spaceS20)
            .clearAndSetSemantics { contentDescription = label },
        verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS24),
    ) {
        repeat(3) { index ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(
                    DesignTokens.componentMobileInfoPeopleSkeletonGap,
                ),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    Modifier.size(
                        DesignTokens.componentMobileInfoPeopleSkeletonPictureSize,
                    ).background(DesignTokens.colorLine, CircleShape),
                )
                Column(
                    Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS10),
                ) {
                    Box(
                        Modifier.fillMaxWidth(
                            (
                                if (index ==
                                    1
                                ) {
                                    DesignTokens.componentMobileInfoPeopleSkeletonShortTitleFraction
                                } else {
                                    DesignTokens.componentMobileInfoPeopleSkeletonTitleFraction
                                }
                                ).toFloat(),
                        ).height(
                            DesignTokens.componentMobileInfoPeopleSkeletonTitleHeight,
                        ).background(DesignTokens.colorLine, shape),
                    )
                    Box(
                        Modifier.fillMaxWidth(
                            DesignTokens.componentMobileInfoPeopleSkeletonLineFraction.toFloat(),
                        ).height(DesignTokens.spaceS12).background(DesignTokens.colorLine, shape),
                    )
                }
            }
        }
    }
}
