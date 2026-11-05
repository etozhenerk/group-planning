package dev.groupplanning.android
import androidx.compose.ui.test.*
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.text.TextLayoutResult
import androidx.test.platform.app.InstrumentationRegistry
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import java.io.File
import java.time.Instant
import org.json.JSONObject
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule
class InfoTypography78R3 {
 @get:Rule(order=0) val locale:TestRule=QaAppLocaleRule()
 @get:Rule(order=1) val compose=createEmptyComposeRule()
 private val f=InvitationUiFixture(compose)
 private val out get()=File(checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")))
 private val result=JSONObject()
 @Before fun setup(){f.configure();out.mkdirs()}
 private fun style(text:String):JSONObject{val l=mutableListOf<TextLayoutResult>();val n=compose.onNodeWithText(text,useUnmergedTree=true);n.performSemanticsAction(SemanticsActions.GetTextLayoutResult){it(l)};val v=l.single();return JSONObject().put("text",text).put("fontSp",v.layoutInput.style.fontSize.value).put("lineHeightSp",v.layoutInput.style.lineHeight.value).put("weight",v.layoutInput.style.fontWeight.toString()).put("color",v.layoutInput.style.color.toString()).put("boundsPx",n.fetchSemanticsNode().boundsInRoot.toString())}
 @Test fun onlyTypography(){try{val api=ChatReadLiveApi(f.context);api.request("invite-rsvp","invitations/QUFBQUFBQUFBQUFBQUFBQQ/rsvp","PUT",JSONObject().put("answer","going").put("expected_revision","0"));val id="22222222-2222-4222-8222-222222222222";f.launch("invite-rsvp").use{try{f.waitTag("meetings-list");compose.onNodeWithTag("meetings-list").performScrollToNode(hasTestTag("meeting-$id"));compose.onNodeWithTag("meeting-$id").performClick();f.waitTag("invitation-conversation");compose.onNodeWithContentDescription("Информация о встрече").performClick();f.waitTag("meeting-information");compose.onNodeWithText("Все ответы · 4 →").performScrollTo().assertIsDisplayed();result.put("heading",style("Кто придёт")).put("allResponses",style("Все ответы · 4 →")).put("counter",style("2"));f.screenshot("typography360");File(out,"typography360.semantics.txt").writeText(compose.onAllNodes(isRoot(),useUnmergedTree=true).printToString(maxDepth=100));result.put("status","observed-pass").put("action","360dp member info; inspect only published heading/counter/Allresponses typography and alignment")}catch(e:Throwable){runCatching{f.screenshot("failure-live")};throw e}}}catch(e:Throwable){result.put("status","failed").put("error",e.toString());throw e}finally{File(out,"result.json").writeText(result.put("at",Instant.now().toString()).toString(2))}}
}
