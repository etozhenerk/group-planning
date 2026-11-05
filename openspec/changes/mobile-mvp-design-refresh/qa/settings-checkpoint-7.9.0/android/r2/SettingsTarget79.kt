package dev.groupplanning.android
import androidx.compose.ui.test.*
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.text.TextLayoutResult
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import java.util.regex.Pattern
import dev.groupplanning.android.qaCreateEmptyComposeRule as createEmptyComposeRule
import java.io.File
import java.time.Instant
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TestRule
class SettingsTarget79 {
 @get:Rule(order=0) val locale:TestRule=QaAppLocaleRule()
 @get:Rule(order=1) val compose=createEmptyComposeRule()
 private val f=InvitationUiFixture(compose)
 private val out get()=File(checkNotNull(InstrumentationRegistry.getArguments().getString("additionalTestOutputDir")))
 private val actions=JSONArray();private val result=JSONObject();private val id="c0fe0000-0000-4000-8000-000000000100"
 private fun log(s:String){actions.put(JSONObject().put("action",s).put("at",Instant.now().toString()))}
 @Before fun setup(){f.configure();out.mkdirs()}
 private fun hideKeyboard(){if(f.device.hasObject(By.pkg(Pattern.compile(".*inputmethod.*")))){f.device.pressBack();Thread.sleep(150)}}
 private fun capture(name:String){f.screenshot(name);File(out,"$name.semantics.txt").writeText(compose.onAllNodes(isRoot(),useUnmergedTree=true).printToString(maxDepth=100))}
 private fun info(){f.waitTag("meetings-list");compose.onNodeWithTag("meetings-list").performScrollToNode(hasTestTag("meeting-$id"));compose.onNodeWithTag("meeting-$id").performClick();f.waitTag("invitation-conversation");compose.onNodeWithContentDescription("Информация о встрече").performClick();f.waitTag("meeting-information")}
 private fun settings(){compose.onNodeWithTag("open-settings").performScrollTo().performClick();f.waitTag("meeting-settings")}
 private fun style(text:String,ancestor:String?=null):JSONObject{val l=mutableListOf<TextLayoutResult>();val matcher=hasText(text) and (ancestor?.let{hasAnyAncestor(hasTestTag(it))}?:SemanticsMatcher("all"){true});compose.onNode(matcher,useUnmergedTree=true).performSemanticsAction(SemanticsActions.GetTextLayoutResult){it(l)};val v=l.single();return JSONObject().put("fontSp",v.layoutInput.style.fontSize.value).put("lineHeightSp",v.layoutInput.style.lineHeight.value).put("color",v.layoutInput.style.color.toString()).put("weight",v.layoutInput.style.fontWeight.toString())}
 private fun role(body:()->Unit){f.launch("cover-edit").use{try{body()}catch(e:Throwable){runCatching{capture("failure-live")};throw e}}}
 @Test fun onlyBatch(){try{val api=ChatReadLiveApi(f.context);
 role{info();compose.onAllNodes(hasText("Время пока не выбрано",substring=true) and hasAnyAncestor(hasTestTag("meeting-information")),useUnmergedTree=true).assertCountEquals(1);log("Result-info starts_on has exactly one no-time explanation");capture("no-time-info");settings();val replace=compose.onNodeWithTag("cover-select").fetchSemanticsNode().boundsInRoot;val remove=compose.onNodeWithTag("cover-remove").fetchSemanticsNode().boundsInRoot;result.put("coverSameRow360",kotlin.math.abs(replace.top-remove.top)<2f).put("replaceBoundsPx",replace.toString()).put("removeBoundsPx",remove.toString()).put("replaceStyle",style("Заменить","meeting-settings")).put("removeStyle",style("Убрать фото","meeting-settings"));compose.onNodeWithText("Сохранить").assertExists();log("360dp cover action row and approved Save copy");capture("cover360");compose.onNodeWithText("Время можно уточнить позже · Москва").performScrollTo().assertIsDisplayed();capture("time-helper");compose.onNodeWithContentDescription("Название").performScrollTo().performTextReplacement("");compose.onNodeWithContentDescription("Описание").performScrollTo().performTextInput("Только targeted error focus");compose.onNodeWithTag("settings-save").performClick();f.waitText("Название должно содержать от 1 до 120 символов.");compose.waitUntil(5000){runCatching{compose.onNodeWithContentDescription("Название").assertIsFocused()}.isSuccess};capture("title-focus-ime");log("Invalid title: focus transferred from Description to Title with inline hint and IME");hideKeyboard();f.device.pressBack();f.waitText("Выйти без сохранения?");compose.onNodeWithText("Правки встречи не сохранятся.").assertExists();compose.onNodeWithText("Выйти без сохранения").assertExists();capture("approved-dirty-copy");log("Only dirty confirmation copy inspected; stay/leave/save routes not repeated")}
 role{info();settings();compose.onNodeWithContentDescription("Описание").performScrollTo().performTextReplacement("Targeted notice/review");hideKeyboard();val current=api.request("cover-edit","meetings/$id");result.put("reviewServerCoverPresent",current.optString("cover_url").isNotEmpty());api.request("cover-edit","meetings/$id","PATCH",JSONObject().put("expected_revision",current.getString("revision")).put("title","Обновление с другого устройства"));compose.onNodeWithTag("settings-save").performClick();f.waitText("Встреча изменилась");capture("notice-icon");compose.onNodeWithTag("settings-reload").performClick();f.waitText("Продолжить с моими правками");f.waitText("Ваши правки остались в форме. Обновлённые поля, которые вы не меняли, подставятся автоматически.");compose.onAllNodes(hasTestTag("meeting-cover") and hasAnyAncestor(hasTestTag("meeting-settings")),useUnmergedTree=true).assertCountEquals(0);result.put("reviewTitleStyle",style("Обновление с другого устройства","meeting-settings"));capture("review-render-only");log("Real409 only for notice/review rendering: icon, title23/30, plain facts/no cover and rebase explanation; resume/save not repeated")}
 result.put("status","observed-pass")
 }catch(e:Throwable){result.put("status","failed").put("error",e.toString());throw e}finally{File(out,"result.json").writeText(result.put("actions",actions).put("at",Instant.now().toString()).toString(2))}}
}
