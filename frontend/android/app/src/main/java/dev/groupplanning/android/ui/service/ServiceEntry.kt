package dev.groupplanning.android.ui.service

import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.res.stringResource
import dev.groupplanning.android.R

@Composable
internal fun ServiceEntry(screen: String, help: Boolean = false) {
    var page by rememberSaveable { mutableStateOf<String?>(null) }
    val support = LocalSupport.current
    TextButton({
        support?.preset(screen)
        page = if (help) "help" else "support"
    }) {
        Text(stringResource(if (help) R.string.help_title else R.string.support_title))
    }
    page?.let { ServiceDialog(it, support, { page = it }, { page = null }) }
}
