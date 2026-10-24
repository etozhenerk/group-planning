package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun HomeTabs(invitations: Boolean, select: (Boolean) -> Unit) {
    if (LocalDensity.current.fontScale >= 1.5f) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp).selectableGroup()) {
            listOf(false, true).forEach { showInvitations ->
                val selected = invitations == showInvitations
                val label = if (showInvitations) {
                    R.string.home_invitations
                } else {
                    R.string.home_meetings
                }
                Tab(
                    selected = selected,
                    onClick = { select(showInvitations) },
                    modifier = Modifier.fillMaxWidth()
                        .testTag(if (showInvitations) "home-invitations" else "home-meetings")
                        .background(
                            if (selected) Palette.surface else Palette.background,
                            RoundedCornerShape(12.dp),
                        ),
                    text = { Text(stringResource(label)) },
                )
            }
        }
        return
    }
    PrimaryTabRow(
        selectedTabIndex = if (invitations) 1 else 0,
        containerColor = Palette.background,
    ) {
        Tab(selected = !invitations, onClick = {
            select(false)
        }, modifier = Modifier.testTag("home-meetings"), text = {
            Text(stringResource(R.string.home_meetings))
        })
        Tab(selected = invitations, onClick = {
            select(true)
        }, modifier = Modifier.testTag("home-invitations"), text = {
            Text(stringResource(R.string.home_invitations))
        })
    }
}
