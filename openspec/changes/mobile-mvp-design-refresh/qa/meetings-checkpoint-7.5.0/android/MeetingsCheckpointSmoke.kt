package dev.groupplanning.android

import androidx.compose.ui.test.*
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.lifecycle.Lifecycle
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.core.app.ActivityScenario
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import java.io.File
import java.time.Instant
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule

class MeetingsCheckpointSmoke {
    @get:Rule(order=0) val locale:TestRule=QaAppLocaleRule()
    @get:Rule(order=1) val compose=createEmptyComposeRule()
    private val f=InvitationUiFixture(compose)
    private lateinit var api:ChatReadLiveApi
    private val out get()=File(checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")))
    private val actions=JSONArray()
    private val result=JSONObject()
    private val dinner="deb00000-0000-4000-8000-000000000001"
    private fun log(s:String){actions.put(JSONObject().put("action",s).put("at",Instant.now().toString()))}
    @Before fun configure(){f.configure();api=ChatReadLiveApi(f.context);out.mkdirs()}
    private fun capture(name:String){f.screenshot(name);File(out,"$name.semantics.txt").writeText(compose.onAllNodes(isRoot(),useUnmergedTree=true).printToString(maxDepth=100));File(out,"$name.actions.json").writeText(JSONObject().put("actions",JSONArray(actions.toString())).put("at",Instant.now().toString()).toString(2))}
    private fun toggle(){compose.onAllNodes(hasTestTag("meeting-display-toggle")).assertCountEquals(1);compose.onNodeWithTag("meeting-display-toggle").performClick();log("Single list/calendar toggle")}
    private fun noError(){compose.waitUntil(15000){compose.onAllNodes(hasTestTag("meetings-error")).fetchSemanticsNodes().isEmpty()}}
    private fun unreadInDinner()=compose.onAllNodesWithContentDescription("непрочитан",substring=true,useUnmergedTree=true)
    private fun launch(name:String,body:(ActivityScenario<MainActivity>)->Unit){f.launch(name).use{a->try{body(a)}catch(e:Throwable){runCatching{capture("failure-live")};throw e}}}
    @Test fun targetSmoke(){
        try {
            launch("design"){a->
                f.waitText("Ужин в пятницу");compose.onAllNodes(hasTestTag("meeting-display-toggle")).assertCountEquals(1)
                api.message("review-reader-1",dinner,"Checkpoint непрочитанного списка")
                compose.waitUntil(15000){unreadInDinner().fetchSemanticsNodes().isNotEmpty()}
                log("Real guest message -> nonzero unread footer on dinner card");capture("list-ready-unread");result.put("readySingleToggle",true).put("unreadPositive",true)
                toggle();val day=f.designDate("boardgame");f.waitTag("day-$day");compose.onNodeWithTag("day-$day").performClick();compose.onNodeWithTag("day-$day").assertIsSelected();f.waitText("Настолки у Саши");compose.onNodeWithText("Настолки у Саши").performScrollTo().performClick();f.waitTag("message-composer");f.device.pressBack();f.waitTag("meetings-list");compose.onNodeWithTag("day-$day").assertIsSelected();log("Selected calendar day -> real meeting -> system Back preserves selection");toggle();toggle();compose.onNodeWithTag("day-$day").assertIsSelected();capture("calendar-selection-return");result.put("calendarSelectionBack",true)
                toggle();f.waitText("Ужин в пятницу");compose.onNodeWithText("Ужин в пятницу").performScrollTo().performClick();f.waitTag("message-composer");f.waitText("Checkpoint непрочитанного списка");compose.waitForIdle();Thread.sleep(700);f.device.pressBack();f.waitTag("meetings-list");compose.onNodeWithText("Ужин в пятницу").performScrollTo();compose.waitUntil(15000){unreadInDinner().fetchSemanticsNodes().isEmpty()};log("Real opening/read/Back removes zero unread footer");capture("unread-zero");result.put("unreadZero",true)
                val title="Большой вечер настольных игр, пиццы и разговоров до утра"
                val details=api.request("review-reader-4","meetings/$dinner")
                api.request("review-reader-4","meetings/$dinner","PATCH",JSONObject().put("expected_revision",details.getString("revision")).put("title",title).put("place","Очень длинное название кафе на тихой улице рядом с большим старым парком"))
                a.moveToState(Lifecycle.State.CREATED);a.moveToState(Lifecycle.State.RESUMED);f.waitText(title);compose.onNodeWithText(title).performScrollTo().assertIsDisplayed();log("Real owner PATCH long title/place on dinner, accepted cover preserved");capture("long-card");result.put("longCard",true)
                QaResponseGate.unavailableGetPath="/api/v1/meetings";a.moveToState(Lifecycle.State.CREATED);a.moveToState(Lifecycle.State.RESUMED);compose.onNodeWithTag("meetings-list").performScrollToIndex(0);f.waitTag("meetings-error");compose.onNodeWithText(title).assertExists();log("Real refresh GET outage preserves loaded cards");capture("refresh-error");QaResponseGate.unavailableGetPath=null;compose.onNodeWithContentDescription("Повторить обновление").performClick();noError();f.waitText(title);result.put("refreshFailureRetry",true)
            }
            QaClientTestState.begin(f.context);launch("calendar-empty"){
                f.waitText("Нет предстоящих встреч");capture("empty");compose.onNodeWithText("Прошедшие").performClick();f.waitText("Нет прошедших встреч");capture("past-empty");log("Empty account and past-empty distinct surfaces");result.put("emptyAndPastEmpty",true)
            }
            QaClientTestState.begin(f.context);QaResponseGate.unavailableGetPath="/api/v1/meetings";launch("design"){
                f.waitTag("meetings-error");f.waitText("Повторить загрузку");log("Cold namespace real initial GET outage");capture("initial-error");QaResponseGate.unavailableGetPath=null;compose.onNodeWithText("Повторить загрузку").performClick();noError();compose.onNodeWithTag("meetings-list").performScrollToNode(hasText("Ужин в пятницу"));f.waitText("Ужин в пятницу");result.put("initialFailureRetry",true)
            }
            result.put("status","observed-pass")
        }catch(e:Throwable){result.put("status","failed").put("error",e.toString());runCatching{capture("failure")};throw e}
        finally{QaResponseGate.unavailableGetPath=null;File(out,"result.json").writeText(result.put("actions",actions).put("finishedAt",Instant.now().toString()).toString(2))}
    }

    @Test fun remainingTail(){
        try {
            launch("design"){a->
                f.waitText("Ужин в пятницу");compose.onNodeWithText("Ужин в пятницу").performScrollTo().performClick();f.waitTag("message-composer");f.waitText("Checkpoint непрочитанного списка");compose.waitForIdle();Thread.sleep(700);f.device.pressBack();f.waitTag("meetings-list");compose.onNodeWithText("Ужин в пятницу").performScrollTo();compose.waitUntil(15000){unreadInDinner().fetchSemanticsNodes().isEmpty()};log("Real dinner read/Back removes unread footer");capture("unread-zero");result.put("unreadZero",true)
                val title="Большой вечер настольных игр, пиццы и разговоров до утра"
                val details=api.request("review-reader-4","meetings/$dinner")
                api.request("review-reader-4","meetings/$dinner","PATCH",JSONObject().put("expected_revision",details.getString("revision")).put("title",title).put("place","Очень длинное название кафе на тихой улице рядом с большим старым парком"))
                a.moveToState(Lifecycle.State.CREATED);a.moveToState(Lifecycle.State.RESUMED);f.waitText(title);compose.onNodeWithText(title).performScrollTo().assertIsDisplayed();log("Real owner PATCH long title/place on dinner, accepted cover preserved");capture("long-card");result.put("longCard",true)
                QaResponseGate.unavailableGetPath="/api/v1/meetings";a.moveToState(Lifecycle.State.CREATED);a.moveToState(Lifecycle.State.RESUMED);compose.onNodeWithTag("meetings-list").performScrollToIndex(0);f.waitTag("meetings-error");compose.onNodeWithText(title).assertExists();log("Real refresh GET outage preserves loaded cards");capture("refresh-error");QaResponseGate.unavailableGetPath=null;compose.onNodeWithContentDescription("Повторить обновление").performClick();noError();f.waitText(title);result.put("refreshFailureRetry",true)
            }
            QaClientTestState.begin(f.context);launch("calendar-empty"){
                f.waitText("Нет предстоящих встреч");capture("empty");compose.onNodeWithText("Прошедшие").performClick();f.waitText("Нет прошедших встреч");capture("past-empty");log("Empty account and past-empty distinct surfaces");result.put("emptyAndPastEmpty",true)
            }
            QaClientTestState.begin(f.context);QaResponseGate.unavailableGetPath="/api/v1/meetings";launch("design"){
                f.waitTag("meetings-error");f.waitText("Повторить загрузку");log("Cold namespace real initial GET outage");capture("initial-error");QaResponseGate.unavailableGetPath=null;compose.onNodeWithText("Повторить загрузку").performClick();noError();compose.onNodeWithTag("meetings-list").performScrollToNode(hasText("Ужин в пятницу"));f.waitText("Ужин в пятницу");result.put("initialFailureRetry",true)
            }
            result.put("status","observed-pass")
        }catch(e:Throwable){result.put("status","failed").put("error",e.toString());throw e}
        finally{QaResponseGate.unavailableGetPath=null;File(out,"tail-result.json").writeText(result.put("actions",actions).put("finishedAt",Instant.now().toString()).toString(2))}
    }
}
