package dev.groupplanning.android.ui.meetings

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.groupplanning.android.R
import dev.groupplanning.android.data.api.models.MeetingPeriod
import dev.groupplanning.android.data.api.models.MeetingSummary
import dev.groupplanning.android.data.api.models.ServerCounter
import dev.groupplanning.android.state.covers.CoverSource
import dev.groupplanning.android.ui.components.AppIcon
import dev.groupplanning.android.ui.components.LocalViewer
import dev.groupplanning.android.ui.components.UserAvatar
import dev.groupplanning.android.ui.covers.CoverImage
import dev.groupplanning.android.ui.theme.DesignTokens
import dev.groupplanning.android.ui.theme.Palette
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
internal fun MeetingCard(
    meeting: MeetingSummary,
    inviter: String? = null,
    invitation: Boolean = false,
    onClick: () -> Unit,
) {
    val date = meeting.startsAt?.instant?.atZone(ZoneId.of(meeting.timezone))?.toLocalDate()
        ?: meeting.startsOn?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
    val weekend = date?.dayOfWeek?.value?.let { it >= 6 } == true
    val accent = if (weekend) Color(0xff425653) else Color(0xff57475e)
    val tint = if (weekend) Color(0xff2e3938) else Color(0xff38313d)
    val own = meeting.organizerId != null && meeting.organizerId == LocalViewer.current
    val crown = stringResource(R.string.organizer_badge)
    val cover = meeting.coverUrl != null && LocalDensity.current.fontScale <= 1.5f
    val coverReserve = if (cover) {
        if (invitation) {
            DesignTokens.componentCardCoverMobileWidth + DesignTokens.spaceS10
        } else {
            DesignTokens.componentCardCoverMobileWidth + DesignTokens.spaceS16 +
                DesignTokens.spaceS6
        }
    } else {
        DesignTokens.spaceS0
    }
    BoxWithConstraints(
        Modifier.fillMaxWidth().padding(
            top = DesignTokens.spaceS12,
            bottom = DesignTokens.spaceS16,
        ),
    ) {
        val dateMaximum = maxWidth - if (cover) {
            DesignTokens.componentMobileInvitationCardCoverDateReserve
        } else {
            DesignTokens.componentMobileInvitationCardDateInset * 2
        }
        Surface(
            onClick,
            Modifier.fillMaxWidth().testTag("meeting-${meeting.id}"),
            shape = RoundedCornerShape(
                if (invitation) DesignTokens.radiusCard else DesignTokens.spaceS20,
            ),
            color = tint,
            border = BorderStroke(
                DesignTokens.spaceS1,
                if (invitation) DesignTokens.colorLine else DesignTokens.colorCalendarBorder,
            ),
        ) {
            Column(
                Modifier.heightIn(
                    min = if (invitation) {
                        DesignTokens.componentMobileInvitationCardMinimumHeight
                    } else {
                        DesignTokens.componentCardMinimumHeightMobile
                    },
                ).padding(
                    start = 17.dp,
                    end = 17.dp,
                    top = 26.dp,
                    bottom = if (invitation) {
                        DesignTokens.componentMobileInvitationCardAnswerInsetBottom
                    } else {
                        DesignTokens.spaceS24 + DesignTokens.spaceS4 + DesignTokens.spaceS1
                    },
                ),
                verticalArrangement = Arrangement.SpaceBetween,
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(DesignTokens.spaceS8)) {
                    Row(
                        modifier = Modifier.padding(end = coverReserve),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS6),
                    ) {
                        Text(
                            meeting.title,
                            Modifier.weight(1f, false),
                            fontSize = 19.sp,
                            lineHeight = 23.75.sp,
                            letterSpacing = (-.45).sp,
                            fontWeight = FontWeight.Bold,
                            color = Palette.text,
                        )
                        if (own) {
                            AppIcon(
                                R.drawable.ic_crown,
                                Modifier.size(18.dp).semantics {
                                    contentDescription = crown
                                },
                                tint = if (weekend) Color(0xffc2d8cb) else Palette.accent,
                            )
                        }
                    }
                    Row(
                        modifier = Modifier.padding(end = coverReserve),
                        horizontalArrangement = Arrangement.spacedBy(DesignTokens.spaceS6),
                    ) {
                        AppIcon(R.drawable.ic_place, Modifier.size(15.dp).padding(top = 1.dp))
                        Text(
                            meeting.place ?: stringResource(R.string.calendar_place_missing),
                            color = Palette.muted,
                            fontSize = 13.sp,
                            lineHeight = 18.85.sp,
                        )
                    }
                    if (invitation && inviter != null) {
                        Text(
                            stringResource(R.string.invitation_author, inviter),
                            Modifier.padding(top = DesignTokens.spaceS8),
                            fontSize = DesignTokens.typographySizeCaption,
                            color = Palette.muted,
                        )
                    }
                    if (!invitation && meeting.period == MeetingPeriod.Past) {
                        meeting.unreadCount?.takeIf { it > ServerCounter.Zero }
                            ?.let {
                                MeetingUnreadNotice(
                                    it,
                                    Modifier.padding(top = DesignTokens.spaceS12),
                                )
                            }
                    }
                }
                if (invitation) {
                    Text(
                        stringResource(R.string.invitation_change_answer),
                        Modifier.padding(top = DesignTokens.spaceS8),
                        fontSize = DesignTokens.typographySizeLabel,
                        lineHeight =
                        DesignTokens.typographySizeLabel *
                            DesignTokens.typographyLineHeightLabel,
                        fontWeight = FontWeight.Medium,
                        color = Palette.accent,
                    )
                }
            }
        }
        if (cover) {
            Box(
                Modifier.align(Alignment.TopEnd).offset(x = (-13).dp, y = (-10).dp)
                    .size(102.dp, 101.dp).rotate(if (weekend) -4f else 5f)
                    .shadow(7.dp, RoundedCornerShape(16.dp))
                    .border(
                        3.dp,
                        if (weekend) Color(0xff4b615b) else Color(0xff5e4f63),
                        RoundedCornerShape(16.dp),
                    ).padding(3.dp),
            ) {
                CoverImage(
                    CoverSource.Remote(checkNotNull(meeting.coverUrl), meeting.id),
                    Modifier.fillMaxSize(),
                    thumbnail = true,
                )
            }
        }
        if (!invitation && meeting.period != MeetingPeriod.Past) {
            meeting.unreadCount?.takeIf { it > ServerCounter.Zero }?.let { count ->
                MeetingUnreadNotice(
                    count,
                    Modifier.align(Alignment.BottomStart).padding(
                        start = DesignTokens.componentMobileUnreadInsetStart,
                        end = DesignTokens.componentMobileUnreadReserveEnd,
                        bottom = DesignTokens.componentMobileUnreadInsetBottom,
                    ),
                )
            }
        }
        if (!invitation) {
            Row(
                Modifier.align(Alignment.BottomEnd).offset(x = (-13).dp, y = 15.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy((-8).dp),
            ) {
                meeting.participantPreview.take(3).forEachIndexed { index, user ->
                    UserAvatar(
                        user.displayName,
                        user.avatarUrl,
                        Modifier.border(2.dp, Palette.background, CircleShape),
                        avatarColor = listOf(
                            Color(0xffc2af9f),
                            Color(0xffc3b5d1),
                            Color(0xffb2c4bc),
                        )[index],
                    )
                }
                val remaining = meeting.participantCount - meeting.participantPreview.take(3).size
                if (remaining > 0 || meeting.participantPreview.isEmpty()) {
                    Box(
                        Modifier.size(32.dp).clip(CircleShape).background(Palette.surface)
                            .border(2.dp, Palette.background, CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            if (meeting.participantPreview.isEmpty()) {
                                "${meeting.participantCount}"
                            } else {
                                "+$remaining"
                            },
                            color = Palette.text,
                            fontSize = 10.sp,
                        )
                    }
                }
            }
        }
        Surface(
            Modifier.align(Alignment.TopStart).offset(
                x = if (invitation) {
                    DesignTokens.componentMobileInvitationCardDateInset
                } else {
                    DesignTokens.componentMobileInvitationCardInsetInline
                },
                y = (-12).dp,
            ).widthIn(max = dateMaximum),
            shape = RoundedCornerShape(8.dp),
            color = accent,
            border = BorderStroke(1.dp, Color(0x09ffffff)),
        ) {
            val day = date?.format(
                DateTimeFormatter.ofPattern(
                    "EE, d MMMM",
                    Locale.forLanguageTag("ru"),
                ),
            )?.replaceFirstChar { it.uppercase() }
                ?: stringResource(R.string.meeting_without_time)
            val clock = meeting.startsAt?.instant?.atZone(ZoneId.of(meeting.timezone))
                ?.format(DateTimeFormatter.ofPattern("HH:mm"))
            Text(
                when {
                    clock != null -> "$day · $clock"
                    date != null -> stringResource(R.string.meeting_card_time_unspecified, day)
                    else -> day
                },
                Modifier.width(IntrinsicSize.Max).padding(
                    horizontal = DesignTokens.spaceS10,
                    vertical = DesignTokens.spaceS4,
                ),
                color = if (weekend) Color(0xffdcece5) else Color(0xffede0f1),
                fontSize = 11.sp,
                lineHeight = 15.4.sp,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}
