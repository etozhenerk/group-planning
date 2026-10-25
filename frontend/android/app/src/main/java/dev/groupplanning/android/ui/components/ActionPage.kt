package dev.groupplanning.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import dev.groupplanning.android.ui.meetings.MeetingsHeader
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun ActionPage(
    title: String,
    canClose: Boolean,
    close: () -> Unit,
    content: @Composable ColumnScope.() -> Unit,
) {
    Dialog({
        if (canClose) close()
    }, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(Modifier.fillMaxSize(), color = Palette.background) {
            Column(Modifier.safeDrawingPadding().verticalScroll(rememberScrollState())) {
                MeetingsHeader()
                Column(Modifier.padding(start = 20.dp, end = 20.dp, top = 28.dp, bottom = 24.dp)) {
                    PageBack(canClose, close)
                    Text(
                        title,
                        Modifier.padding(bottom = 24.dp),
                        fontSize = 28.sp,
                        lineHeight = 32.2.sp,
                        letterSpacing = (-.9).sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Column(
                        Modifier.fillMaxWidth().background(
                            Palette.surface,
                            RoundedCornerShape(22.dp),
                        ).padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(18.dp),
                        content = content,
                    )
                }
            }
        }
    }
}
