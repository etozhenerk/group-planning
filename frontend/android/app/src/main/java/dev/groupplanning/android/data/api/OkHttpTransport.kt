package dev.groupplanning.android.data.api

import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.suspendCancellableCoroutine
import okhttp3.Call
import okhttp3.Callback
import okhttp3.CookieJar
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response

internal class OkHttpTransport(client: OkHttpClient = OkHttpClient()) : HttpTransport {
    private val client = client.newBuilder()
        .followRedirects(false)
        .followSslRedirects(false)
        .retryOnConnectionFailure(false)
        .addNetworkInterceptor(NoAutomaticRetry)
        .cookieJar(CookieJar.NO_COOKIES)
        .cache(null)
        .callTimeout(30, TimeUnit.SECONDS)
        .build()

    override suspend fun execute(request: Request): WireResponse =
        suspendCancellableCoroutine { wait ->
            val call = client.newCall(request)
            wait.invokeOnCancellation { call.cancel() }
            call.enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    wait.resumeWithException(ClientFailure(FailureKind.Network))
                }

                override fun onResponse(call: Call, response: Response) {
                    try {
                        val result = response.use {
                            val source = it.body?.source()
                            val limit = if (request.header("Accept") ==
                                "application/octet-stream"
                            ) {
                                20L * 1024 * 1024
                            } else if (request.header("Accept") ==
                                "image/jpeg, image/png"
                            ) {
                                5L * 1024 * 1024
                            } else {
                                MAX_BYTES
                            }
                            source?.request(limit + 1)
                            if ((source?.buffer?.size ?: 0) > limit) {
                                throw ClientFailure(FailureKind.InvalidResponse)
                            }
                            val bytes = source?.readByteArray() ?: byteArrayOf()
                            WireResponse(
                                it.code,
                                it.header("Content-Type"),
                                if (it.header("Content-Type")?.startsWith("image/") ==
                                    true
                                ) {
                                    ""
                                } else {
                                    bytes.decodeToString()
                                },
                                bytes,
                            )
                        }
                        wait.resume(result)
                    } catch (error: ClientFailure) {
                        wait.resumeWithException(bodyFailure(response, error))
                    } catch (_: IOException) {
                        wait.resumeWithException(
                            bodyFailure(response, ClientFailure(FailureKind.Network)),
                        )
                    }
                }
            })
        }

    private fun bodyFailure(response: Response, fallback: ClientFailure): ClientFailure =
        if (response.code == 401 || response.code == 403) {
            // The access decision in HTTPS headers survives a broken/oversized error body.
            ClientFailure(FailureKind.Http, response.code)
        } else {
            fallback
        }

    private companion object {
        const val MAX_BYTES = 2L * 1024 * 1024
    }
}
