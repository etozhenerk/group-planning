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
class ChatCheckpoint77 {
 @get:Rule(order=0) val locale:TestRule=QaAppLocaleRule()
 @get:Rule(order=1) val compose=createEmptyComposeRule()
 private val f=InvitationUiFixture(compose)
 private val out get()=File(checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")))
 private val actions=JSONArray();private val result=JSONObject()
 private fun log(s:String){actions.put(JSONObject().put("action",s).put("at",Instant.now().toString()))}
 @Before fun setup(){f.configure();out.mkdirs()}
 private fun capture(name:String){f.screenshot(name);File(out,"$name.semantics.txt").writeText(compose.onAllNodes(isRoot(),useUnmergedTree=true).printToString(maxDepth=100));File(out,"actions.json").writeText(actions.toString(2))}
 private fun closeMenus(){if(compose.onAllNodesWithTag("chat-readers").fetchSemanticsNodes().isNotEmpty()){f.device.pressBack();f.waitAbsent("chat-readers")};if(compose.onAllNodesWithTag("reaction-quick").fetchSemanticsNodes().isNotEmpty()){f.device.pressBack();f.waitAbsent("reaction-quick")}}
 @Test fun chatShort(){try{
  val api=ChatReadLiveApi(f.context);val c=api.request("design","meetings","POST",JSONObject().put("title","Chat77 checkpoint").put("starts_on","2099-11-10").put("timezone","Europe/Moscow"));val id=c.getJSONObject("meeting").getString("id");val token=c.getString("invitation_url").substringAfter("/i/");api.request("invite-rsvp","invitations/$token/rsvp","PUT",JSONObject().put("answer","going").put("expected_revision","0"));api.message("invite-rsvp",id,"Входящее для проверки геометрии пузыря");val own=api.message("design",id,"Моё подтверждённое сообщение");val sequence=own.getString("sequence");result.put("meetingId",id).put("ownMessageId",own.getString("id"));
  f.launch("design").use{try{
   f.waitTag("meetings-list");compose.onNodeWithTag("meetings-list").performScrollToNode(hasTestTag("meeting-$id"));compose.onNodeWithTag("meeting-$id").performClick();f.waitTag("message-composer");f.waitText("Моё подтверждённое сообщение");val receipt=compose.onNode(hasTestTag("chat-read-receipt") and hasAnyAncestor(hasTestTag("feed-entry-$sequence")));compose.waitUntil(10000){compose.onAllNodesWithContentDescription("Отправлено. Пока никто не прочитал. Открыть сведения").fetchSemanticsNodes().isNotEmpty()};log("360dp real incoming/own bubbles; zero read count, single muted mark; empty composer");capture("ready360-zero")
   receipt.performClick();f.waitTag("reaction-quick");f.waitTag("chat-read-context");log("Tap receipt opens context reaction/read menu");capture("zero-context");compose.onNodeWithTag("chat-read-context").performClick();f.waitText("Пока никто не прочитал");capture("zero-readers");closeMenus()
   api.request("invite-rsvp","meetings/$id/read-marker","PUT",JSONObject().put("read_through_sequence",sequence));compose.waitUntil(15000){compose.onAllNodesWithContentDescription("Прочитали 1").fetchSemanticsNodes().isNotEmpty()};log("Second real user read-marker -> positive count and double mark");capture("read-positive");receipt.performClick();f.waitTag("chat-read-context");compose.onNodeWithTag("chat-read-context").performClick();f.waitTag("chat-readers");val name=api.request("invite-rsvp","me").getJSONObject("user").getString("display_name");f.waitText(name);log("Positive menu -> actual reader name");capture("reader-person");closeMenus()
   compose.onNodeWithTag("feed-entry-$sequence").performTouchInput{longClick()};f.waitTag("reaction-quick");compose.onNodeWithContentDescription("👍",useUnmergedTree=true).performClick();f.waitAbsent("reaction-quick");log("Long press -> quick emoji choice thumbs-up");capture("reaction-chosen")
   f.shell("wm size 640x1280");Thread.sleep(400);val input=compose.onNodeWithTag("message-composer");input.performTextInput("Сообщение с клавиатуры320");compose.onNodeWithTag("message-send").assertIsDisplayed().assertIsEnabled();log("320dp actual IME typing: composer/send visible");capture("keyboard320");compose.onNodeWithTag("message-send").performClick();compose.waitUntil(15000){val entries=api.request("design","meetings/$id/feed?limit=50").getJSONArray("entries");(0 until entries.length()).any{entries.getJSONObject(it).optJSONObject("payload")?.optString("text")=="Сообщение с клавиатуры320"}};input.assertTextEquals("");f.device.pressBack();f.waitText("Сообщение с клавиатуры320");log("Real UI send -> server ACK, composer cleared; no optimistic fake acceptance");capture("ack320");result.put("normalKnownReadsReactionSend",true)
  }catch(e:Throwable){runCatching{capture("failure-live")};throw e}}
  result.put("status","observed-pass");result.put("notExecuted",JSONArray(listOf("unknown count: no deterministic count gate in existing fixture","confirmed rejected retry/recover: existing gate is IOException/unknown, not rejection")))
 }catch(e:Throwable){result.put("status","failed").put("error",e.toString());throw e}finally{f.shell("wm size reset");File(out,"result.json").writeText(result.put("actions",actions).put("finishedAt",Instant.now().toString()).toString(2))}}
}
