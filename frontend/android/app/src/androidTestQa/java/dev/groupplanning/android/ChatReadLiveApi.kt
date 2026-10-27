package dev.groupplanning.android

import android.content.Context
import java.io.File
import java.security.KeyStore
import java.security.cert.CertificateFactory
import java.util.Base64
import java.util.UUID
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

internal class ChatReadLiveApi(context: Context) {
    private val config = JSONObject(File(context.noBackupFilesDir, "ui-fixture.json").readText())
    private val origin = config.getString("origin")
    private val http: OkHttpClient
    init {
        require(origin.startsWith("https://127.0.0.1:"))
        val certificate = CertificateFactory.getInstance("X.509").generateCertificate(
            Base64.getDecoder().decode(config.getString("certificate")).inputStream(),
        )
        val store = KeyStore.getInstance(KeyStore.getDefaultType()).apply {
            load(null)
            setCertificateEntry("fixture", certificate)
        }
        val managers = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
            .apply { init(store) }
        val trust = managers.trustManagers.single() as X509TrustManager
        val ssl = SSLContext.getInstance("TLS").apply { init(null, arrayOf(trust), null) }
        http = OkHttpClient.Builder().sslSocketFactory(ssl.socketFactory, trust).build()
    }
    fun request(
        actor: String,
        path: String,
        method: String = "GET",
        input: JSONObject? = null,
    ): JSONObject {
        val token = config.getJSONObject("cases").getJSONObject(actor).getString("token")
        val body = input?.toString()?.toRequestBody("application/json".toMediaType())
        val request = Request.Builder().url("$origin/api/v1/$path")
            .header("Authorization", "Bearer $token")
            .header(
                "Idempotency-Key",
                input?.optString("client_request_id")
                    ?.takeIf { it.isNotEmpty() } ?: UUID.randomUUID().toString(),
            )
            .header("X-Somewhere-Test-Scenario", "read-state-device")
            .method(method, body).build()
        return http.newCall(request).execute().use {
            check(it.isSuccessful) {
                "Fixture HTTP ${it.code} $method ${path.substringBefore('/')}"
            }
            JSONObject(checkNotNull(it.body).string())
        }
    }
    fun message(actor: String, meeting: String, text: String): JSONObject = request(
        actor,
        "meetings/$meeting/messages",
        "POST",
        JSONObject()
            .put("text", text).put("client_request_id", UUID.randomUUID().toString()),
    )
}
