package dev.groupplanning.android.ui.invitation

import android.content.Context
import android.content.Intent

internal fun launchInvitationShare(context: Context, url: String, title: String) {
    val send = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, url)
    }
    context.startActivity(Intent.createChooser(send, title))
}
