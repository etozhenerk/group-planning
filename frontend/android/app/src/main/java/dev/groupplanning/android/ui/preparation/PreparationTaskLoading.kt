package dev.groupplanning.android.ui.preparation

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
internal fun PreparationTaskLoading() {
    val label = stringResource(R.string.preparation_loading)
    Column(
        Modifier.semantics {
            contentDescription = label
        },
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        listOf(22.dp, 14.dp, 44.dp).forEach { height ->
            Box(
                Modifier.fillMaxWidth().height(
                    height,
                ).background(
                    LocalContentColor.current.copy(alpha = .12f),
                    RoundedCornerShape(6.dp),
                ),
            )
        }
    }
}
