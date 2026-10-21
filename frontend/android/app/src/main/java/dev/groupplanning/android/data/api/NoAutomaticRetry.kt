package dev.groupplanning.android.data.api

import okhttp3.Interceptor
import okhttp3.Response

internal object NoAutomaticRetry : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val response = chain.proceed(chain.request())
        // OkHttp 4.12 retries this status independently of retryOnConnectionFailure.
        // Preserve the status/body for the caller; this client does not expose Retry-After.
        return if (response.code == 503) {
            response.newBuilder().removeHeader("Retry-After").build()
        } else {
            response
        }
    }
}
