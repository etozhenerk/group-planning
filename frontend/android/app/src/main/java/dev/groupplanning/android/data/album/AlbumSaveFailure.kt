package dev.groupplanning.android.data.album

internal enum class AlbumSaveIssue {
    PermissionRequired,
    Busy,
    Empty,
    InvalidSnapshot,
    Storage,
    SavedCleanupPending,
}

internal class AlbumSaveFailure(val issue: AlbumSaveIssue, val savedCount: Int = 0) :
    Exception(issue.name)
