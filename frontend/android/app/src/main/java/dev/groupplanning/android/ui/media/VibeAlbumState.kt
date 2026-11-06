package dev.groupplanning.android.ui.media

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.components.ChatIcon
import dev.groupplanning.android.ui.components.ChatSymbol
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun VibeAlbumState(loading: Boolean, error: Boolean, retry: () -> Unit) {
    Column(
        Modifier.fillMaxWidth().padding(horizontal = DesignTokens.spaceS20)
            .padding(top = DesignTokens.spaceS40, bottom = DesignTokens.spaceS32)
            .background(Palette.surface, RoundedCornerShape(DesignTokens.spaceS24))
            .border(
                DesignTokens.spaceS1,
                DesignTokens.colorLine,
                RoundedCornerShape(DesignTokens.spaceS24),
            )
            .heightIn(min = DesignTokens.componentMobileVibeStateMinimumHeight)
            .padding(
                horizontal = DesignTokens.spaceS20 + DesignTokens.spaceS2,
                vertical = DesignTokens.spaceS32,
            ),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS0),
    ) {
        if (loading) {
            Box(
                Modifier.padding(bottom = DesignTokens.spaceS20).fillMaxWidth(.9f)
                    .aspectRatio(DesignTokens.componentMobileVibeStateSkeletonRatio)
                    .background(Palette.background, RoundedCornerShape(DesignTokens.spaceS16)),
            )
        } else {
            ChatIcon(
                if (error) ChatSymbol.Photo else ChatSymbol.Layers,
                Modifier.size(DesignTokens.componentMobileVibeStateIconTile)
                    .background(
                        Palette.background,
                        RoundedCornerShape(
                            DesignTokens.spaceS20 + DesignTokens.spaceS2,
                        ),
                    )
                    .padding(DesignTokens.spaceS20),
            )
        }
        if (!loading) {
            Text(
                stringResource(if (error) R.string.vibe_load_title else R.string.vibe_empty_title),
                modifier = Modifier.padding(
                    top = DesignTokens.spaceS24,
                    bottom = DesignTokens.spaceS12,
                ),
                fontSize = DesignTokens.componentMobileVibeStateTitle.value.sp,
                lineHeight = DesignTokens.componentMobileVibeStateTitleLineHeight.value.sp,
                fontWeight = FontWeight.SemiBold,
                textAlign = TextAlign.Center,
            )
        }
        Text(
            stringResource(
                if (loading) {
                    R.string.vibe_loading
                } else if (error) {
                    R.string.vibe_load_body
                } else {
                    R.string.vibe_empty_body
                },
            ),
            Modifier.widthIn(max = DesignTokens.componentMobileVibeStateTextMaximumWidth),
            fontSize = DesignTokens.typographySizeSmall,
            lineHeight = DesignTokens.componentMobileVibeBodyLineHeight.value.sp,
            color = Palette.muted,
            textAlign = TextAlign.Center,
        )
        if (error &&
            !loading
        ) {
            TextButton(retry, Modifier.padding(top = DesignTokens.spaceS24)) {
                Text(stringResource(R.string.vibe_retry))
            }
        }
    }
}
