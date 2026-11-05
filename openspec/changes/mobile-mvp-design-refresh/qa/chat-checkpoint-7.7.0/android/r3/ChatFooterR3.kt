package dev.groupplanning.android
import androidx.compose.ui.test.*
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.semantics.SemanticsProperties
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
class ChatFooterR3 {
 @get:Rule(order=0) val locale:TestRule=QaAppLocaleRule()
 @get:Rule(order=1) val compose=createEmptyComposeRule()
 private val f=InvitationUiFixture(compose)
 private val out get()=File(checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")))
 private val actions=JSONArray();private val result=JSONObject()
 private fun log(s:String){actions.put(JSONObject().put("action",s).put("at",Instant.now().toString()))}
 @Before fun setup(){f.configure();out.mkdirs()}
 private fun capture(name:String){f.screenshot(name);File(out,"$name.semantics.txt").writeText(compose.onAllNodes(isRoot(),useUnmergedTree=true).printToString(maxDepth=100))}
 private fun metadata(seq:String):JSONObject {val ancestor=hasAnyAncestor(hasTestTag("feed-entry-$seq"));val clock=SemanticsMatcher("HH:mm"){n->n.config.getOrNull(SemanticsProperties.Text)?.any{it.text.matches(Regex("[0-9]{2}:[0-9]{2}"))}==true};val time=compose.onNode(clock and ancestor,useUnmergedTree=true).getUnclippedBoundsInRoot();val receipt=compose.onNode(hasTestTag("chat-read-receipt") and ancestor,useUnmergedTree=true).getUnclippedBoundsInRoot();return JSONObject().put("clockDp",time.toString()).put("receiptHitDp",receipt.toString())}
 @Test fun footerOnly(){try{val api=ChatReadLiveApi(f.context);val id="22222222-2222-4222-8222-222222222222";val own=api.message("invite-owner",id,"Да");val short=own.getString("sequence");val entries=api.request("invite-owner","meetings/$id/feed?limit=50").getJSONArray("entries");val long=(0 until entries.length()).map{entries.getJSONObject(it)}.first{it.optJSONObject("payload")?.optString("text")?.startsWith("Возьмите настолки")==true}.getString("sequence");result.put("longSequence",long).put("shortSequence",short);f.launch("feed-owner").use{try{
  f.waitTag("meetings-list");compose.onNodeWithTag("meetings-list").performScrollToNode(hasTestTag("meeting-$id"));compose.onNodeWithTag("meeting-$id").performClick();f.waitTag("message-composer");f.waitTag("feed-entry-$short");f.waitTag("feed-entry-$long");log("360dp: existing long+single short own messages without reactions, inspect right footer and no text overlap");capture("footer360");result.put("long360",metadata(long)).put("short360",metadata(short));f.shell("wm size 640x1280");Thread.sleep(500);f.waitTag("feed-entry-$short");log("320dp resize: same two no-reaction messages, right footer and short bubble geometry");capture("footer320");result.put("long320",metadata(long)).put("short320",metadata(short));result.put("status","observed-pass")
 }catch(e:Throwable){runCatching{capture("failure-live")};throw e}}}catch(e:Throwable){result.put("status","failed").put("error",e.toString());throw e}finally{f.shell("wm size reset");File(out,"result.json").writeText(result.put("actions",actions).put("finishedAt",Instant.now().toString()).toString(2))}}
}
