package dev.groupplanning.android.data.repository

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import dev.groupplanning.android.data.api.models.PreparedCover
import dev.groupplanning.android.data.api.requests.CoverRequests
import dev.groupplanning.android.data.covers.CoverIssue
import dev.groupplanning.android.data.covers.CoverProcessor
import dev.groupplanning.android.data.covers.CoverSelectionSource
import dev.groupplanning.android.data.session.SessionRepository
import java.io.File
import java.util.Base64
import java.util.UUID
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext

internal class CoverRepository(
    context: Context,
    val sessions: SessionRepository,
    val selection: CoverSelectionSource? = null,
) {
    private val resolver = context.applicationContext.contentResolver
    private val directory = context.applicationContext.cacheDir
    private val processor = CoverProcessor()

    suspend fun prepare(uri: Uri): PreparedCover = withContext(Dispatchers.IO) {
        if (uri.scheme != "content") throw CoverIssue()
        val file = File.createTempFile("cover-", ".image", directory)
        try {
            resolver.openInputStream(uri)?.use { input ->
                file.outputStream().use { output ->
                    val buffer = ByteArray(8192)
                    var total = 0L
                    while (true) {
                        currentCoroutineContext().ensureActive()
                        val count = input.read(buffer)
                        if (count < 0) break
                        total += count
                        if (total > 50 * 1024 * 1024) throw CoverIssue(tooLarge = true)
                        output.write(buffer, 0, count)
                    }
                }
            } ?: throw CoverIssue()
            processor.prepare(file)
        } finally {
            file.delete()
        }
    }

    suspend fun preview(image: PreparedCover): Bitmap = withContext(Dispatchers.IO) {
        processor.preview(Base64.getDecoder().decode(image.data))
    }

    suspend fun load(url: String, meeting: UUID, maximum: Int): Bitmap {
        val request = CoverRequests.read(url, meeting, sessions.api.origin)
        val access = if (request.meetingId != null) sessions.meetingAccess(meeting) else null
        val bytes = if (access !=
            null
        ) {
            sessions.image(request, access.request)
        } else {
            sessions.api.image(request)
        }
        val bitmap = withContext(Dispatchers.IO) { processor.preview(bytes, maximum) }
        if (access != null) {
            try {
                sessions.withAccess(access) {}
            } catch (
                error: Exception,
            ) {
                bitmap.recycle()
                throw error
            }
        }
        return bitmap
    }
}
