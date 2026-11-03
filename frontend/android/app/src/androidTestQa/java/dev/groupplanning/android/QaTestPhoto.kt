package dev.groupplanning.android

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.provider.MediaStore

internal fun createQaTestPhoto(context: Context, index: Int): Uri {
    val resolver = context.contentResolver
    val photo = checkNotNull(
        resolver.insert(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, "somewhere-qa-photo-$index.png")
                put(MediaStore.MediaColumns.MIME_TYPE, "image/png")
                put(MediaStore.MediaColumns.IS_PENDING, 1)
            },
        ),
    )
    val bitmap = Bitmap.createBitmap(256, 256, Bitmap.Config.ARGB_8888)
    try {
        bitmap.eraseColor(Color.rgb(130 + index * 20, 108, 164))
        checkNotNull(resolver.openOutputStream(photo)).use {
            check(bitmap.compress(Bitmap.CompressFormat.PNG, 100, it))
        }
        resolver.update(
            photo,
            ContentValues().apply { put(MediaStore.MediaColumns.IS_PENDING, 0) },
            null,
            null,
        )
        return photo
    } catch (failure: Exception) {
        resolver.delete(photo, null, null)
        throw failure
    } finally {
        bitmap.recycle()
    }
}
