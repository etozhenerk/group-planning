package dev.groupplanning.android.ui.meetingform

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.groupplanning.android.ui.components.DesignField

@Composable
internal fun FormField(
    label: String,
    value: String,
    placeholder: String,
    enabled: Boolean,
    minLines: Int = 1,
    onChange: (String) -> Unit,
) {
    DesignField(
        value,
        onChange,
        label,
        placeholder,
        Modifier.semantics { contentDescription = label.substringBefore(" ·") },
        enabled = enabled,
        minHeight = if (minLines > 1) 100.dp else 46.dp,
        singleLine = minLines == 1,
    )
}
