package dev.groupplanning.android

import android.content.Context
import android.content.Intent
import dev.groupplanning.android.data.ClientRuntime
import dev.groupplanning.android.data.api.ApiClient
import dev.groupplanning.android.data.api.ApiOrigin
import dev.groupplanning.android.data.api.OkHttpTransport
import dev.groupplanning.android.data.api.apiJson
import dev.groupplanning.android.data.api.models.ApiInstant
import dev.groupplanning.android.data.drafts.DraftRepository
import dev.groupplanning.android.data.drafts.FileDraftStorage
import dev.groupplanning.android.data.session.AndroidCredentials
import dev.groupplanning.android.data.session.SessionRepository
import dev.groupplanning.android.data.session.StoredSession
import java.io.File
import java.security.KeyStore
import java.security.cert.CertificateFactory
import java.util.Base64
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager
import kotlinx.serialization.Serializable
import okhttp3.OkHttpClient

internal object RuntimeFactory {
    @Serializable private data class Credential(val token: String, val expiresAt: ApiInstant)

    @Serializable private data class Config(
        val origin: String,
        val certificate: String,
        val cases: Map<String, Credential>,
    )

    fun create(context: Context, intent: Intent): ClientRuntime {
        val scenario = intent.getStringExtra("scenario") ?: "onboarding"
        if (scenario == "onboarding") return ClientRuntime.create(context, origin = null)
        require(scenario in setOf("empty", "draft", "list-error", "lost-create"))
        val config = apiJson.decodeFromString<Config>(
            File(context.noBackupFilesDir, "ui-fixture.json").readText(),
        )
        val origin = ApiOrigin(config.origin)
        require(origin.url.host == "127.0.0.1")
        val certificate = CertificateFactory.getInstance("X.509")
            .generateCertificate(Base64.getDecoder().decode(config.certificate).inputStream())
        val store = KeyStore.getInstance(KeyStore.getDefaultType()).apply {
            load(null)
            setCertificateEntry("fixture", certificate)
        }
        val managers = TrustManagerFactory.getInstance(
            TrustManagerFactory.getDefaultAlgorithm(),
        ).apply {
            init(store)
        }
        val trust = managers.trustManagers.single() as X509TrustManager
        val ssl = SSLContext.getInstance("TLS").apply { init(null, arrayOf(trust), null) }
        val http = OkHttpClient.Builder().sslSocketFactory(ssl.socketFactory, trust)
            .addInterceptor { chain ->
                chain.proceed(
                    chain.request().newBuilder().header(
                        "X-Somewhere-Test-Scenario",
                        scenario,
                    ).build(),
                )
            }.build()
        val credential = config.cases.getValue(scenario)
        return ClientRuntime(
            SessionRepository(
                ApiClient(origin, OkHttpTransport(http)),
                AndroidCredentials.create(context, origin),
            ),
            DraftRepository(FileDraftStorage(File(context.noBackupFilesDir, "drafts/$scenario"))),
            StoredSession(credential.token, credential.expiresAt),
        )
    }
}
