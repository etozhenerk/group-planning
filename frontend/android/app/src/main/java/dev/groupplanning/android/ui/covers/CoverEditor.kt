package dev.groupplanning.android.ui.covers

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.drafts.CoverDraft
import dev.groupplanning.android.state.covers.CoverSelectionViewModel
import dev.groupplanning.android.state.covers.CoverSource
import dev.groupplanning.android.ui.theme.Palette
import java.util.UUID

@Composable
internal fun CoverEditor(
    value: CoverDraft?,
    enabled: Boolean,
    busy: (Boolean) -> Unit,
    change: (CoverDraft) -> Unit,
    modifier: Modifier = Modifier,
    original: String? = null,
    meetingId: UUID? = null,
) {
    val repository = LocalCovers.current
    val model = remember { CoverSelectionViewModel() }
    val state by model.state.collectAsStateWithLifecycle()
    val onBusy by rememberUpdatedState(busy)
    val onChange by rememberUpdatedState(change)
    val picker =
        rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
            if (uri != null &&
                repository != null
            ) {
                model.select({ repository.prepare(uri) }, onBusy, onChange)
            }
        }
    DisposableEffect(model) {
        onDispose {
            model.stop()
            onBusy(false)
        }
    }
    val source =
        value?.image?.let { CoverSource.Prepared(it) }
            ?: if (value == null &&
                original != null &&
                meetingId != null
            ) {
                CoverSource.Remote(original, meetingId)
            } else {
                null
            }
    Column(modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(stringResource(R.string.cover_title), fontWeight = FontWeight.SemiBold)
        if (state.busy) {
            CoverSkeleton(
                Modifier.fillMaxWidth().aspectRatio(16f / 9f),
            )
        } else {
            source?.let {
                CoverImage(it)
            }
        }
        FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            TextButton(
                onClick = {
                    val adapter = repository?.selection
                    if (adapter != null) {
                        model.select(adapter::select, onBusy, onChange)
                    } else {
                        picker.launch(
                            PickVisualMediaRequest(
                                ActivityResultContracts.PickVisualMedia.ImageOnly,
                            ),
                        )
                    }
                },
                enabled = enabled && !state.busy && repository != null,
                modifier = Modifier.testTag("cover-select"),
            ) {
                Text(
                    stringResource(
                        if (source == null) {
                            R.string.cover_add
                        } else {
                            R.string.cover_replace
                        },
                    ),
                )
            }
            if (source != null) {
                TextButton(
                    onClick = {
                        model.clearError()
                        onChange(CoverDraft())
                    },
                    enabled = enabled && !state.busy,
                    modifier = Modifier.testTag("cover-remove"),
                ) {
                    Text(stringResource(R.string.cover_remove))
                }
            }
        }
        state.issue?.let {
            Text(
                stringResource(
                    if (it.tooLarge) R.string.cover_too_large else R.string.cover_read_error,
                ),
                Modifier.testTag("cover-error"),
                color = Palette.error,
            )
        }
    }
}
