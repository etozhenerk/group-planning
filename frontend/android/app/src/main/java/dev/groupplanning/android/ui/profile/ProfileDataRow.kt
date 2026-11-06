package dev.groupplanning.android.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalResources
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ProfileDataRow(label: Int, value: String, last: Boolean = false) {
    val resources = LocalResources.current
    Column(
        Modifier.fillMaxWidth().testTag("profile-field-${resources.getResourceEntryName(label)}")
            .semantics(mergeDescendants = true) {},
    ) {
        Row(
            Modifier.fillMaxWidth().padding(
                vertical = DesignTokens.componentMobileProfileDataRowInsetBlock,
            ),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS16),
        ) {
            Text(
                stringResource(label),
                Modifier.width(DesignTokens.componentMobileProfileDataLabelWidth),
                color = Palette.muted,
                fontSize = DesignTokens.typographySizeButton,
                lineHeight = DesignTokens.componentMobileProfileDataLineHeight.value.sp,
            )
            Text(
                value,
                Modifier.weight(
                    1f,
                ).heightIn(min = DesignTokens.componentMobileProfileDataLineHeight),
                fontSize = DesignTokens.typographySizeButton,
                lineHeight = DesignTokens.componentMobileProfileDataLineHeight.value.sp,
            )
        }
        if (!last) HorizontalDivider(color = DesignTokens.colorLine)
    }
}
