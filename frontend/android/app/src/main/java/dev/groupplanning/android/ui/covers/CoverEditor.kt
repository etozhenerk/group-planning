package dev.groupplanning.android.ui.covers

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.drafts.CoverDraft
import dev.groupplanning.android.state.covers.CoverSelectionViewModel
import dev.groupplanning.android.state.covers.CoverSource
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.theme.DesignTokens
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
    optionalHint: Boolean = true,
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
    val mediaSize = DesignTokens.componentMobileCreationCoverSize
    val mediaRadius = DesignTokens.spaceS16
    val mediaGap = DesignTokens.spaceS16
    val mediaIcon = DesignTokens.componentMobileCreationCoverIconSize
    val actions: @Composable () -> Unit = {
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(
                DesignTokens.spaceS8,
            ),
        ) {
            val select = {
                val adapter = repository?.selection
                if (adapter != null) {
                    model.select(adapter::select, onBusy, onChange)
                } else {
                    picker.launch(
                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly),
                    )
                }
            }
            val label = stringResource(
                if (source ==
                    null
                ) {
                    R.string.cover_add
                } else {
                    R.string.settings_cover_replace
                },
            )
            TextButton(
                select,
                enabled = enabled && !state.busy && repository != null,
                modifier = Modifier.testTag(
                    "cover-select",
                ).heightIn(min = DesignTokens.targetAndroid),
                contentPadding = PaddingValues(DesignTokens.spaceS0),
                colors = ButtonDefaults.textButtonColors(
                    contentColor = DesignTokens.colorAccent,
                ),
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS6),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    AppIcon(R.drawable.ic_photo, Modifier.size(DesignTokens.spaceS16))
                    Text(
                        label,
                        fontSize = DesignTokens.typographySizeCaption,
                        fontWeight = FontWeight.Medium,
                    )
                }
            }
            if (source != null) {
                TextButton(
                    onClick = {
                        model.clearError()
                        onChange(CoverDraft())
                    },
                    enabled = enabled && !state.busy,
                    modifier = Modifier.testTag(
                        "cover-remove",
                    ).heightIn(min = DesignTokens.targetAndroid),
                    contentPadding = PaddingValues(DesignTokens.spaceS0),
                    colors = ButtonDefaults.textButtonColors(
                        contentColor = DesignTokens.colorAccent,
                    ),
                ) {
                    Text(
                        stringResource(R.string.cover_remove),
                        fontSize = DesignTokens.typographySizeCaption,
                        fontWeight = FontWeight.Medium,
                    )
                }
            }
        }
    }
    Column(
        modifier.fillMaxWidth()
            .background(DesignTokens.colorSurface, RoundedCornerShape(DesignTokens.radiusCard))
            .border(
                DesignTokens.spaceS1,
                DesignTokens.colorLine,
                RoundedCornerShape(DesignTokens.radiusCard),
            )
            .padding(DesignTokens.spaceS12 + DesignTokens.spaceS2),
        verticalArrangement = Arrangement.spacedBy(DesignTokens.componentMeetingSettingsCoverGap),
    ) {
        run {
            Row(
                horizontalArrangement = Arrangement.spacedBy(
                    mediaGap,
                ),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    Modifier.size(
                        mediaSize,
                    ).background(
                        DesignTokens.colorBackground,
                        RoundedCornerShape(
                            mediaRadius,
                        ),
                    ),
                    contentAlignment = Alignment.Center,
                ) {
                    if (state.busy) {
                        CoverSkeleton(
                            Modifier.size(
                                mediaSize,
                            ),
                        )
                    } else if (source != null) {
                        CoverImage(
                            source,
                            thumbnail = true,
                            thumbnailSize = mediaSize,
                            cornerRadius = mediaRadius,
                        )
                    } else {
                        AppIcon(
                            R.drawable.ic_photo,
                            Modifier.size(
                                mediaIcon,
                            ),
                        )
                    }
                }
                Column(Modifier.weight(1f)) {
                    Text(
                        stringResource(R.string.cover_title),
                        fontSize = DesignTokens.typographySizeSmall,
                    )
                    if (optionalHint) {
                        Text(
                            stringResource(R.string.create_cover_optional),
                            fontSize = DesignTokens.typographySizeLabel,
                            color = DesignTokens.colorMuted,
                        )
                    }
                    actions()
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
