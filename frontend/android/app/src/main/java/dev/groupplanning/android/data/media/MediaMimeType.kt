package dev.groupplanning.android.data.media

internal object MediaMimeType {
    fun resolved(name: String, reported: String?): String {
        val type = reported?.substringBefore(';')?.trim()?.lowercase()
        if (!type.isNullOrEmpty() && type != "application/octet-stream") return type
        return when (name.substringAfterLast('.', "").lowercase()) {
            "pdf" -> "application/pdf"
            "txt" -> "text/plain"
            "zip" -> "application/zip"
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "webp" -> "image/webp"
            "heic" -> "image/heic"
            "heif" -> "image/heif"
            else -> "application/octet-stream"
        }
    }
}
