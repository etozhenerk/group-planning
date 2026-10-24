package dev.groupplanning.android.ui.placepoll

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LocalContentColor
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R

@Composable
internal fun PlacePollLoading() {
    val label = stringResource(R.string.place_poll_loading)
    Column(
        Modifier.fillMaxWidth().semantics {
            contentDescription = label
        },
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        for (height in listOf(22, 12, 44)) {
            Box(
                Modifier.fillMaxWidth().height(
                    height.dp,
                ).background(
                    LocalContentColor.current.copy(alpha = 0.12f),
                    RoundedCornerShape(6.dp),
                ),
            )
        }
    }
}
