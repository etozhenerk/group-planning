package dev.groupplanning.android.ui.create

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.CreatedMeeting
import dev.groupplanning.android.state.CreationViewModel
import dev.groupplanning.android.ui.components.ActionButton
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.StatusPanel
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun CreationScreen(
    model: CreationViewModel,
    back: () -> Unit,
    created: (CreatedMeeting) -> Unit,
) {
    val state by model.state.collectAsStateWithLifecycle()
    var confirm by rememberSaveable { mutableStateOf(false) }
    val close = {
        if (!state.busy) {
            if (state.record.value.isEmpty) back() else confirm = true
        }
    }
    BackHandler { close() }
    LaunchedEffect(state.created, state.closed) {
        state.created?.let(created)
        if (state.closed) back()
    }
    Column(Modifier.fillMaxSize().imePadding()) {
        TextButton(
            onClick = close,
            enabled = !state.busy,
            modifier = Modifier.padding(horizontal = 12.dp),
        ) {
            AppIcon(R.drawable.ic_back)
            Text("Назад", color = Palette.muted)
        }
        Column(
            Modifier.fillMaxSize().verticalScroll(
                rememberScrollState(),
            ).padding(24.dp).testTag("create-form"),
            verticalArrangement = Arrangement.spacedBy(24.dp),
        ) {
            Text(
                "Создать встречу",
                Modifier.semantics {
                    heading()
                },
                fontWeight = FontWeight.Bold,
                fontSize = 28.sp,
            )
            if (!state.ready) {
                if (state.problem == null) {
                    CircularProgressIndicator()
                } else {
                    StatusPanel(
                        "Не удалось открыть черновик",
                        "Попробуйте ещё раз.",
                        model::load,
                    )
                }
            } else {
                CreationFields(state, model::change)
                state.problem?.let {
                    Text(it, Modifier.testTag("create-problem"), color = Palette.error)
                }
                state.warning?.let { Text(it, color = Palette.error) }
                ActionButton(
                    if (state.busy) {
                        "Сохраняем…"
                    } else if (state.frozen) {
                        "Повторить сохранение"
                    } else {
                        "Создать встречу"
                    },
                    Modifier.testTag("create-submit"),
                    enabled = !state.busy,
                    onClick = model::submit,
                )
                Text(
                    "После создания появится ссылка для друзей.",
                    color = Palette.muted,
                    fontSize = 14.sp,
                )
            }
        }
    }
    if (confirm) {
        AlertDialog(
            onDismissRequest = { confirm = false },
            title = { Text("Закрыть форму?") },
            text = { Text("Черновик останется на этом устройстве.") },
            confirmButton = {
                TextButton({
                    confirm = false
                    model.saveAndClose()
                }) { Text("Сохранить и выйти") }
            },
            dismissButton = { TextButton({ confirm = false }) { Text("Продолжить") } },
        )
    }
}
