package dev.groupplanning.android.data.album

import java.io.File

internal interface AlbumGallery {
    fun requirePermission()
    fun begin(): AlbumGalleryOperation
}

internal interface AlbumGalleryOperation {
    suspend fun stage(photo: AlbumPhoto, file: File)
    suspend fun publish()
    suspend fun discard()
}
