package dev.groupplanning.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ExperienceSkeleton(modifier: Modifier = Modifier, profile: Boolean = false) {
    val label = stringResource(R.string.calendar_loading)
    Column(
        modifier.fillMaxWidth().semantics { contentDescription = label },
        verticalArrangement = Arrangement.spacedBy(28.dp),
    ) {
        repeat(if (profile) 2 else 3) {
            Column(
                Modifier.fillMaxWidth().height(if (profile) 220.dp else 145.dp)
                    .background(Palette.surface, RoundedCornerShape(20.dp)).padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Box(
                    Modifier.fillMaxWidth(.45f).height(16.dp)
                        .background(Palette.muted.copy(alpha = .12f), RoundedCornerShape(8.dp)),
                )
                Box(
                    Modifier.fillMaxWidth(.7f).height(24.dp)
                        .background(Palette.muted.copy(alpha = .12f), RoundedCornerShape(8.dp)),
                )
                Box(
                    Modifier.fillMaxWidth(.5f).height(14.dp)
                        .background(Palette.muted.copy(alpha = .12f), RoundedCornerShape(8.dp)),
                )
            }
        }
    }
}
