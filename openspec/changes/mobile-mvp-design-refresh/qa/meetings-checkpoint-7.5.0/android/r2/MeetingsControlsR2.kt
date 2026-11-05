package dev.groupplanning.android

import androidx.compose.ui.test.*
import androidx.compose.ui.geometry.Rect
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

class MeetingsControlsR2 {
    @get:Rule(order=0) val locale:TestRule=QaAppLocaleRule()
    @get:Rule(order=1) val compose=createEmptyComposeRule()
    private val f=InvitationUiFixture(compose)
    private val out get()=File(checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")))
    private val actions=JSONArray()
    private val result=JSONObject()
    private fun log(s:String){actions.put(JSONObject().put("action",s).put("at",Instant.now().toString()))}
    @Before fun configure(){f.configure();out.mkdirs()}
    private fun bounds()=compose.onNodeWithTag("meeting-display-toggle").fetchSemanticsNode().boundsInRoot
    private fun json(r:Rect)=JSONObject().put("left",r.left).put("top",r.top).put("right",r.right).put("bottom",r.bottom)
    private fun unchanged(before:Rect){compose.onAllNodes(hasTestTag("meeting-display-toggle")).assertCountEquals(1);val now=bounds();check(kotlin.math.abs(now.top-before.top)<1f&&kotlin.math.abs(now.left-before.left)<1f);log("Control bounds remain $now")}
    private fun capture(name:String){f.screenshot(name);File(out,"$name.semantics.txt").writeText(compose.onAllNodes(isRoot(),useUnmergedTree=true).printToString(maxDepth=100));File(out,"$name.actions.json").writeText(JSONObject().put("actions",JSONArray(actions.toString())).put("at",Instant.now().toString()).toString(2))}
    @Test fun targetedControlsCalendar(){
        try{f.launch("design").use{
            try{
                f.waitText("Ужин в пятницу");compose.onAllNodes(hasTestTag("meeting-display-toggle")).assertCountEquals(1);val before=bounds();result.put("initialControl",json(before));compose.onNodeWithTag("meeting-display-toggle").performClick();val day=f.designDate("boardgame");f.waitTag("day-$day");compose.onNodeWithTag("day-$day").performClick();compose.onNodeWithTag("day-$day").assertIsSelected();compose.onNodeWithTag("meetings-list").performScrollToIndex(0);val cell=compose.onNodeWithTag("day-$day").fetchSemanticsNode().boundsInRoot;result.put("selectedCell360",json(cell));log("Selected real meeting day $day; one calendar/list control");capture("calendar-flat-360")
                compose.onNodeWithTag("meetings-list").performTouchInput{swipeUp()};unchanged(before);capture("controls-scrolled")
                compose.onNodeWithTag("meetings-list").performScrollToNode(hasText("Настолки у Саши"));compose.onNodeWithText("Настолки у Саши").performClick();f.waitTag("message-composer");f.device.pressBack();f.waitTag("meetings-list");unchanged(before);log("Real meeting -> system Back, fixed control retained");capture("controls-after-back");compose.onNodeWithTag("meetings-list").performScrollToIndex(0);compose.onNodeWithTag("day-$day").assertIsSelected();result.put("fixedControlsScrollAndBack",true)
                f.shell("wm size 640x1280");Thread.sleep(600);f.waitTag("meeting-display-toggle");compose.onNodeWithTag("meetings-list").performScrollToIndex(0);compose.onNodeWithTag("day-$day").assertIsSelected();result.put("selectedCell320",json(compose.onNodeWithTag("day-$day").fetchSemanticsNode().boundsInRoot));log("Brief real320dp resize preserves selected day and one control");capture("calendar-flat-320");result.put("brief320",true)
                result.put("status","observed-pass")
            }catch(e:Throwable){result.put("status","failed").put("error",e.toString());runCatching{capture("failure-live")};throw e}
        }}finally{f.shell("wm size reset");File(out,"result.json").writeText(result.put("actions",actions).put("finishedAt",Instant.now().toString()).toString(2))}
    }
}
