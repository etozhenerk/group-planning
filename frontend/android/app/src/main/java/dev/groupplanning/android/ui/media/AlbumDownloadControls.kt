package dev.groupplanning.android.ui.media

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.state.album.AlbumDownloadController
import dev.groupplanning.android.state.album.AlbumDownloadState

@Composable
internal fun AlbumDownloadControls(
    controller: AlbumDownloadController?,
    hasPhotos: Boolean,
    add: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val state = controller?.state?.collectAsStateWithLifecycle()?.value ?: AlbumDownloadState.Idle
    val context = LocalContext.current
    val permission =
        rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
            if (it) controller?.start() else controller?.permissionDenied()
        }
    val permitted = {
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q ||
            context.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) ==
            PackageManager.PERMISSION_GRANTED
    }
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) {
        if (permitted()) controller?.permissionGranted()
    }
    AlbumActions(
        state,
        hasPhotos && controller != null,
        add,
        save = {
            if (permitted()) {
                controller?.start()
            } else {
                permission.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
        },
        cancel = { controller?.cancel() },
        settings = {
            context.startActivity(
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.fromParts("package", context.packageName, null)
                },
            )
        },
        acknowledge = { controller?.acknowledgePartial() },
        modifier = modifier,
    )
}
