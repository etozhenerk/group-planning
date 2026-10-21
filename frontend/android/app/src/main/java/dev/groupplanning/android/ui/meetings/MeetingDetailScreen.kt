package dev.groupplanning.android.ui.meetings

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.repository.PrivateData
import dev.groupplanning.android.state.AppRoute
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.StatusPanel
import dev.groupplanning.android.ui.components.meetingTime
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun MeetingDetailScreen(
    route: AppRoute.Meeting,
    data: PrivateData,
    back: () -> Unit,
    retry: () -> Unit,
) {
    BackHandler(onBack = back)
    val context = LocalContext.current
    var copied by remember(route.id) { mutableStateOf(false) }
    val resource = data.details[route.id]
    val meeting = resource?.value
    Column(Modifier.fillMaxSize()) {
        TextButton(back, Modifier.padding(horizontal = 12.dp)) {
            AppIcon(R.drawable.ic_back)
            Text("Мои встречи")
        }
        Column(
            Modifier.verticalScroll(
                rememberScrollState(),
            ).padding(24.dp).testTag("meeting-details"),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            when {
                route.id in data.denied -> StatusPanel(
                    "Доступ к встрече закрыт",
                    "Вернитесь к своим встречам.",
                    back,
                )
                resource?.error != null -> StatusPanel(
                    "Не удалось открыть встречу",
                    "Проверьте соединение и повторите запрос.",
                    retry,
                )
                meeting == null -> CircularProgressIndicator()
                else -> {
                    Text(
                        meeting.title,
                        Modifier.semantics {
                            heading()
                        },
                        fontSize = 30.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(meetingTime(meeting.startsAt, meeting.timezone), color = Palette.muted)
                    Text(meeting.place ?: "Место пока не выбрано", color = Palette.muted)
                    meeting.description?.let { Text(it) }
                    Text("Участников: ${meeting.participantCount}", color = Palette.muted)
                    route.invitation?.let { link ->
                        ActionButton(
                            if (copied) "Ссылка скопирована" else "Скопировать приглашение",
                            icon = R.drawable.ic_share,
                        ) {
                            (
                                context.getSystemService(
                                    Context.CLIPBOARD_SERVICE,
                                ) as ClipboardManager
                                ).setPrimaryClip(
                                ClipData.newPlainText("Приглашение", link),
                            )
                            copied = true
                        }
                    }
                }
            }
        }
    }
}
