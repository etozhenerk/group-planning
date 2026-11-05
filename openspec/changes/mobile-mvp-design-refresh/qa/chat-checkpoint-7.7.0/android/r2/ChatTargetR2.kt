package dev.groupplanning.android
import androidx.compose.ui.test.*
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
class ChatTargetR2 {
 @get:Rule(order=0) val locale:TestRule=QaAppLocaleRule()
 @get:Rule(order=1) val compose=createEmptyComposeRule()
 private val f=InvitationUiFixture(compose)
 private val out get()=File(checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")))
 private val actions=JSONArray();private val result=JSONObject()
 private fun log(s:String){actions.put(JSONObject().put("action",s).put("at",Instant.now().toString()))}
 @Before fun setup(){f.configure();out.mkdirs()}
 private fun capture(name:String){f.screenshot(name);File(out,"$name.semantics.txt").writeText(compose.onAllNodes(isRoot(),useUnmergedTree=true).printToString(maxDepth=100))}
 @Test fun targeted(){try{val api=ChatReadLiveApi(f.context);val id="22222222-2222-4222-8222-222222222222";val seq=JSONObject(File(out,"result.json").readText()).getString("sequence");result.put("sequence",seq);f.launch("feed-owner").use{try{
  f.waitTag("meetings-list");compose.onNodeWithTag("meetings-list").performScrollToNode(hasTestTag("meeting-$id"));compose.onNodeWithTag("meeting-$id").performClick();f.waitTag("message-composer");f.waitTag("feed-entry-$seq");compose.onNodeWithText("Да",useUnmergedTree=true).performTouchInput{longClick()};f.waitTag("reaction-quick");compose.onNodeWithContentDescription("👍",useUnmergedTree=true).performClick();f.waitAbsent("reaction-quick");compose.waitUntil(10000){compose.onAllNodesWithContentDescription("👍, 1, Ваша реакция").fetchSemanticsNodes().isNotEmpty()};val chip=compose.onNodeWithContentDescription("👍, 1, Ваша реакция");chip.assertIsSelected();log("360dp short real ACKed bubble; compact selected chip/footer/input surface");capture("short-chip360")
  chip.performClick();compose.waitUntil(10000){compose.onAllNodesWithContentDescription("👍, 1, Ваша реакция").fetchSemanticsNodes().isEmpty()};log("Direct tap on transparent-hit chip removes own real reaction");compose.onNodeWithText("Да",useUnmergedTree=true).performTouchInput{longClick()};f.waitTag("reaction-quick");compose.onNodeWithContentDescription("👍",useUnmergedTree=true).performClick();f.waitAbsent("reaction-quick");compose.waitUntil(10000){compose.onAllNodesWithContentDescription("👍, 1, Ваша реакция").fetchSemanticsNodes().isNotEmpty()};capture("chip-retapped360")
  f.shell("wm size 640x1280");Thread.sleep(400);compose.onNodeWithTag("message-composer").performTextInput("Черновик");compose.onNodeWithTag("message-send").assertIsDisplayed();log("320dp real IME spot: input contrast/rounded inner field, chip left/time right; draft only, no send");capture("keyboard320");f.device.pressBack();capture("short-chip320");result.put("status","observed-pass")
 }catch(e:Throwable){runCatching{capture("failure-live")};throw e}}}catch(e:Throwable){result.put("status","failed").put("error",e.toString());throw e}finally{f.shell("wm size reset");File(out,"result.json").writeText(result.put("actions",actions).put("finishedAt",Instant.now().toString()).toString(2))}}
}
