package dev.groupplanning.android.ui.account

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.ClientFailure
import dev.groupplanning.android.data.session.SessionState
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun AccountDeletionDialog(
    state: SessionState.Deleting?,
    initialError: ClientFailure?,
    close: () -> Unit,
    submit: () -> Unit,
    leave: () -> Unit,
) {
    val busy = state?.busy == true
    val error = state?.error ?: initialError
    val expired = error?.status == 401
    val busyLabel = stringResource(R.string.delete_account_busy)
    AlertDialog(
        onDismissRequest = { if (state == null) close() },
        title = { Text(stringResource(R.string.delete_account_title)) },
        text = {
            Column(
                Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text(stringResource(R.string.delete_account_profile))
                Text(stringResource(R.string.delete_account_meetings))
                Text(stringResource(R.string.delete_account_irreversible))
                if (error != null) {
                    Text(
                        stringResource(
                            if (expired) {
                                R.string.delete_account_expired
                            } else {
                                R.string.delete_account_retry
                            },
                        ),
                        color = Palette.error,
                        modifier = Modifier.semantics { liveRegion = LiveRegionMode.Assertive },
                    )
                }
            }
        },
        dismissButton = {
            if (state == null) {
                TextButton(onClick = close) {
                    Text(stringResource(R.string.delete_account_cancel))
                }
            }
        },
        confirmButton = {
            if (expired) {
                TextButton(onClick = leave) { Text(stringResource(R.string.delete_account_login)) }
            } else {
                Button(
                    onClick = submit,
                    enabled = !busy,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Palette.error,
                        contentColor = Palette.background,
                    ),
                ) {
                    if (busy) {
                        CircularProgressIndicator(
                            Modifier.size(24.dp).semantics {
                                contentDescription =
                                    busyLabel
                            },
                            color = Palette.background,
                            strokeWidth = 2.dp,
                        )
                    } else {
                        Text(
                            stringResource(
                                if (state == null) {
                                    R.string.delete_account
                                } else {
                                    R.string.delete_account_repeat
                                },
                            ),
                        )
                    }
                }
            }
        },
    )
}
