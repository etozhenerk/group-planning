package dev.groupplanning.android.ui.service

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ProfileServiceNavigation(open: (String) -> Unit) {
    Column(Modifier.fillMaxWidth().padding(top = DesignTokens.componentMobileProfileMenuGap)) {
        val links = listOf(
            Triple("help", R.string.help_title, ChatSymbol.Help),
            Triple("support", R.string.support_title, ChatSymbol.MessageWarning),
            Triple("about", R.string.about_title, ChatSymbol.Information),
        )
        links.forEachIndexed { index, (page, label, icon) ->
            Surface(onClick = { open(page) }, color = Color.Transparent) {
                Row(
                    Modifier.fillMaxWidth().heightIn(
                        min = DesignTokens.componentMobileProfileMenuRowHeight,
                    ),
                    horizontalArrangement = Arrangement.spacedBy(
                        DesignTokens.spaceS12 + DesignTokens.spaceS2,
                    ),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    ChatIcon(icon, Modifier.size(DesignTokens.componentMobileProfileMenuIcon))
                    Text(
                        stringResource(label),
                        Modifier.weight(1f),
                        fontSize = DesignTokens.typographySizeButton,
                    )
                    ChatIcon(
                        ChatSymbol.Right,
                        Modifier.size(DesignTokens.componentMobileProfileMenuChevron),
                    )
                }
            }
            if (index < links.lastIndex) HorizontalDivider(color = DesignTokens.colorLine)
        }
        FlowRow(
            Modifier.fillMaxWidth().padding(top = DesignTokens.spaceS16),
            horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS20),
        ) {
            Surface(onClick = { open("privacy") }, color = Color.Transparent) {
                Text(
                    stringResource(R.string.privacy_short),
                    Modifier.heightIn(
                        min = DesignTokens.targetAndroid,
                    ).wrapContentHeight(Alignment.CenterVertically),
                    fontSize = DesignTokens.typographySizeCaption,
                    fontWeight = FontWeight.Normal,
                    color = Palette.muted,
                )
            }
            Surface(onClick = { open("cookies") }, color = Color.Transparent) {
                Text(
                    stringResource(R.string.profile_cookie_short),
                    Modifier.heightIn(
                        min = DesignTokens.targetAndroid,
                    ).wrapContentHeight(Alignment.CenterVertically),
                    fontSize = DesignTokens.typographySizeCaption,
                    fontWeight = FontWeight.Normal,
                    color = Palette.muted,
                )
            }
        }
    }
}
