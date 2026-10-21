package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.repository.PrivateData
import dev.groupplanning.android.data.repository.ResourcePhase
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.StatusPanel
import dev.groupplanning.android.ui.theme.Palette
import java.util.UUID

@Composable
internal fun MeetingListScreen(
    data: PrivateData,
    create: () -> Unit,
    refresh: () -> Unit,
    more: () -> Unit,
    select: (UUID) -> Unit,
) {
    val list = data.meetings
    val empty = list.phase == ResourcePhase.Ready && list.value?.meetings?.isEmpty() == true
    LazyColumn(
        Modifier.fillMaxSize().testTag("meetings-list"),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp),
    ) {
        item {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    "Мои встречи",
                    Modifier.weight(1f).semantics {
                        heading()
                    },
                    fontSize = 30.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-0.6).sp,
                )
                if (!empty) {
                    IconButton(
                        create,
                        Modifier.semantics {
                            contentDescription = "Создать встречу"
                        },
                    ) { AppIcon(R.drawable.ic_plus, tint = Palette.text) }
                }
            }
        }
        if (list.phase == ResourcePhase.Loading ||
            list.phase == ResourcePhase.Idle
        ) {
            item {
                CircularProgressIndicator(
                    Modifier.semantics {
                        contentDescription = "Загружаем встречи"
                    },
                    color = Palette.accent,
                )
            }
        }
        if (list.error != null) {
            item {
                StatusPanel(
                    "Не удалось получить встречи",
                    "Проверьте соединение и повторите запрос.",
                    refresh,
                )
            }
        }
        if (empty) item { EmptyMeetings(create) }
        items(list.value?.meetings.orEmpty(), key = { it.id }) { MeetingCard(it) { select(it.id) } }
        if (list.value?.nextCursor != null) {
            item {
                ActionButton(
                    if (data.moreRequest != null) {
                        "Загружаем…"
                    } else {
                        "Загрузить ещё"
                    },
                    primary = false,
                    enabled = data.moreRequest == null,
                    onClick = more,
                )
            }
        }
        if (data.moreError != null) {
            item {
                Text(
                    "Не удалось загрузить остальные встречи. Попробуйте ещё раз.",
                    color = Palette.error,
                )
            }
        }
    }
}
