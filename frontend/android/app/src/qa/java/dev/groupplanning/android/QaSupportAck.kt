package dev.groupplanning.android

import java.io.IOException
import java.security.MessageDigest
import java.util.concurrent.CopyOnWriteArrayList
import okhttp3.Request
import okhttp3.Response
import okio.Buffer
import org.json.JSONObject

internal object QaSupportAck {
    data class Entry(val key: String?, val bodyHash: String, val id: String, val reference: String)
    val entries = CopyOnWriteArrayList<Entry>()

    @Volatile var loseNext = false

    fun reset() {
        entries.clear()
        loseNext = false
    }

    fun after(request: Request, response: Response) {
        if (request.url.host != "127.0.0.1" ||
            request.method != "POST" ||
            request.url.encodedPath != "/api/v1/support/feedback" ||
            response.code != 201
        ) {
            return
        }
        val buffer = Buffer()
        request.body?.writeTo(buffer)
        val hash = MessageDigest.getInstance("SHA-256").digest(buffer.readByteArray())
            .joinToString("") { "%02x".format(it) }
        val receipt = JSONObject(response.peekBody(4096).string())
        entries += Entry(
            request.header("Idempotency-Key"),
            hash,
            receipt.getString("id"),
            receipt.getString("reference"),
        )
        if (loseNext) {
            loseNext = false
            throw IOException("Controlled QA support acknowledgement lost after 201")
        }
    }
}
