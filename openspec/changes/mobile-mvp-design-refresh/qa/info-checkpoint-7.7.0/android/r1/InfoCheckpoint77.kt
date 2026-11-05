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
class InfoCheckpoint77 {
 @get:Rule(order=0) val locale:TestRule=QaAppLocaleRule()
 @get:Rule(order=1) val compose=createEmptyComposeRule()
 private val f=InvitationUiFixture(compose)
 private val out get()=File(checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")))
 private val actions=JSONArray();private val result=JSONObject()
 private val id="22222222-2222-4222-8222-222222222222"
 private fun log(s:String){actions.put(JSONObject().put("action",s).put("at",Instant.now().toString()))}
 @Before fun setup(){f.configure();out.mkdirs()}
 private fun capture(name:String){f.screenshot(name);File(out,"$name.semantics.txt").writeText(compose.onAllNodes(isRoot(),useUnmergedTree=true).printToString(maxDepth=100))}
 private fun openMeeting(){f.waitTag("meetings-list");compose.onNodeWithTag("meetings-list").performScrollToNode(hasTestTag("meeting-$id"));compose.onNodeWithTag("meeting-$id").performClick();f.waitTag("invitation-conversation")}
 private fun info(){compose.onNodeWithContentDescription("Информация о встрече").performClick();f.waitTag("meeting-information")}
 private fun runRole(role:String,body:()->Unit){f.launch(role).use{try{body()}catch(e:Throwable){runCatching{capture("failure-live")};throw e}}}
 @Test fun infoShort(){try{val api=ChatReadLiveApi(f.context);val before=api.request("invite-owner","meetings/$id");api.request("invite-owner","meetings/$id","PATCH",JSONObject().put("expected_revision",before.getString("revision")).put("place","У Саши, большая комната").put("description",("Соберёмся, обсудим планы и сыграем в настолки. Принесите любимую игру. ").repeat(5)));val link=api.request("invite-owner","meetings/$id/invitation").getString("invitation_url");val token=link.substringAfter("/i/");for((actor,answer) in listOf("invite-rsvp" to "going","review-reader-1" to "going","review-reader-2" to "maybe","review-reader-4" to "not_going")){api.request(actor,"invitations/$token/rsvp","PUT",JSONObject().put("answer",answer).put("expected_revision","0"))};val roster=api.request("invite-owner","meetings/$id/participants");val all="Все ответы · ${roster.getJSONArray("participants").length()}";File(out,"api-preconditions.json").writeText(roster.toString(2));
  runRole("feed-owner"){
   openMeeting();info();f.waitTag("meeting-cover");compose.onNodeWithText("Вы организатор").assertExists();compose.onNodeWithTag("information-share").assertIsDisplayed();val pinned=compose.onNodeWithTag("information-share").fetchSemanticsNode().boundsInRoot;log("Organizer: real API cover, owner name/fallback identity, facts/description, pinned share");capture("organizer360-top")
   compose.onNodeWithText(all).performScrollTo().performClick();f.waitTag("participants-collapse");compose.onNodeWithTag("participants-collapse").performScrollTo().assertIsDisplayed();compose.onNodeWithTag("information-share").assertIsDisplayed();val after=compose.onNodeWithTag("information-share").fetchSemanticsNode().boundsInRoot;check(kotlin.math.abs(after.top-pinned.top)<2f);log("All five real roles/responses expanded; last row/collapse above fixed footer");capture("organizer-roster");compose.onNodeWithTag("participants-collapse").performClick();compose.onNodeWithTag("information-share").performClick();f.waitText("Копировать ссылку");capture("share-child");compose.onNodeWithText("Копировать ссылку").performScrollTo().performClick();f.waitText("Ссылка скопирована");f.device.pressBack();f.waitTag("meeting-information");compose.onNodeWithText(all).assertIsDisplayed();log("Share child copy confirmed; Back restores info and prior company scroll")
   compose.onNodeWithTag("open-settings").performScrollTo().performClick();f.waitTag("meeting-settings");capture("settings-transition-only");f.device.pressBack();f.waitTag("meeting-information");compose.onNodeWithTag("information-share").assertIsDisplayed();log("Settings opens same surface; untouched Back -> info, settings redesign not tested");result.put("organizer",true)
  }
  runRole("invite-rsvp"){
   openMeeting();info();compose.onAllNodesWithTag("open-settings").assertCountEquals(0);compose.onAllNodesWithTag("information-share").assertCountEquals(0);compose.onNodeWithTag("information-change-answer").assertIsDisplayed();log("Member: organizer identity/fallback, no owner settings/share, pinned confirmed Going/change");capture("member360")
   f.shell("wm size 640x1280");Thread.sleep(400);f.waitTag("meeting-information");compose.onNodeWithText(all).performScrollTo().assertIsDisplayed();compose.onNodeWithTag("information-change-answer").assertIsDisplayed();capture("member320-company");log("320dp normal sanity: company reachable; member footer stays visible")
   compose.onNodeWithTag("information-change-answer").performClick();f.waitTag("meeting-information-rsvp");capture("response-child");compose.onNodeWithTag("rsvp-Going").performClick();f.waitTag("invitation-conversation");f.waitAbsent("meeting-information");log("Confirmed Going from info response child -> chat, sheet removed");info();compose.onNodeWithTag("information-change-answer").performClick();f.waitTag("meeting-information-rsvp");compose.onNodeWithTag("rsvp-Maybe").performClick();f.waitTag("saved-invitation-$id");compose.onAllNodesWithTag("invitation-conversation").assertCountEquals(0);compose.onAllNodesWithTag("meeting-information").assertCountEquals(0);compose.onNodeWithTag("home-invitations").assertIsSelected();log("Maybe -> invitations real saved card; private chat/info absent");capture("maybe-invitations");result.put("memberCanonical",true)
  }
  result.put("status","observed-pass")
 }catch(e:Throwable){result.put("status","failed").put("error",e.toString());throw e}finally{f.shell("wm size reset");File(out,"result.json").writeText(result.put("actions",actions).put("finishedAt",Instant.now().toString()).toString(2))}}
 @Test fun canonicalTail(){try{runRole("invite-rsvp"){
 openMeeting();info();compose.onNodeWithTag("information-change-answer").performClick();f.waitTag("information-rsvp-Going");compose.onNodeWithTag("information-rsvp-Going").performClick();f.waitTag("invitation-conversation");f.waitAbsent("meeting-information");log("Confirmed Going from info child -> chat; sheet removed");capture("going-return");info();compose.onNodeWithTag("information-change-answer").performClick();f.waitTag("information-rsvp-Maybe");compose.onNodeWithTag("information-rsvp-Maybe").performClick();f.waitTag("saved-invitation-$id");compose.onAllNodesWithTag("invitation-conversation").assertCountEquals(0);compose.onAllNodesWithTag("meeting-information").assertCountEquals(0);compose.onNodeWithTag("home-invitations").assertIsSelected();log("Maybe -> selected Invitations with actual card; private chat/info removed");capture("maybe-invitations");result.put("status","observed-pass")
 }}catch(e:Throwable){result.put("status","failed").put("error",e.toString());throw e}finally{File(out,"canonical-tail-result.json").writeText(result.put("actions",actions).put("at",Instant.now().toString()).toString(2))}}

 @Test fun maybeOnly(){try{runRole("invite-rsvp"){openMeeting();info();compose.onNodeWithTag("information-change-answer").performClick();f.waitTag("information-rsvp-Maybe");compose.onNodeWithTag("information-rsvp-Maybe").performClick();f.waitTag("saved-invitation-$id");compose.onAllNodesWithTag("invitation-conversation").assertCountEquals(0);compose.onAllNodesWithTag("meeting-information").assertCountEquals(0);compose.onNodeWithTag("home-invitations").assertIsSelected();log("Actual Maybe from info child -> selected Invitations and real card; private chat/info absent");capture("maybe-invitations");result.put("status","observed-pass")}}catch(e:Throwable){result.put("status","failed").put("error",e.toString());throw e}finally{File(out,"maybe-tail-result.json").writeText(result.put("actions",actions).put("at",Instant.now().toString()).toString(2))}}

}
