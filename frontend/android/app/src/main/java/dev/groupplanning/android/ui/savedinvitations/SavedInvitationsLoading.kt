package dev.groupplanning.android.ui.savedinvitations

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
internal fun SavedInvitationsLoading() {
    val label = stringResource(R.string.saved_invitations_loading)
    Column(
        Modifier.semantics {
            contentDescription = label
        },
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        repeat(3) {
            Column(
                Modifier.fillMaxWidth().background(
                    Palette.surface,
                    RoundedCornerShape(19.dp),
                ).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Box(
                    Modifier.fillMaxWidth(
                        0.8f,
                    ).height(
                        20.dp,
                    ).background(Palette.muted.copy(alpha = 0.15f), RoundedCornerShape(5.dp)),
                )
                Box(
                    Modifier.fillMaxWidth(
                        0.6f,
                    ).height(
                        12.dp,
                    ).background(Palette.muted.copy(alpha = 0.15f), RoundedCornerShape(4.dp)),
                )
                Box(
                    Modifier.fillMaxWidth(
                        0.4f,
                    ).height(
                        12.dp,
                    ).background(Palette.muted.copy(alpha = 0.15f), RoundedCornerShape(4.dp)),
                )
            }
        }
    }
}
