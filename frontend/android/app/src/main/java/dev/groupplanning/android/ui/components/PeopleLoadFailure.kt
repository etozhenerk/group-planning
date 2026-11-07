package dev.groupplanning.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.DesignTokens

@Composable
internal fun PeopleLoadFailure(retry: () -> Unit) {
    Column(
        Modifier.fillMaxWidth().background(
            DesignTokens.colorBackground,
            RoundedCornerShape(DesignTokens.componentMobileInfoPeopleErrorRadius),
        ).padding(DesignTokens.spaceS16),
    ) {
        Text(
            stringResource(R.string.info_people_error),
            color = DesignTokens.colorMuted,
            fontSize = DesignTokens.typographySizeSmall,
            lineHeight = DesignTokens.componentMobileInfoPeopleErrorLineHeight.value.sp,
        )
        TextButton(
            retry,
            Modifier.padding(top = DesignTokens.spaceS8).heightIn(min = DesignTokens.targetAndroid),
            contentPadding = PaddingValues(DesignTokens.spaceS0),
        ) {
            Text(
                stringResource(R.string.info_retry),
                color = DesignTokens.colorAccent,
                fontSize = DesignTokens.typographySizeSmall,
                lineHeight = DesignTokens.componentMobileInfoPeopleErrorLineHeight.value.sp,
            )
        }
    }
}
