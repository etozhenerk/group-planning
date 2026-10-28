package dev.groupplanning.android.ui.service

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.state.SupportDescriptionIssue
import dev.groupplanning.android.state.SupportViewModel
import dev.groupplanning.android.ui.components.CompactButton
import dev.groupplanning.android.ui.components.DesignField
import dev.groupplanning.android.ui.media.PrivateImage
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SupportForm(model: SupportViewModel, policy: () -> Unit, close: () -> Unit) {
    val focus = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current
    val keyboardVisible = WindowInsets.ime.getBottom(LocalDensity.current) > 0
    val descriptionFocus = remember { FocusRequester() }
    val emailFocus = remember { FocusRequester() }
    val descriptionArea = remember { BringIntoViewRequester() }
    val state by model.state.collectAsStateWithLifecycle()
    val descriptionIssue = SupportDescriptionIssue.inspect(state.description)
    val descriptionError = if (state.validation) {
        when (descriptionIssue) {
            SupportDescriptionIssue.TooShort -> stringResource(R.string.support_description_short)
            SupportDescriptionIssue.TooLong -> stringResource(R.string.support_description_long)
            null -> null
        }
    } else {
        null
    }
    LaunchedEffect(state.receipt) {
        if (state.receipt != null) {
            focus.clearFocus()
            keyboard?.hide()
        }
    }
    LaunchedEffect(state.validation) {
        if (state.validation) {
            if (descriptionIssue != null ||
                "description" in state.fieldErrors
            ) {
                descriptionFocus.requestFocus()
                withFrameNanos { }
                descriptionArea.bringIntoView()
            } else {
                emailFocus.requestFocus()
            }
        }
    }
    LaunchedEffect(descriptionError, keyboardVisible) {
        if (descriptionError != null) {
            withFrameNanos { }
            descriptionArea.bringIntoView()
        }
    }
    val picker =
        rememberLauncherForActivityResult(ActivityResultContracts.GetContent(), model::screenshot)
    Column(Modifier.fillMaxWidth()) {
        Column(
            Modifier.weight(1f, fill = false).fillMaxWidth().verticalScroll(
                rememberScrollState(),
            ).pointerInput(Unit) {
                detectTapGestures(onTap = { focus.clearFocus() })
            }.padding(
                start = DesignTokens.spaceS20,
                end = DesignTokens.spaceS20,
                bottom = DesignTokens.spaceS24,
            ),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS12),
        ) {
            if (state.receipt == null) {
                Text(
                    stringResource(R.string.support_heading),
                    fontSize = 28.sp,
                    lineHeight = 32.2.sp,
                    letterSpacing = (-.9).sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 10.dp),
                )
            }
            if (state.receipt == null) {
                Text(
                    stringResource(R.string.support_intro),
                    fontSize = 13.sp,
                    lineHeight = 21.45.sp,
                    color = Palette.muted,
                )
            }
            val receipt = state.receipt
            if (receipt != null) {
                SupportSuccess(receipt.reference, state.email.isNotBlank(), {
                    model.reset()
                    close()
                }, model::reset)
            } else {
                Column(
                    Modifier.fillMaxWidth().padding(top = 11.dp)
                        .background(Color(0xff2d2e35), RoundedCornerShape(22.dp))
                        .padding(horizontal = 17.dp, vertical = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(21.dp),
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(11.dp)) {
                        Text(
                            stringResource(R.string.support_kind_label),
                            color = Palette.muted,
                            fontSize = 12.sp,
                        )
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                            listOf(
                                "problem" to R.string.support_problem,
                                "idea" to R.string.support_idea,
                                "question" to R.string.support_question,
                            ).forEach { (key, label) ->
                                Surface(
                                    onClick = { model.edit { it.copy(kind = key) } },
                                    enabled = !state.frozen,
                                    color = if (state.kind ==
                                        key
                                    ) {
                                        Color(0xff51465e)
                                    } else {
                                        Color.Transparent
                                    },
                                    shape = RoundedCornerShape(11.dp),
                                    border = BorderStroke(
                                        1.dp,
                                        if (state.kind == key) {
                                            Color(0x38cbb5de)
                                        } else {
                                            Color(0x12ffffff)
                                        },
                                    ),
                                ) {
                                    Text(
                                        stringResource(label),
                                        Modifier.padding(
                                            horizontal = 14.dp,
                                            vertical = 8.dp,
                                        ),
                                        fontSize = 12.sp,
                                        color = if (state.kind ==
                                            key
                                        ) {
                                            Color(0xfff1e7fa)
                                        } else {
                                            Color(0xffc6c0ce)
                                        },
                                    )
                                }
                            }
                        }
                    }
                    Column(
                        Modifier.bringIntoViewRequester(descriptionArea),
                        verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS6),
                    ) {
                        DesignField(
                            state.description,
                            { value -> model.edit { it.copy(description = value) } },
                            stringResource(R.string.support_description),
                            stringResource(R.string.support_description_placeholder),
                            Modifier.focusRequester(descriptionFocus).testTag("support-description")
                                .semantics { descriptionError?.let { error(it) } },
                            enabled = !state.frozen,
                            error = state.validation &&
                                (descriptionIssue != null || "description" in state.fieldErrors),
                            minHeight = 145.dp,
                            background = Color(0xff25262c),
                        )
                        descriptionError?.let { message ->
                            Text(
                                message,
                                Modifier.testTag("support-description-error").semantics {
                                    liveRegion = LiveRegionMode.Assertive
                                },
                                color = DesignTokens.colorError,
                                fontSize = DesignTokens.typographySizeCaption,
                                lineHeight =
                                DesignTokens.typographySizeCaption *
                                    DesignTokens.typographyLineHeightBody,
                            )
                        }
                    }
                    ScreenSelector(state.screen, !state.frozen) { value ->
                        model.edit { it.copy(screen = value) }
                    }
                    DesignField(
                        state.email,
                        { value -> model.edit { it.copy(email = value) } },
                        stringResource(R.string.support_email),
                        "you@example.com",
                        Modifier.focusRequester(emailFocus).testTag("support-email"),
                        enabled = !state.frozen,
                        error = "email" in state.fieldErrors,
                        singleLine = true,
                        background = Color(0xff25262c),
                    )
                    state.screenshot?.let { file ->
                        PrivateImage(file.name, stringResource(R.string.photo_preview), {
                            file.bytes
                        }, Modifier.fillMaxWidth().height(160.dp))
                        Text(file.name)
                        TextButton({
                            model.edit { it.copy(screenshot = null) }
                        }, enabled = !state.frozen) {
                            Text(stringResource(R.string.experience_remove))
                        }
                    }
                    SupportAttachment(!state.frozen && !state.selecting) {
                        picker.launch("image/*")
                    }
                    if (state.selecting) CircularProgressIndicator()
                    if (state.fileError) {
                        Text(
                            stringResource(R.string.support_file_error),
                            color = Palette.error,
                        )
                    }
                    SupportDiagnostics(state.diagnostics, !state.frozen) { value ->
                        model.edit { it.copy(diagnostics = value) }
                    }
                    if (state.validation && descriptionError == null) {
                        Text(
                            stringResource(R.string.support_validation),
                            color = Palette.error,
                        )
                    }
                    if (state.error) {
                        Text(
                            stringResource(R.string.support_error),
                            color = Palette.error,
                        )
                    }
                    CompactButton(
                        stringResource(
                            if (state.error) R.string.experience_retry else R.string.support_submit,
                        ),
                        primary = true,
                        busy = state.busy,
                        enabled = !state.selecting,
                        click = {
                            focus.clearFocus()
                            keyboard?.hide()
                            model.send()
                        },
                    )
                    TextButton(policy) {
                        Text(stringResource(R.string.privacy_title), fontSize = 10.sp)
                    }
                }
            }
        }
        if (keyboardVisible && state.receipt == null) {
            SupportKeyboardBar {
                focus.clearFocus()
                keyboard?.hide()
            }
        }
    }
}
