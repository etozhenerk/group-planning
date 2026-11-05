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
class SavedNavR3 {
 @get:Rule(order=0) val locale:TestRule=QaAppLocaleRule()
 @get:Rule(order=1) val compose=createEmptyComposeRule()
 private val f=InvitationUiFixture(compose)
 private val out get()=File(checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")))
 private val actions=JSONArray();private val result=JSONObject()
 private fun log(s:String){actions.put(JSONObject().put("action",s).put("at",Instant.now().toString()))}
 @Before fun setup(){f.configure();out.mkdirs()}
 private fun capture(name:String){f.screenshot(name);File(out,"$name.semantics.txt").writeText(compose.onAllNodes(isRoot(),useUnmergedTree=true).printToString(maxDepth=100))}
 @Test fun nav320Large(){val font=f.shell("settings get system font_scale").trim();try{f.shell("wm size 640x1280");f.shell("settings put system font_scale 1.8");f.launch("saved-invitations").use{try{
  f.waitTag("home-invitations");compose.onNodeWithTag("home-invitations").performClick();f.waitTag("saved-invitation-22222222-2222-4222-8222-222222222222");compose.onNodeWithTag("home-invitations").assertIsSelected()
  val labels=JSONArray();for(label in listOf("Встречи","Приглашения","Профиль")){val node=compose.onNode(hasText(label) and hasAnyAncestor(hasTestTag("home-navigation")),useUnmergedTree=true);val layouts=mutableListOf<TextLayoutResult>();node.performSemanticsAction(SemanticsActions.GetTextLayoutResult){it(layouts)};val l=layouts.single();check(l.lineCount==1&&!l.isLineEllipsized(0));check(l.layoutInput.text.text==label);labels.put(JSONObject().put("text",label).put("lineCount",l.lineCount).put("overflow",l.hasVisualOverflow).put("widthOverflow",l.didOverflowWidth).put("heightOverflow",l.didOverflowHeight).put("width",l.size.width).put("lineRight",l.getLineRight(0)).put("height",l.size.height).put("lineBottom",l.getLineBottom(0)).put("fontSp",l.layoutInput.style.fontSize.value));node.assertIsDisplayed()};result.put("labels",labels);log("320dp/font1.8: all three full labels, one line, no ellipsis/overflow; Invitations selected");capture("nav320-large")
  compose.onNodeWithText("Приглашает Саша",useUnmergedTree=true).performScrollTo().assertIsDisplayed();compose.onNodeWithText("Изменить ответ",substring=true,useUnmergedTree=true).performScrollTo().assertIsDisplayed();log("Real Maybe card inviter and change-answer footer reachable above nav");capture("card-footer320-large")
  compose.onNodeWithTag("home-meetings").performClick();f.waitTag("meetings-list");compose.onNodeWithTag("home-meetings").assertIsSelected();log("Tap Meetings -> selected Meetings and list");compose.onNodeWithTag("home-invitations").performClick();f.waitTag("saved-invitation-22222222-2222-4222-8222-222222222222");compose.onNodeWithTag("home-invitations").assertIsSelected();log("Tap Invitations -> selected Invitations and real card");capture("tap-return320-large");result.put("status","observed-pass")
 }catch(e:Throwable){result.put("status","failed").put("error",e.toString());runCatching{capture("failure-live")};throw e}}}finally{f.shell("wm size reset");f.shell("settings put system font_scale $font");File(out,"result.json").writeText(result.put("actions",actions).put("finishedAt",Instant.now().toString()).toString(2))}}
}
