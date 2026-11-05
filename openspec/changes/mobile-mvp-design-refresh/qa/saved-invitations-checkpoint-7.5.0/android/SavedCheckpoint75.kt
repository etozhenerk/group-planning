package dev.groupplanning.android

import androidx.compose.ui.test.*
import androidx.lifecycle.Lifecycle
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import java.io.File
import java.time.Instant
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class SavedCheckpoint75 {
    @get:Rule(order=0) val locale:TestRule=QaAppLocaleRule()
    @get:Rule(order=1) val compose=createEmptyComposeRule()
    private val f=InvitationUiFixture(compose)
    private val out get()=File(checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")))
    private val actions=JSONArray()
    private val result=JSONObject()
    private val card="saved-invitation-22222222-2222-4222-8222-222222222222"
    private val explanation="Здесь встречи, на которые вы ответили «Возможно». Откройте приглашение, чтобы изменить ответ."
    private fun log(s:String){actions.put(JSONObject().put("action",s).put("at",Instant.now().toString()))}
    @Before fun configure(){f.configure();out.mkdirs()}
    private fun capture(name:String){f.screenshot(name);File(out,"$name.semantics.txt").writeText(compose.onAllNodes(isRoot(),useUnmergedTree=true).printToString(maxDepth=100));File(out,"$name.actions.json").writeText(JSONObject().put("actions",JSONArray(actions.toString())).put("at",Instant.now().toString()).toString(2))}
    private fun launch(scenario:String,body:(ActivityScenario<MainActivity>)->Unit){f.launch(scenario).use{a->try{body(a)}catch(e:Throwable){runCatching{capture("failure-live")};throw e}}}
    private fun openTab(){f.waitTag("home-invitations");compose.onNodeWithTag("home-invitations").performClick()}
    private fun waitAbsent(text:String){compose.waitUntil(10000){compose.onAllNodesWithText(text).fetchSemanticsNodes().isEmpty()}}
    @Test fun shortSavedSmoke(){
        val originalFont=f.shell("settings get system font_scale").trim()
        val api=ChatReadLiveApi(f.context)
        try{
            launch("saved-invitations"){
                openTab();f.waitTag(card);compose.onAllNodesWithText(explanation).assertCountEquals(1);compose.onNodeWithText("Приглашает Саша",useUnmergedTree=true).assertIsDisplayed();compose.onNodeWithText("Изменить ответ",substring=true,useUnmergedTree=true).assertExists();compose.onNodeWithContentDescription("Показано приглашений: 1").assertExists();log("Ready: real Maybe card, inviter, answer action, count1, one explanation");capture("ready")
                val before=api.request("saved-invitations","invitations/QUFBQUFBQUFBQUFBQUFBQQ")
                compose.onNodeWithTag(card).performClick();f.waitTag("rsvp-Maybe");val after=api.request("saved-invitations","invitations/QUFBQUFBQUFBQUFBQQ");File(out,"preview-before-open.json").writeText(before.toString(2));File(out,"preview-after-open.json").writeText(after.toString(2));check(before.optString("my_rsvp_revision")==after.optString("my_rsvp_revision"));log("Opening card leaves server RSVP revision unchanged")
                compose.onNodeWithTag("rsvp-Going").performScrollTo().performClick();f.waitText("Сохранение не подтверждено. Повторите запрос.");compose.onNodeWithTag("rsvp-Maybe").assertIsSelected();log("Fixture intentional503 leaves confirmed Maybe; retry required");capture("response-retry")
                compose.onNodeWithTag("rsvp-Going").performClick();f.waitTag("invitation-conversation");log("Retry Going -> real conversation");capture("going-chat");f.device.pressBack();f.waitTag("home-invitations");openTab();f.waitText("Приглашений пока нет");compose.onAllNodesWithTag(card).assertCountEquals(0);compose.onNodeWithContentDescription("Показано приглашений: 0").assertExists();log("Back, invitations: card removed and count0");capture("empty-after-going");result.put("answerAndCounter",true)
            }
            launch("saved-error"){a->
                openTab();f.waitText("Не удалось загрузить приглашения");compose.onAllNodesWithText(explanation).assertCountEquals(1);log("Real first GET503 initial failure");capture("initial-error");compose.onNodeWithText("Повторить загрузку").performScrollTo().performClick();f.waitTag(card);log("Initial retry loaded real card");result.put("initialRetry",true)
                QaResponseGate.unavailableGetPath="/api/v1/invitations";a.moveToState(Lifecycle.State.CREATED);a.moveToState(Lifecycle.State.RESUMED);compose.onNodeWithTag("saved-invitations-list").performScrollToIndex(0);f.waitText("Не удалось обновить приглашения");compose.onNodeWithTag(card).assertExists();log("Refresh transport outage retains card");capture("refresh-retain");QaResponseGate.unavailableGetPath=null;compose.onNodeWithContentDescription("Повторить обновление").performClick();waitAbsent("Не удалось обновить приглашения");f.waitTag(card);log("Refresh retry clears error and preserves card");result.put("refreshRetainRetry",true)
                f.shell("wm size 640x1280");f.shell("settings put system font_scale 1.8");Thread.sleep(700);f.waitTag("saved-invitations-list");compose.onNodeWithTag("saved-invitations-list").performScrollToIndex(0);capture("narrow-large-top");compose.onNodeWithText("Приглашает Саша",useUnmergedTree=true).performScrollTo().assertIsDisplayed();compose.onNodeWithText("Изменить ответ",substring=true,useUnmergedTree=true).performScrollTo().assertIsDisplayed();log("320x640dp/font1.8: card inviter and change action reachable");capture("narrow-large-card");result.put("brief320Large",true);f.shell("wm size reset");f.shell("settings put system font_scale $originalFont");Thread.sleep(400)
            }
            launch("saved-empty"){
                openTab();f.waitText("Приглашений пока нет");compose.onAllNodesWithText(explanation).assertCountEquals(1);capture("empty");compose.onNodeWithText("К моим встречам").performScrollTo().performClick();f.waitTag("meetings-list");compose.onNodeWithTag("home-meetings").assertIsSelected();log("Empty action -> canonical meetings tab");capture("empty-to-meetings");result.put("emptyReturn",true)
            }
            result.put("status","observed-pass")
        }catch(e:Throwable){result.put("status","failed").put("error",e.toString());throw e}
        finally{QaResponseGate.unavailableGetPath=null;f.shell("wm size reset");f.shell("settings put system font_scale $originalFont");File(out,"result.json").writeText(result.put("actions",actions).put("finishedAt",Instant.now().toString()).toString(2))}
    }
}
