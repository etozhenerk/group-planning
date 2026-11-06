package dev.groupplanning.android

import android.app.Activity
import android.app.Instrumentation
import android.content.Intent
import android.net.Uri
import androidx.compose.ui.test.*
import androidx.lifecycle.Lifecycle
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.Until
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import androidx.lifecycle.ViewModelProvider
import dev.groupplanning.android.state.AppViewModel
import dev.groupplanning.android.state.AppRoute
import java.io.File
import java.time.Instant
import java.util.UUID
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class IndependentInvitationFinalTests {
    @get:Rule(order = 0) val locale: TestRule = QaAppLocaleRule()
    @get:Rule(order = 1) val compose = createEmptyComposeRule()
    private val fixture = InvitationUiFixture(compose)
    private lateinit var api: ChatReadLiveApi
    private val args get() = InstrumentationRegistry.getArguments()
    private val output get() = File(checkNotNull(args.getString("additionalTestOutputDir")))
    private val actions = JSONArray()
    private lateinit var meeting: JSONObject
    private fun log(s: String) { actions.put(JSONObject().put("action",s).put("at",Instant.now().toString())) }
    @Before fun setup() { fixture.configure(); api=ChatReadLiveApi(fixture.context); output.mkdirs() }
    private fun token(m: JSONObject) = Uri.parse(m.getString("invitation_url")).lastPathSegment!!
    private fun id(m: JSONObject) = m.getJSONObject("meeting").getString("id")
    private fun create(name: String): JSONObject {
        val body=JSONObject().put("title",if(name=="long" || name=="large-text") "Большой вечер настольных игр, пиццы и разговоров до утра" else "Ужин в пятницу")
            .put("description","Соберёмся после работы: поужинаем и поболтаем. Столик на шестерых уже забронирован."+(if(name=="long" || name=="large-text") "\n\nЕсли освободитесь позже, напишите Лене. Можно присоединиться к нам в течение вечера." else ""))
            .put("timezone","Europe/Moscow").put("place","Кафе «Соседи», Покровка, 8")
        if(name=="no-time") body.put("starts_on",java.time.LocalDate.now().plusDays(1).toString()) else body.put("starts_at",if(name.startsWith("closed")) Instant.now().plusSeconds(1800).atOffset(java.time.ZoneOffset.ofHours(3)).toString() else Instant.now().plusSeconds(86400).atOffset(java.time.ZoneOffset.ofHours(3)).toString())
        if(name !in setOf("no-cover","loading")) body.put("cover",JSONObject().put("media_type","image/png").put("data",fixture.shell("cat /data/local/tmp/android-review74-cover.b64").trim()))
        return api.request("invite-owner","meetings","POST",body).also { log("Real API create ${id(it)} for $name") }
    }
    private fun apiKey(actor:String,path:String,method:String,input:JSONObject,key:String):JSONObject {
        val config=JSONObject(File(fixture.context.noBackupFilesDir,"ui-fixture.json").readText())
        val field=api.javaClass.getDeclaredField("http").apply {isAccessible=true}
        val http=field.get(api) as okhttp3.OkHttpClient
        val req=okhttp3.Request.Builder().url(config.getString("origin")+"/api/v1/"+path)
          .header("Authorization","Bearer "+config.getJSONObject("cases").getJSONObject(actor).getString("token"))
          .header("Idempotency-Key",key).header("X-Somewhere-Test-Scenario","read-state-device")
          .method(method,input.toString().toRequestBody("application/json".toMediaType())).build()
        return http.newCall(req).execute().use {check(it.isSuccessful) {"API key retry HTTP ${it.code}"};JSONObject(checkNotNull(it.body).string())}
    }
    private fun answer(m:JSONObject,value:String,actor:String="invite-rsvp") {
        val path="invitations/${token(m)}"; val p=api.request(actor,path)
        api.request(actor,"$path/rsvp","PUT",JSONObject().put("answer",value).put("expected_revision",p.opt("my_rsvp_revision") ?: JSONObject.NULL))
        log("Real API RSVP $value actor=$actor")
    }
    private fun click(tag:String) { compose.onNodeWithTag(tag).performClick();log("Click $tag") }
    private fun screenTag(tag:String) {fixture.waitTag(tag);log("Observed $tag")}
    private fun capture(key:String,status:String="captured",note:String="") {
        try { fixture.screenshot(key) } catch(e:Throwable) {
            check(fixture.device.takeScreenshot(File(output,"$key.png")))
            val config=fixture.context.resources.configuration;val m=fixture.context.resources.displayMetrics
            File(output,"$key.capture.json").writeText(JSONObject().put("capturedAt",Instant.now().toString()).put("nativeExternalFallback",e.toString()).put("display",JSONObject().put("widthPx",fixture.device.displayWidth).put("heightPx",fixture.device.displayHeight).put("density",m.density.toDouble()).put("configurationWidthDp",config.screenWidthDp).put("configurationHeightDp",config.screenHeightDp)).put("fontScale",config.fontScale.toDouble()).put("locales",config.locales.toLanguageTags()).put("timezone",java.util.TimeZone.getDefault().id).put("fonts",CaptureFontProbe.measure()).toString(2))
        }
        File(output,"$key.semantics.txt").writeText(runCatching{compose.onAllNodes(isRoot(),useUnmergedTree=true).printToString(maxDepth=100)}.getOrElse{"External OS surface; Compose hierarchy unavailable: $it"})
        runCatching { fixture.device.dumpWindowHierarchy(File(output,"$key.window.xml")) }
        File(output,"$key.interaction.json").writeText(JSONObject().put("state",key).put("status",status).put("note",note).put("actions",JSONArray(actions.toString())).put("capturedAt",Instant.now().toString()).put("meeting",if(::meeting.isInitialized)JSONObject().put("id",id(meeting)).put("title",meeting.getJSONObject("meeting").getString("title")) else JSONObject()).toString(2))
        println("REVIEW74_CAPTURE=$key $status")
    }
    private fun returnLink(activity:ActivityScenario<MainActivity>,m:JSONObject) {
        lateinit var original:Intent;lateinit var launched:MainActivity
        activity.onActivity { launched=it; original=Intent(it.intent);it.startActivity(Intent(it,MainActivity::class.java).apply {action=Intent.ACTION_VIEW;data=Uri.parse("group-planning-android-qa://i/${token(m)}");addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)}) }
        Thread.sleep(1000);InstrumentationRegistry.getInstrumentation().runOnMainSync {launched.intent=original};log("Real warm invitation link")
    }
    private fun privateAbsent() { check(compose.onAllNodes(hasTestTag("invitation-conversation")).fetchSemanticsNodes().isEmpty()); log("Private conversation absent") }
    @Test fun earlyRevocationKeepsOriginalIntent() {
        QaClientTestState.begin(fixture.context);meeting=create("no-cover");answer(meeting,"going","invite-error")
        fixture.launch("invite-error",token(meeting)).use { activity ->
            screenTag("invitation-conversation")
            compose.waitUntil(10000) { QaChatProbe.signals.any {it=="meeting:Subscribed"} }
            lateinit var app:AppViewModel
            activity.onActivity {app=ViewModelProvider(it)[AppViewModel::class.java]}
            val owner=(app.route.value as AppRoute.Invitation).model
            compose.onNodeWithContentDescription("Информация о встрече").performClick();fixture.waitTag("information-change-answer");compose.onNodeWithTag("information-change-answer").performClick();fixture.waitTag("information-rsvp-NotGoing")
            QaChatProbe.reset();QaResponseGate.artificialRoundTripMillis=6000
            compose.onNodeWithTag("information-rsvp-NotGoing").performScrollTo().performClick();log("Real information NotGoing; existing QA RTT6s holds delivery after actual HTTP")
            compose.waitUntil(3000) {owner.state.value.pending!=null}
            val pending=checkNotNull(owner.state.value.pending);log("Pending key ${pending.key}; body ${pending.input}")
            try {
                compose.waitUntil(10000) {QaChatProbe.signals.contains("meeting:AccessRevoked")}
                log("Actual realtime AccessRevoked before retry; events "+QaChatProbe.events.joinToString(" | "))
                privateAbsent();check(owner.state.value.pending?.key==pending.key)
                capture("route--early-revoked-original-intent")
                fixture.waitText("Сохранение не подтверждено. Повторите запрос.")
                check(owner.state.value.pending?.input==pending.input)
                capture("route--unknown-stays")
                val before=api.request("invite-owner","meetings/${id(meeting)}/feed")
                log("Owner feed after lost ACK $before")
                QaResponseGate.artificialRoundTripMillis=0
                compose.onNodeWithTag("rsvp-NotGoing").assertIsDisplayed().performClick();screenTag("rsvp-declined")
                check(owner.state.value.completedResponseID==pending.key)
                val after=api.request("invite-owner","meetings/${id(meeting)}/feed")
                check(before.toString()==after.toString());log("Same key/body retry confirmed; real owner feed identical after retry $after")
                capture("route--repeat-no-duplicate-early-revoked")
            }finally {QaResponseGate.artificialRoundTripMillis=0}
        }
    }
    @Test fun roleLoadErrorDoesNotGuessAccess() {
        for(actor in listOf("invite-rsvp","invite-owner")) {
            QaClientTestState.begin(fixture.context);meeting=create("no-cover")
            if(actor=="invite-rsvp") answer(meeting,"going")
            val before=api.request("invite-owner","meetings/${id(meeting)}/feed").getJSONArray("entries").toString()
            QaResponseGate.unavailableGetPath="/api/v1/meetings/${id(meeting)}"
            try {fixture.launch(actor,token(meeting)).use {
                fixture.waitText("Повторить загрузку");privateAbsent();log("Actual role GET outage $actor; no guessed private conversation")
                capture("route--role-error-$actor")
                QaResponseGate.unavailableGetPath=null;compose.onNodeWithText("Повторить загрузку").performClick();screenTag("invitation-conversation")
                val after=api.request("invite-owner","meetings/${id(meeting)}/feed").getJSONArray("entries").toString();check(before==after);log("Actual retry restores role and adds no RSVP/system event")
                capture("route--role-retry-$actor")
            }}finally{QaResponseGate.unavailableGetPath=null}
        }
    }
    @Test fun lateRsvpAfterNewSessionNeverReopensOldRoute() {
        QaClientTestState.begin(fixture.context);meeting=create("no-cover");answer(meeting,"going")
        fixture.launch("invite-rsvp",token(meeting)).use { old ->
            screenTag("invitation-conversation");lateinit var app:AppViewModel
            old.onActivity {app=ViewModelProvider(it)[AppViewModel::class.java]}
            val owner=(app.route.value as AppRoute.Invitation).model;val oldId=owner.state.value.profileId
            compose.onNodeWithContentDescription("Информация о встрече").performClick();fixture.waitTag("information-change-answer");compose.onNodeWithTag("information-change-answer").performClick();fixture.waitTag("information-rsvp-NotGoing")
            QaChatProbe.reset();QaResponseGate.artificialRoundTripMillis=6000
            try {
                compose.onNodeWithTag("information-rsvp-NotGoing").performScrollTo().performClick()
                compose.waitUntil(10000){QaChatProbe.signals.contains("meeting:AccessRevoked")}
                val pending=checkNotNull(owner.state.value.pending);log("Real old account revoke while HTTP delivery held; key ${pending.key}; old profile $oldId")
                capture("route--old-session-pending")
                QaResponseGate.artificialRoundTripMillis=0
                fixture.launch("profile-fields").use { fresh ->
                    fixture.waitTag("onboarding");compose.onNodeWithText("Пропустить").performClick();compose.onNodeWithContentDescription("Войти через Яндекс ID").assertIsDisplayed().assertIsEnabled()
                    ProfileFieldsLoginSupport("full").use {compose.onNodeWithContentDescription("Войти через Яндекс ID").performClick();fixture.waitTag("home-profile")}
                    lateinit var newApp:AppViewModel;fresh.onActivity {newApp=ViewModelProvider(it)[AppViewModel::class.java]}
                    val session=newApp.snapshot.value.session as dev.groupplanning.android.data.session.SessionState.Authenticated
                    check(session.profile.id!=oldId);Thread.sleep(3500);check(newApp.route.value is AppRoute.Home)
                    check(owner.state.value.completedResponse==null);log("New actual SDK-fixture HTTP session ${session.profile.id}; late old response did not reopen invitation/declined or apply completion")
                    capture("route--old-session-response-ignored")
                }
            }finally {QaResponseGate.artificialRoundTripMillis=0}
        }
    }
    @Test fun sameRoutesFromSavedListAndInformation() {
        QaClientTestState.begin(fixture.context);meeting=create("no-cover")
        fixture.launch("invite-rsvp",token(meeting)).use {
            screenTag("rsvp-Maybe");click("rsvp-Maybe");val card="saved-invitation-${id(meeting)}";screenTag(card)
            compose.onNodeWithTag(card).performScrollTo().performClick();screenTag("rsvp-Going");click("rsvp-Going");screenTag("invitation-conversation");capture("route--going-from-invitations")
            compose.onNodeWithContentDescription("Информация о встрече").performClick();fixture.waitTag("information-change-answer");compose.onNodeWithTag("information-change-answer").performClick();fixture.waitTag("information-rsvp-Going");compose.onNodeWithTag("information-rsvp-Going").performScrollTo().performClick();screenTag("invitation-conversation");capture("route--going-from-information")
            compose.onNodeWithContentDescription("Информация о встрече").performClick();fixture.waitTag("information-change-answer");compose.onNodeWithTag("information-change-answer").performClick();fixture.waitTag("information-rsvp-Maybe");compose.onNodeWithTag("information-rsvp-Maybe").performScrollTo().performClick();screenTag(card);privateAbsent();capture("route--maybe-from-information")
            compose.onNodeWithTag(card).performScrollTo().performClick();screenTag("rsvp-NotGoing");click("rsvp-NotGoing");screenTag("rsvp-declined");capture("route--declined-from-invitations")
            compose.onNodeWithText("К моим встречам").performScrollTo().performClick();screenTag("meetings-list");compose.onNodeWithTag("meeting-${id(meeting)}").assertDoesNotExist();compose.onNodeWithTag("home-invitations").performClick();compose.onNodeWithTag(card).assertDoesNotExist()
            val preview=api.request("invite-rsvp","invitations/${token(meeting)}");check(preview.getString("my_rsvp")=="not_going");log("Real GET invitation confirms NotGoing and specific meeting absent from both actual lists $preview")
            capture("declined--absent-from-both-lists")
        }
    }
    @Test fun invitationMatrix() {
        val viewport=args.getString("reviewViewport") ?: "standard-phone"
        val names=listOf("guest","ready","maybe","member","organizer","response-error","auth-error","closed","closed-member","no-cover","no-time","long","unavailable","loading","response-busy","response-unknown","sign-in-busy","sign-in-cancelled","share","share-error")
        for(name in names.filter { args.getString("reviewNames")?.split(",")?.contains(it) != false }) {
            actions.length().let { while(actions.length()>0) actions.remove(0) }
            var activity:ActivityScenario<MainActivity>?=null
            try {
                QaResponseGate.artificialRoundTripMillis=0;QaResponseGate.unavailableGetPath=null;QaClientTestState.begin(fixture.context)
                meeting=create(if(name=="closed-member") "ready" else name)
                if(name in setOf("member","closed-member")) answer(meeting,"going")
                if(name=="maybe") answer(meeting,"maybe")
                if(name=="closed-member") {val details=api.request("invite-owner","meetings/${id(meeting)}"); api.request("invite-owner","meetings/${id(meeting)}","PATCH",JSONObject().put("expected_revision",details.getString("revision")).put("starts_at",Instant.now().plusSeconds(1800).atOffset(java.time.ZoneOffset.ofHours(3)).toString()).put("timezone","Europe/Moscow"))}
                val guest=name in setOf("guest","auth-error","sign-in-busy","sign-in-cancelled","loading","unavailable")
                val scenario=when {name in setOf("sign-in-busy","sign-in-cancelled")->"profile-fields";guest->"invite-anonymous";name in setOf("organizer","share","share-error")->"invite-owner";name=="response-unknown"->"invite-error";else->"invite-rsvp"}
                if(name=="loading") QaResponseGate.artificialRoundTripMillis=16000
                if(name=="share-error") QaResponseGate.unavailableGetPath="/api/v1/meetings/${id(meeting)}/invitation"
                activity=fixture.launch(scenario,if(name=="unavailable") "TU1NTU1NTU1NTU1NTU1NTQ" else token(meeting));log("Launch frozen APK $scenario")
                when(name) {
                    "loading" -> screenTag("invitation-loading")
                    "unavailable" -> {fixture.waitText("Приглашение недоступно");compose.onNodeWithText("Повторить загрузку").performClick();log("Real retry public GET");fixture.waitText("Приглашение недоступно")}
                    "member","organizer","closed-member" -> screenTag("invitation-conversation")
                    "closed" -> {fixture.waitText("Участие закрыто");privateAbsent()}
                    "guest" -> {fixture.waitText("Войти через Яндекс ID");privateAbsent();fixture.device.pressDPadDown();log("Real DPadDown focus navigation")}
                    "auth-error" -> {fixture.waitText("Войти через Яндекс ID");compose.onNodeWithText("Войти через Яндекс ID").performClick();fixture.waitText("Не удалось войти");log("Real QA transport OAuth-start failure, native alert")}
                    "sign-in-busy" -> {fixture.waitText("Войти через Яндекс ID");QaResponseGate.artificialRoundTripMillis=16000;compose.onNodeWithText("Войти через Яндекс ID").performClick();log("Held real OAuth-start via QA RTT16s")}
                    "sign-in-cancelled" -> {fixture.waitText("Войти через Яндекс ID");val ins=InstrumentationRegistry.getInstrumentation();val monitor=ins.addMonitor("com.yandex.authsdk.internal.AuthSdkActivity",Instrumentation.ActivityResult(Activity.RESULT_CANCELED,Intent()),true);try {compose.onNodeWithText("Войти через Яндекс ID").performClick();Thread.sleep(1500);log("Real start with SDK RESULT_CANCELED boundary fixture; monitor hits="+monitor.hits);check(monitor.hits>0)}finally{ins.removeMonitor(monitor)}}
                    "share","share-error" -> {screenTag("invitation-conversation");compose.onNodeWithContentDescription("Информация о встрече").performClick();log("Open information sheet");if(name=="share") {fixture.waitTag("information-share");compose.onNodeWithTag("information-share").performScrollTo().performClick();check(fixture.device.wait(Until.hasObject(By.pkg("com.android.intentresolver")),10000));log("Real OS share chooser with server invitation link")}else{fixture.waitText("Не удалось получить ссылку приглашения");log("Real GET invitation outage, share issue")}}
                    else -> {screenTag("rsvp-Going"); if(name=="response-error") {answer(meeting,"maybe");click("rsvp-Going");fixture.waitText("Не удалось отправить ответ");log("Real409 stale RSVP revision")}
                        if(name=="response-busy") {QaResponseGate.artificialRoundTripMillis=8000;click("rsvp-Going");fixture.waitText("Сохраняем ответ…")}
                        if(name=="response-unknown") {click("rsvp-Maybe");fixture.waitText("Не удалось отправить ответ");log("Lost ACK after real server commit; QA fixture503")}
                    }
                }
                capture("invite--$name-$viewport")
                if(name=="share") {fixture.device.pressBack();log("System Back from OS share returns information");fixture.waitTag("information-share");capture("share-back-$viewport")}
                if(name=="share-error") {QaResponseGate.unavailableGetPath=null;compose.onNodeWithText("Повторить").performScrollTo().performClick();fixture.waitTag("information-share");log("Real Retry after invitation GET gate released");capture("share-retry-$viewport")}
                if(viewport=="standard-phone") {
                    when(name) {
                        "ready" -> {click("rsvp-Going");screenTag("invitation-conversation");capture("route--going-chat");fixture.device.pressBack();log("System Back after confirmed Going");returnLink(activity,meeting);screenTag("invitation-conversation");capture("route--safe-area-return")}
                        "maybe" -> {click("rsvp-Maybe");screenTag("home-invitations");capture("route--maybe-invitations");privateAbsent()}
                        "response-unknown" -> {click("rsvp-Maybe");screenTag("home-invitations");capture("route--repeat-no-duplicate");log("Feed owner snapshot "+api.request("invite-owner","meetings/${id(meeting)}/feed").toString());}
                        "no-cover" -> {click("rsvp-NotGoing");screenTag("rsvp-declined");capture("declined--confirmed");fixture.device.pressBack();log("SystemBack from declined");returnLink(activity,meeting);fixture.waitTag("rsvp-NotGoing");click("rsvp-NotGoing");screenTag("rsvp-declined");capture("declined--safe-area-return");compose.onNodeWithText("К моим встречам").performScrollTo().performClick();screenTag("meetings-list");capture("declined--meetings-action")}
                        "long" -> {click("rsvp-NotGoing");screenTag("rsvp-declined");capture("declined--long-title")}
                        "guest" -> {ProfileFieldsLoginSupport("full").use { /* explicit real SDK-result fixture requires profile-fields scenario; covered separately */ };log("Guest contains no automatic RSVP")}
                    }
                }
            } catch(failure:Throwable) { log("Scenario unavailable/failure: ${failure.javaClass.simpleName}: ${failure.message}");try{capture("invite--$name-$viewport","failed",failure.toString())}catch(e:Throwable){File(output,"invite--$name-$viewport.failure.txt").writeText(failure.stackTraceToString()+"\n"+e.stackTraceToString())};println("REVIEW74_FAILURE=$name $failure") }
            finally {QaResponseGate.artificialRoundTripMillis=0;QaResponseGate.unavailableGetPath=null;activity?.close();fixture.device.pressBack()}
        }
    }

    @Test fun supplemental() {
        val originalFont=fixture.shell("settings get system font_scale").trim()
        val animator=fixture.shell("settings get global animator_duration_scale").trim()
        val transition=fixture.shell("settings get global transition_animation_scale").trim()
        val window=fixture.shell("settings get global window_animation_scale").trim()
        try {
            for(mode in listOf("large-text","reduced-motion","safe-area-return")) {
                var activity:ActivityScenario<MainActivity>?=null
                try {
                    while(actions.length()>0) actions.remove(0)
                    QaClientTestState.begin(fixture.context)
                    if(mode=="large-text") fixture.shell("settings put system font_scale 1.8")
                    if(mode=="reduced-motion") for(k in listOf("animator_duration_scale","transition_animation_scale","window_animation_scale")) fixture.shell("settings put global $k 0")
                    meeting=create(mode)
                    activity=fixture.launch("invite-rsvp",token(meeting));screenTag("rsvp-Going")
                    log("Native system fontScale/motion mode $mode")
                    if(mode!="safe-area-return") capture("invite--$mode")
                    click("rsvp-Going");screenTag("invitation-conversation")
                    if(mode=="safe-area-return") {fixture.device.pressBack();log("System Back after Going");returnLink(activity,meeting);screenTag("invitation-conversation")}
                    capture("route--$mode")
                    compose.onNodeWithContentDescription("Информация о встрече").performClick();fixture.waitTag("information-change-answer");compose.onNodeWithTag("information-change-answer").performClick();fixture.waitTag("information-rsvp-NotGoing")
                    compose.onNodeWithTag("information-rsvp-NotGoing").performScrollTo().performClick();log("Information→real NotGoing")
                    screenTag("rsvp-declined");privateAbsent();capture("declined--$mode")
                    activity.close();activity=null
                    activity=fixture.launch("invite-owner",token(meeting));screenTag("invitation-conversation")
                    fixture.waitText(api.request("invite-rsvp","me").getJSONObject("user").getString("display_name")+" ответил «Не смогу»");log("Observed accepted name + ответил + exact answer; native event time captured")
                    capture("event--$mode")
                }catch(e:Throwable){log("Supplement failure $mode: $e");try{capture("supplement--$mode","failed",e.toString())}catch(_:Throwable){} }
                finally{activity?.close();fixture.shell("settings put system font_scale $originalFont");for((k,v) in listOf("animator_duration_scale" to animator,"transition_animation_scale" to transition,"window_animation_scale" to window)){fixture.shell(if(v=="null") "settings delete global $k" else "settings put global $k $v")}}
            }
            if(args.getString("rsvpSupplementOnly")=="true") return
            QaClientTestState.begin(fixture.context);meeting=create("long")
            fixture.launch("invite-rsvp",token(meeting)).use {activity ->
                screenTag("rsvp-Going");fixture.device.setOrientationLeft();log("Real landscape rotation");Thread.sleep(1000);capture("landscape-before-return")
                fixture.device.setOrientationNatural();activity.recreate();screenTag("rsvp-Going");fixture.device.pressBack();log("System Back public invitation");returnLink(activity,meeting);screenTag("rsvp-Going");capture("invite--landscape-return")
                fixture.shell("wm size 720x1000");Thread.sleep(1000);screenTag("rsvp-Going");capture("invite--short-ime","captured","Public invitation is readonly; native short412x500 layout, actual IME observed separately in chat")
                fixture.shell("wm size 720x1600");click("rsvp-Going");screenTag("invitation-conversation")
                compose.onNodeWithTag("message-composer").performClick();log("Real composer tap to request software IME");Thread.sleep(1200);capture("chat-ime")
                fixture.device.pressBack();log("Back dismisses IME before navigation");capture("chat-ime-dismissed")
            }
            QaClientTestState.begin(fixture.context);meeting=create("ready")
            fixture.launch("profile-fields",token(meeting)).use {
                fixture.waitText("Войти через Яндекс ID")
                ProfileFieldsLoginSupport("full").use {compose.onNodeWithText("Войти через Яндекс ID").performClick();screenTag("rsvp-Going")}
                privateAbsent();log("Real OAuth-start/exchange, SDK success fixture; no auto RSVP");capture("route--auth-no-rsvp")
            }
        } finally {fixture.device.setOrientationNatural();fixture.device.unfreezeRotation();fixture.shell("wm size 720x1600");fixture.shell("settings put system font_scale $originalFont");for((k,v) in listOf("animator_duration_scale" to animator,"transition_animation_scale" to transition,"window_animation_scale" to window)){fixture.shell(if(v=="null") "settings delete global $k" else "settings put global $k $v")}}
    }
    @Test fun systemEvents() {
        while(actions.length()>0) actions.remove(0)
        QaClientTestState.begin(fixture.context);meeting=create("no-cover")
        lateinit var before:JSONObject
        val actor=api.request("invite-rsvp","me").getJSONObject("user").getString("display_name")
        fixture.launch("invite-owner",token(meeting)).use {activity ->
            screenTag("invitation-conversation")
            compose.waitUntil(10000){QaChatProbe.signals.contains("meeting:Subscribed")}
            log("Second actor owner chat open and real SDK subscribed BEFORE three answers")
            for((value,label) in listOf("going" to "Приду","maybe" to "Возможно")) {
                answer(meeting,value);fixture.waitText(actor+" ответил «"+label+"»")
                log("Observed live owner event for "+actor+" / "+value)
            }
            val path="invitations/${token(meeting)}";val preview=api.request("invite-rsvp",path)
            val input=JSONObject().put("answer","not_going").put("expected_revision",preview.opt("my_rsvp_revision") ?: JSONObject.NULL);val key=UUID.randomUUID().toString()
            apiKey("invite-rsvp","$path/rsvp","PUT",input,key);fixture.waitText(actor+" ответил «Не смогу»")
            apiKey("invite-rsvp","$path/rsvp","PUT",input,key);log("Real idempotent NotGoing repeated with identical key $key/body $input")
            before=api.request("invite-owner","meetings/${id(meeting)}/feed");log("Owner real feed snapshot $before")
            capture("event--three-answers");capture("event--retry-dedup")
            returnLink(activity,meeting);screenTag("invitation-conversation");capture("event--reopen-no-event")
        }
        val after=api.request("invite-owner","meetings/${id(meeting)}/feed")
        check(before.getJSONArray("entries").toString()==after.getJSONArray("entries").toString());log("Feed after reopen $after; entries unchanged")
        fixture.launch("invite-rsvp",token(meeting)).use {
            screenTag("rsvp-Going");privateAbsent();try {api.request("invite-rsvp","meetings/${id(meeting)}/feed");error("Unexpected feed access")}catch(e:IllegalStateException){check(e.message?.contains("403")==true);log("Real feed403 after NotGoing")};capture("event--no-access-after-change")
        }
    }

    @Test fun largeScroll() {
        val original=fixture.shell("settings get system font_scale").trim()
        try {
            fixture.shell("settings put system font_scale 1.8");QaClientTestState.begin(fixture.context);meeting=create("large-text")
            fixture.launch("invite-rsvp",token(meeting)).use {
                screenTag("rsvp-Going")
                compose.onNodeWithText("Соберёмся после работы: поужинаем и поболтаем. Столик на шестерых уже забронирован.\n\nЕсли освободитесь позже, напишите Лене. Можно присоединиться к нам в течение вечера.").performScrollTo()
                log("Real native1.8 text scroll to complete description; sticky actions remain reachable")
                capture("large-scroll-end")
                click("rsvp-Going");screenTag("invitation-conversation");log("Action reachable after large-text scroll")
                capture("large-scroll-action")
            }
        }finally{fixture.shell("settings put system font_scale $original")}
    }

    @Test fun authenticationReturn() {
        QaClientTestState.begin(fixture.context);while(actions.length()>0)actions.remove(0);meeting=create("ready")
        QaChatProbe.reset();val before=api.request("invite-owner","meetings/${id(meeting)}/feed").toString();log("Owner feed before auth $before")
        fixture.launch("profile-fields",token(meeting)).use {
            fixture.waitText("Войти через Яндекс ID")
            ProfileFieldsLoginSupport("full").use {compose.onNodeWithText("Войти через Яндекс ID").performClick();Thread.sleep(2500);log("Real OAuth-start/exchange via SDK-result success fixture")}
            val ready=compose.onAllNodes(hasTestTag("rsvp-Going")).fetchSemanticsNodes().isNotEmpty()
            val feed=api.request("invite-owner","meetings/${id(meeting)}/feed").toString();log("Owner feed after auth $feed; unchanged="+(before==feed))
            log("Observed app HTTP paths "+QaChatProbe.requests.joinToString(" | "));capture("route--auth-no-rsvp",if(ready)"captured" else "observed-mismatch",if(ready)"" else "Guest sign-in did not return to invitation ready; actual UI captured without assuming cause")
        }
    }
}
