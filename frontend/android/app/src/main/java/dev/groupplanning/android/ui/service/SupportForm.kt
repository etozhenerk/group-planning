package dev.groupplanning.android.ui.service

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.relocation.BringIntoViewRequester
import androidx.compose.foundation.relocation.bringIntoViewRequester
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import dev.groupplanning.android.R
import dev.groupplanning.android.state.SupportDescriptionIssue
import dev.groupplanning.android.state.SupportViewModel
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette

@Composable
internal fun SupportForm(
    model: SupportViewModel,
    policy: () -> Unit,
    close: () -> Unit,
    help: () -> Unit,
) {
    val focus = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current
    val keyboardVisible = WindowInsets.ime.getBottom(LocalDensity.current) > 0
    val descriptionFocus = remember { FocusRequester() }
    val emailFocus = remember { FocusRequester() }
    val descriptionArea = remember { BringIntoViewRequester() }
    val state by model.state.collectAsStateWithLifecycle()
    val emailInvalid = state.validation &&
        state.email.isNotBlank() &&
        !android.util.Patterns.EMAIL_ADDRESS.matcher(state.email.trim()).matches() ||
        "email" in state.fieldErrors
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

    val scroll = rememberScrollState()
    LaunchedEffect(state.receipt) {
        if (state.receipt != null) scroll.scrollTo(0)
    }
    var contentHeight by remember { mutableIntStateOf(0) }
    var footerHeight by remember { mutableIntStateOf(0) }
    BoxWithConstraints(Modifier.fillMaxSize().imePadding()) {
        val height = with(LocalDensity.current) { maxHeight.roundToPx() }
        val pinned = contentHeight + footerHeight > height
        val send = {
            focus.clearFocus()
            keyboard?.hide()
            model.send()
        }
        Column(Modifier.fillMaxSize()) {
            Column(Modifier.weight(1f, fill = false).fillMaxWidth().verticalScroll(scroll)) {
                Column(Modifier.onSizeChanged { contentHeight = it.height }) {
                    ServiceScreenHeader(
                        stringResource(
                            if (state.receipt == null) {
                                R.string.support_write
                            } else {
                                R.string.support_receipt_title
                            },
                        ),
                        form = state.receipt == null,
                        back = close,
                    )
                    if (state.receipt != null) {
                        SupportSuccess(state.receipt?.reference.orEmpty()) {
                            model.reset()
                            help()
                        }
                    } else {
                        Column(
                            Modifier.fillMaxWidth().padding(horizontal = DesignTokens.spaceS20),
                        ) {
                            SupportTopics(state.kind, !state.frozen && !state.busy) { value ->
                                model.edit { it.copy(kind = value) }
                            }
                            Spacer(Modifier.height(DesignTokens.spaceS24 + DesignTokens.spaceS2))
                            Column(Modifier.bringIntoViewRequester(descriptionArea)) {
                                SupportField(
                                    state.description,
                                    { value ->
                                        model.edit { it.copy(description = value) }
                                    },
                                    stringResource(R.string.support_message),
                                    stringResource(
                                        when (state.kind) {
                                            "idea" -> R.string.support_idea_placeholder
                                            "question" -> R.string.support_question_placeholder
                                            else -> R.string.support_description_placeholder
                                        },
                                    ),
                                    Modifier.focusRequester(
                                        descriptionFocus,
                                    ).testTag("support-description")
                                        .semantics { descriptionError?.let { error(it) } },
                                    enabled = !state.frozen && !state.busy,
                                    invalid = descriptionError != null,
                                    required = true,
                                )
                                Text(
                                    descriptionError
                                        ?: stringResource(R.string.support_description_hint),
                                    Modifier.testTag(
                                        if (descriptionError != null) {
                                            "support-description-error"
                                        } else {
                                            "support-description-hint"
                                        },
                                    ).padding(
                                        top = DesignTokens.spaceS8,
                                        bottom = DesignTokens.spaceS24,
                                    ),
                                    fontSize = DesignTokens.typographySizeLabel,
                                    color = if (descriptionError !=
                                        null
                                    ) {
                                        Palette.error
                                    } else {
                                        Palette.muted
                                    },
                                )
                            }
                            ScreenSelector(state.screen, !state.frozen && !state.busy) { value ->
                                model.edit { it.copy(screen = value) }
                            }
                            Spacer(Modifier.height(DesignTokens.spaceS24))
                            SupportField(
                                state.email,
                                { value ->
                                    model.edit { it.copy(email = value) }
                                },
                                stringResource(R.string.support_email),
                                "mail@example.com",
                                Modifier.focusRequester(emailFocus).testTag("support-email"),
                                enabled = !state.frozen && !state.busy,
                                invalid = emailInvalid,
                                singleLine = true,
                            )
                            Text(
                                stringResource(
                                    if (emailInvalid) {
                                        R.string.support_email_error
                                    } else {
                                        R.string.support_email_hint
                                    },
                                ),
                                Modifier.padding(
                                    top = DesignTokens.spaceS8,
                                    bottom = DesignTokens.spaceS24,
                                ),
                                fontSize = DesignTokens.typographySizeLabel,
                                color = if (emailInvalid) {
                                    Palette.error
                                } else {
                                    Palette.muted
                                },
                            )
                            val file = state.screenshot
                            if (file != null) {
                                SupportSelectedAttachment(
                                    file.name,
                                    file.bytes,
                                    !state.frozen && !state.busy,
                                ) {
                                    model.edit { it.copy(screenshot = null) }
                                }
                            } else {
                                SupportAttachment(
                                    !state.frozen && !state.busy && !state.selecting,
                                ) {
                                    picker.launch("image/*")
                                }
                            }
                            if (state.selecting) CircularProgressIndicator()
                            if (state.fileError) {
                                Text(
                                    stringResource(R.string.support_file_error),
                                    color = Palette.error,
                                )
                            }
                            Spacer(Modifier.height(DesignTokens.spaceS24 + DesignTokens.spaceS2))
                            SupportDiagnostics(
                                state.diagnostics,
                                !state.frozen && !state.busy,
                            ) { value ->
                                model.edit { it.copy(diagnostics = value) }
                            }
                            TextButton(
                                policy,
                                Modifier.padding(
                                    top =
                                    DesignTokens.spaceS16 + DesignTokens.spaceS2,
                                ),
                            ) {
                                Text(
                                    stringResource(R.string.privacy_title),
                                    fontSize = DesignTokens.typographySizeLabel,
                                    color = Palette.muted,
                                )
                            }
                            Spacer(Modifier.height(DesignTokens.spaceS24))
                        }
                    }
                }
                if (!pinned &&
                    state.receipt == null
                ) {
                    SupportSubmissionFooter(
                        state.busy,
                        state.error,
                        state.frozen,
                        !state.selecting,
                        false,
                        Modifier.onSizeChanged { footerHeight = it.height },
                        send,
                    )
                }
            }
            if (pinned && state.receipt == null) {
                SupportSubmissionFooter(
                    state.busy,
                    state.error,
                    state.frozen,
                    !state.selecting,
                    true,
                    Modifier.onSizeChanged { footerHeight = it.height },
                    send,
                )
            }
            if (keyboardVisible && state.receipt == null) {
                SupportKeyboardBar {
                    focus.clearFocus()
                    keyboard?.hide()
                }
            }
        }
    }
}
