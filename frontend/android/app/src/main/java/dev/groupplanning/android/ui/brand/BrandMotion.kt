package dev.groupplanning.android.ui.brand

internal object BrandMotion {
    const val DURATION_NANOS: Long = 1_200_000_000L

    fun rotation(elapsedNanos: Long, moving: Boolean): Float {
        if (!moving) return 0f
        val t = (elapsedNanos.toDouble() / DURATION_NANOS).coerceIn(0.0, 1.0)
        return (360 * t * t * t * (t * (t * 6 - 15) + 10)).toFloat()
    }
}
