package dev.groupplanning.android.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import kotlinx.coroutines.delay

/** Fast requests never replace content with a transient loading surface. */
@Composable
internal fun rememberLoadingVisible(loading: Boolean): Boolean {
    var visible by remember(loading) { mutableStateOf(false) }
    LaunchedEffect(loading) {
        if (loading) {
            delay(200)
            visible = true
        }
    }
    return loading && visible
}
