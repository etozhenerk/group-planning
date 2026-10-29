package dev.groupplanning.android.state.album

internal enum class AlbumDownloadState {
    Idle,
    Preparing,
    Saving,
    Saved,
    Cancelled,
    Failed,
    SaveFailed,
    PermissionRequired,
    Partial,
    Revoked,
}
