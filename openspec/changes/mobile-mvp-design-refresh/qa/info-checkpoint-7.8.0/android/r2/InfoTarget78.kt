package dev.groupplanning.android
import androidx.compose.ui.test.*
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.text.TextLayoutResult
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
class InfoTarget78 {
 @get:Rule(order=0) val locale:TestRule=QaAppLocaleRule()
 @get:Rule(order=1) val compose=createEmptyComposeRule()
 private val f=InvitationUiFixture(compose)
 private val out get()=File(checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")))
 private val actions=JSONArray();private val result=JSONObject();private val id="22222222-2222-4222-8222-222222222222"
 private fun log(s:String){actions.put(JSONObject().put("action",s).put("at",Instant.now().toString()))}
 @Before fun setup(){f.configure();out.mkdirs()}
 private fun capture(name:String){f.screenshot(name);File(out,"$name.semantics.txt").writeText(compose.onAllNodes(isRoot(),useUnmergedTree=true).printToString(maxDepth=100))}
 private fun info(){compose.onNodeWithContentDescription("Информация о встрече").performClick();f.waitTag("meeting-information")}
 private fun style(text:String):JSONObject{val l=mutableListOf<TextLayoutResult>();compose.onNodeWithText(text,useUnmergedTree=true).performSemanticsAction(SemanticsActions.GetTextLayoutResult){it(l)};val v=l.single();return JSONObject().put("fontSp",v.layoutInput.style.fontSize.value).put("lineHeightSp",v.layoutInput.style.lineHeight.value).put("weight",v.layoutInput.style.fontWeight.toString())}
 @Test fun targeted(){try{val api=ChatReadLiveApi(f.context);val token=api.request("invite-owner","meetings/$id/invitation").getString("invitation_url").substringAfter("/i/");for(actor in listOf("invite-rsvp","review-reader-1","review-reader-2","review-reader-4")){api.request(actor,"invitations/$token/rsvp","PUT",JSONObject().put("answer","going").put("expected_revision","0"))};val people=api.request("invite-owner","meetings/$id/participants");val all="Все ответы · ${people.getJSONArray("participants").length()}";File(out,"api-preconditions.json").writeText(people.toString(2));f.launch("invite-rsvp").use{try{
 f.waitTag("meetings-list");compose.onNodeWithTag("meetings-list").performScrollToNode(hasTestTag("meeting-$id"));compose.onNodeWithTag("meeting-$id").performClick();f.waitTag("invitation-conversation");info();f.waitTag("meeting-information-facts");val facts=compose.onNodeWithTag("meeting-information-facts").fetchSemanticsNode().boundsInRoot;check(kotlin.math.abs(facts.right-(f.device.displayWidth-facts.left))<2f);result.put("facts360px",facts.toString());log("360dp: facts fills content width even with short place text");capture("facts360")
 compose.onNodeWithText(all).performScrollTo();result.put("companyHeading",style("Компания")).put("allResponses",style(all));val chips=compose.onAllNodesWithTag("participant-name-chip",useUnmergedTree=true).fetchSemanticsNodes();result.put("chipBoundsPx",JSONArray(chips.map{it.boundsInRoot.toString()}));compose.onNodeWithTag("information-change-answer").assertIsDisplayed();capture("company360");compose.onNodeWithText(all).performClick();f.waitTag("participants-collapse");compose.onNodeWithTag("participants-collapse").performScrollTo().performClick();log("Published company with >3Going: chips/+N/allresponses; expand-collapse real roster")
 f.shell("wm size 640x1280");Thread.sleep(400);compose.onNodeWithText(all).performScrollTo().assertIsDisplayed();compose.onNodeWithTag("information-change-answer").assertIsDisplayed();capture("company320");log("320dp normal sanity: published company and pinned response footer reachable")
 compose.onNodeWithTag("information-change-answer").performClick();f.waitTag("information-rsvp-Going");compose.onNodeWithTag("information-rsvp-Going").performClick();f.waitAbsent("meeting-information");f.waitTag("invitation-conversation");log("Same session: confirmed Going tap -> chat, child/info removed");capture("going-chat")
 info();compose.onNodeWithTag("information-change-answer").performClick();f.waitTag("information-rsvp-Maybe");compose.onNodeWithTag("information-rsvp-Maybe").performClick();f.waitTag("saved-invitation-$id");compose.onAllNodesWithTag("invitation-conversation").assertCountEquals(0);compose.onAllNodesWithTag("meeting-information").assertCountEquals(0);compose.onNodeWithTag("home-invitations").assertIsSelected();log("Same session after Going: reopenedInfo -> Maybe -> Invitations/card, private chat/info absent");capture("maybe-invitations");result.put("status","observed-pass")
 }catch(e:Throwable){runCatching{capture("failure-live")};throw e}}}catch(e:Throwable){result.put("status","failed").put("error",e.toString());throw e}finally{f.shell("wm size reset");File(out,"result.json").writeText(result.put("actions",actions).put("finishedAt",Instant.now().toString()).toString(2))}}
}
