package dev.groupplanning.android.ui.meetingform

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimeInput
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalWindowInfo
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import dev.groupplanning.android.data.drafts.MeetingDraft
import dev.groupplanning.android.ui.theme.Palette
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun MeetingTimeDialog(draft: MeetingDraft, close: () -> Unit, confirm: (String) -> Unit) {
    val time = draft.time?.let(LocalTime::parse) ?: LocalTime.now(ZoneId.of(draft.timezone))
    val picker = rememberTimePickerState(time.hour, time.minute, is24Hour = true)
    var input by rememberSaveable { mutableStateOf(false) }
    val density = LocalDensity.current
    val height = with(density) { LocalWindowInfo.current.containerSize.height.toDp() }
    val compact = density.fontScale > 1.3f || height < 550.dp
    Dialog(close, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Surface(
            Modifier.padding(16.dp).widthIn(max = 420.dp).fillMaxWidth(),
            shape = RoundedCornerShape(28.dp),
            color = Palette.surface,
        ) {
            Column(
                Modifier.verticalScroll(rememberScrollState()).padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(20.dp),
            ) {
                Text("Время встречи", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                if (input || compact) TimeInput(picker) else TimePicker(picker)
                if (!compact) {
                    TextButton({ input = !input }) {
                        Text(if (input) "Выбрать на часах" else "Ввести время")
                    }
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(close) { Text("Отмена") }
                    TextButton({
                        confirm(
                            LocalTime.of(
                                picker.hour,
                                picker.minute,
                            ).format(DateTimeFormatter.ofPattern("HH:mm")),
                        )
                    }, Modifier.testTag("time-confirm")) { Text("Готово") }
                }
            }
        }
    }
}
