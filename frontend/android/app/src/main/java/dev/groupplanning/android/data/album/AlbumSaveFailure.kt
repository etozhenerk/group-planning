package dev.groupplanning.android.data.album

internal enum class AlbumSaveIssue { PermissionRequired, Busy, Empty, InvalidSnapshot, Storage }

internal class AlbumSaveFailure(val issue: AlbumSaveIssue) : Exception(issue.name)
