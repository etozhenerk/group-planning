package dev.groupplanning.android

import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.MemoriesPage
import okhttp3.Response
import okhttp3.ResponseBody.Companion.toResponseBody

/** One-photo album fixture. Real media bytes and the product rendering path stay unchanged. */
internal object QaMemoryAlbum {
    fun singlePhoto(response: Response): Response {
        if (response.request.url.host != "127.0.0.1" ||
            !response.request.url.encodedPath.endsWith("/memories") ||
            !response.isSuccessful
        ) {
            return response
        }
        val body = response.body ?: return response
        val contentType = body.contentType()
        val page = apiJson.decodeFromString<MemoriesPage>(body.string())
        val result = apiJson.encodeToString(
            MemoriesPage.serializer(),
            page.copy(photos = page.photos.take(1), nextCursor = null),
        )
        return response.newBuilder().body(result.toResponseBody(contentType)).build()
    }
}
