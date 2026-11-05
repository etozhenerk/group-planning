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
class CreateTargetR2 {
 @get:Rule(order=0) val locale:TestRule=QaAppLocaleRule()
 @get:Rule(order=1) val compose=createEmptyComposeRule()
 private val f=InvitationUiFixture(compose)
 private val out get()=File(checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")))
 private val actions=JSONArray();private val result=JSONObject()
 private fun log(s:String){actions.put(JSONObject().put("action",s).put("at",Instant.now().toString()))}
 private fun unclipped(n:SemanticsNodeInteraction):Rect {val r=n.getUnclippedBoundsInRoot();return Rect(r.left.value,r.top.value,r.right.value,r.bottom.value)}
 private fun rect(r:Rect)=JSONObject().put("left",r.left).put("top",r.top).put("right",r.right).put("bottom",r.bottom)
 @Before fun setup(){f.configure();out.mkdirs()}
 private fun capture(name:String){f.screenshot(name);File(out,"$name.semantics.txt").writeText(compose.onAllNodes(isRoot(),useUnmergedTree=true).printToString(maxDepth=100))}
 @Test fun fiveTargeted(){val font=f.shell("settings get system font_scale").trim();try{f.launch("draft").use{try{
  f.waitText("Нет предстоящих встреч");compose.onNodeWithText("Создать встречу").performClick();f.waitTag("create-form");f.waitTag("cover-select");compose.onAllNodesWithText("somewhere").assertCountEquals(0);compose.onNodeWithText("необязательно").assertExists();compose.onNodeWithText("Время можно уточнить позже · Москва").assertExists();log("360dp: no brand; create cover card+optional; friendly optional-time helper below date/time");capture("empty360")
  compose.onNodeWithTag("create-submit").performClick();f.waitText("Введите название встречи");compose.onNodeWithContentDescription("Название").assertIsFocused();compose.waitUntil(5000){val hint=compose.onNodeWithText("Введите название встречи").fetchSemanticsNode().boundsInRoot;val form=compose.onNodeWithTag("create-form").fetchSemanticsNode().boundsInRoot;hint.top>=form.top&&hint.bottom<=form.bottom};capture("first-error-ime");val hint=compose.onNodeWithText("Введите название встречи").fetchSemanticsNode().boundsInRoot;val form=compose.onNodeWithTag("create-form").fetchSemanticsNode().boundsInRoot;result.put("firstHintBounds",rect(hint)).put("visibleForm",rect(form));log("Empty submit: first title focused; entire error hint inside visible scroll viewport above sticky footer/IME")
  compose.onNodeWithContentDescription("Название").performTextInput("Targeted layout");f.device.pressBack();f.shell("wm size 640x1280");f.shell("settings put system font_scale 1.8");Thread.sleep(500);f.waitTag("create-form");compose.onNodeWithContentDescription("Дата").performScrollTo();val day=unclipped(compose.onNodeWithContentDescription("Дата"));val time=unclipped(compose.onNodeWithContentDescription("Время"));check(day.left==time.left&&time.top>day.bottom);result.put("dayUnclippedDp320",rect(day)).put("timeUnclippedDp320",rect(time));compose.onNodeWithTag("create-submit").assertIsDisplayed();log("320dp/font1.8: date/time stacked, full-width date placeholder; sticky action remains reachable");capture("large320-date-time");compose.onNodeWithText("Время можно уточнить позже · Москва").performScrollTo().assertIsDisplayed();capture("large320-helper");result.put("status","observed-pass")
 }catch(e:Throwable){result.put("status","failed").put("error",e.toString());runCatching{capture("failure-live")};throw e}}}finally{f.shell("wm size reset");f.shell("settings put system font_scale $font");File(out,"result.json").writeText(result.put("actions",actions).put("finishedAt",Instant.now().toString()).toString(2))}}
}
