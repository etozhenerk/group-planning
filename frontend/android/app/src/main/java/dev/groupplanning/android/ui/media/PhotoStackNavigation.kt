package dev.groupplanning.android.ui.media

internal object PhotoStackNavigation {
    fun target(index: Int, direction: Int, count: Int, stackSwipe: Boolean): Int =
        if (count < 2) 0 else (index + (if (stackSwipe) 1 else direction) + count) % count
}
