package dev.groupplanning.android.ui.media

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MeetingMedia
import dev.groupplanning.android.state.media.MediaViewModel
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MessageAttachment(media: MeetingMedia, model: MediaViewModel) {
    var full by rememberSaveable(media.id.toString()) { mutableStateOf(false) }
    val save =
        rememberLauncherForActivityResult(
            ActivityResultContracts.CreateDocument(media.contentType),
        ) {
            model.export(media, it)
        }
    Column {
        if (media.kind ==
            "photo"
        ) {
            PrivateImage(
                media.id.toString(),
                stringResource(R.string.experience_photo),
                {
                    model.content(media)
                },
                Modifier.fillMaxWidth().height(220.dp).clickable { full = true },
            )
        } else {
            Text(media.fileName)
            Text("${media.contentType} · ${media.sizeBytes / 1024} КБ", color = Palette.muted)
            TextButton({
                save.launch(media.fileName)
            }) { Text(stringResource(R.string.media_save)) }
        }
    }
    if (full) {
        Dialog({ full = false }, properties = DialogProperties(usePlatformDefaultWidth = false)) {
            Surface(Modifier.fillMaxSize(), color = Palette.background) {
                Column {
                    TextButton({ full = false }) { Text(stringResource(R.string.experience_close)) }
                    PrivateImage(
                        media.id.toString(),
                        stringResource(R.string.experience_photo),
                        {
                            model.content(media)
                        },
                        Modifier.fillMaxWidth().weight(1f),
                        ContentScale.Fit,
                    )
                }
            }
        }
    }
}
