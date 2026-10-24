package dev.groupplanning.android.ui.preparation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
internal fun PreparationPeopleLoading() {
    val label = stringResource(R.string.preparation_people_loading)
    Box(
        Modifier.fillMaxWidth().height(
            44.dp,
        ).background(Palette.muted.copy(alpha = .12f), RoundedCornerShape(8.dp)).semantics {
            contentDescription =
                label
        },
    )
}
