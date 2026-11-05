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
class CreateCheckpoint76 {
 @get:Rule(order=0) val locale:TestRule=QaAppLocaleRule()
 @get:Rule(order=1) val compose=createEmptyComposeRule()
 private val f=InvitationUiFixture(compose)
 private val out get()=File(checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")))
 private val actions=JSONArray();private val result=JSONObject()
 private fun log(s:String){actions.put(JSONObject().put("action",s).put("at",Instant.now().toString()))}
 @Before fun setup(){f.configure();out.mkdirs()}
 private fun capture(name:String){f.screenshot(name);File(out,"$name.semantics.txt").writeText(compose.onAllNodes(isRoot(),useUnmergedTree=true).printToString(maxDepth=100))}
 @Test fun createShort(){val font=f.shell("settings get system font_scale").trim();try{f.launch("cover-create").use{a->try{
  f.waitText("Нет предстоящих встреч");compose.onNodeWithText("Создать встречу").performClick();f.waitTag("create-form");f.waitTag("cover-select");compose.onAllNodesWithTag("home-navigation").assertCountEquals(0);log("360dp: new form, compact cover, required labels, sticky submit outside scroll");capture("empty360")
  val submit=compose.onNodeWithTag("create-submit").fetchSemanticsNode().boundsInRoot;compose.onNodeWithTag("create-submit").performClick();f.waitText("Введите название встречи");compose.onNodeWithText("Выберите дату встречи").assertExists();compose.onNodeWithContentDescription("Название").assertIsFocused();log("Empty submit: title/day inline hints and first title focus");capture("validation-first-focus");f.device.pressBack()
  f.shell("wm size 640x1280");f.shell("settings put system font_scale 1.8");Thread.sleep(500);compose.onNodeWithContentDescription("Дата").performScrollTo();compose.onNodeWithTag("create-submit").assertIsDisplayed();log("Brief320dp/font1.8: date/time/error fields and sticky submit");capture("narrow-large-fields");compose.onNodeWithContentDescription("Описание").performScrollTo();compose.onNodeWithTag("create-submit").assertIsDisplayed();capture("narrow-large-last-field");f.shell("wm size reset");f.shell("settings put system font_scale $font");Thread.sleep(400)
  compose.onNodeWithContentDescription("Название").performScrollTo().performTextInput("Checkpoint без времени");f.device.pressBack();compose.onAllNodesWithText("Введите название встречи").assertCountEquals(0);f.device.pressBack();f.waitText("Закрыть форму?");capture("dirty-back");compose.onNodeWithText("Продолжить").performClick();f.waitTag("create-form");compose.onNodeWithContentDescription("Название").assertTextContains("Checkpoint без времени");log("Dirty Back -> Continue preserves title")
  compose.onNodeWithContentDescription("Дата").performScrollTo().performClick();f.waitTag("date-confirm");compose.onNodeWithTag("date-confirm").performClick();compose.onAllNodesWithText("Выберите дату встречи").assertCountEquals(0);compose.onNodeWithTag("clear-meeting-time").assertDoesNotExist();compose.onNodeWithTag("cover-select").performScrollTo().performClick();f.waitTag("meeting-cover");log("Real date selection, time stays absent; QA photo selection prepared actual cover");capture("filled-cover")
  compose.onNodeWithTag("create-submit").performClick();f.waitText("Повторить отправку");f.waitTag("create-problem");compose.onNodeWithContentDescription("Название").assertIsNotEnabled();compose.onNodeWithTag("cover-select").assertIsNotEnabled();log("Real create response lost by existing fixture: unknown notice beside action; inputs frozen and retained");capture("unknown-retry");compose.onNodeWithTag("create-submit").performClick();f.waitTag("feed-timeline");compose.onNodeWithContentDescription("Информация о встрече").assertExists();log("Same request retry -> real chat, no intermediate result; date without time");capture("created-chat");result.put("status","observed-pass")
 }catch(e:Throwable){result.put("status","failed").put("error",e.toString());runCatching{capture("failure-live")};throw e}}}finally{f.shell("wm size reset");f.shell("settings put system font_scale $font");File(out,"result.json").writeText(result.put("actions",actions).put("finishedAt",Instant.now().toString()).toString(2))}}
}
