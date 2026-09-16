package org.krakaur.sendero.nativo;
import android.content.*;
import android.graphics.Bitmap;
import android.view.*;
import androidx.test.core.app.ActivityScenario;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import org.junit.*;
import org.junit.runner.RunWith;
import org.json.*;
import java.io.*;
import java.lang.reflect.Field;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.junit.Assert.*;
import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.*;
import static androidx.test.espresso.matcher.ViewMatchers.*;
import static androidx.test.espresso.assertion.ViewAssertions.matches;

@RunWith(AndroidJUnit4.class) public class NativeTest {
    private Context context;private Store store;
    @Before public void setup(){context=InstrumentationRegistry.getInstrumentation().getTargetContext();context.deleteDatabase("sendero-native.db");store=new Store(context);Bank.init(context);}
    @After public void close(){store.close();}
    private JSONObject completed(String id)throws Exception{JSONObject p=Engine.profile("Test");p.put("id",id);p.put("current",Engine.session("suma",1,id));JSONObject out=null;for(int i=0;i<8;i++){JSONObject q=Engine.currentQuestion(p.getJSONObject("current"));Engine.answer(q,q.getInt("answer"));out=Engine.advance(p);}return out;}
    @Test public void passwordsIsolationDeduplicationAndAtomicRollback()throws Exception{
        JSONObject a=store.create("Colibrí","clave-a".toCharArray()),b=store.create("Zorro","clave-b".toCharArray());String aid=a.getString("id"),bid=b.getString("id");
        try{store.login(aid,"clave-b".toCharArray());fail("Wrong password accepted");}catch(Exception expected){assertTrue(expected.getMessage().contains("incorrecta"));}
        assertEquals(aid,store.login(aid,"clave-a".toCharArray()).getString("id"));
        JSONObject s=completed(aid);store.save(a,s);assertEquals(1,store.sessions(aid,false).length());assertEquals(0,store.sessions(bid,false).length());
        JSONObject r=Engine.report(aid,new JSONArray().put(s));assertEquals(1,store.receive(bid,r));assertEquals(0,store.receive(bid,r));assertEquals(0,store.sessions(aid,true).length());
        JSONObject conflict=Engine.copy(s);conflict.getJSONArray("questions").getJSONObject(0).put("activeMs",123);JSONObject extra=completed(aid);
        try{store.receive(bid,Engine.report(aid,new JSONArray().put(extra).put(conflict)));fail("Conflict accepted");}catch(Exception expected){assertTrue(expected.getMessage().contains("mismo identificador"));}
        assertEquals(1,store.sessions(bid,true).length());
        store.changePassword(aid,"clave-a".toCharArray(),"nueva-clave".toCharArray());assertEquals(aid,store.login(aid,"nueva-clave".toCharArray()).getString("id"));
        store.close();store=new Store(context);assertEquals(1,store.sessions(aid,false).length());
        assertFalse(r.toString().contains("clave"));assertFalse(r.toString().contains("Colibrí"));
    }
    @Test public void bankHistorySurvivesAndNewReportsRoundTrip()throws Exception {
        JSONObject p=store.create("Ideas","clave-ideas".toCharArray()),other=store.create("Otro","clave-otro".toCharArray());Engine.start(p,"razonar");java.util.Set<String> ids=new java.util.HashSet<>();JSONObject complete=null;
        for(int i=0;i<8;i++){JSONObject q=Engine.currentQuestion(p.getJSONObject("current"));assertTrue(ids.add(q.getString("bankId")));assertEquals(i==7?"transfer":"practice",q.getString("pool"));assertTrue(Bank.valid(q));Engine.answer(q,q.getInt("answer"));complete=Engine.advance(p);store.save(p,complete);}
        assertNotNull(complete);assertFalse(other.has("bankHistory"));JSONObject loaded=store.login(p.getString("id"),"clave-ideas".toCharArray());assertEquals(p.getJSONObject("bankHistory").toString(),loaded.getJSONObject("bankHistory").toString());
        JSONObject report=Engine.report(p.getString("id"),new JSONArray().put(complete));Engine.validate(report);assertEquals(1,store.receive(other.getString("id"),report));assertEquals(0,store.receive(other.getString("id"),report));
        complete.getJSONArray("questions").getJSONObject(0).put("prompt","Texto manipulado");try{Engine.validate(report);fail("Changed content accepted");}catch(JSONException expected){}
    }
    @Test public void nativeReasoningCorrectionAndLabelsAreUsable()throws Exception {
        JSONObject p=store.create("Ideas","clave-ideas".toCharArray());
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            waitReady(scenario);onView(withText("Ideas")).perform(scrollTo(),click());onView(withHint("Contraseña")).perform(typeText("clave-ideas"),closeSoftKeyboard());onView(withText("Entrar")).perform(click());waitReady(scenario);
            onView(withText("?  El taller de las ideas")).perform(scrollTo(),click());waitReady(scenario);screenshot(scenario,"06-reasoning");
            for(int i=0;i<8;i++) {JSONObject q=Engine.currentQuestion(current(scenario).getJSONObject("current"));if(i==0){int wrong=0;while(q.getJSONArray("options").getInt(wrong)==q.getInt("answer"))wrong++;onView(withId(MainActivity.ANSWER_BASE+wrong)).perform(scrollTo(),click());waitReady(scenario);onView(withId(MainActivity.SOLUTION)).perform(scrollTo()).check(matches(withText("¡"+q.getString("solution")+"!")));screenshot(scenario,"07-reasoning-correction");scenario.recreate();waitReady(scenario);}int answer=0;while(q.getJSONArray("options").getInt(answer)!=q.getInt("answer"))answer++;onView(withId(MainActivity.ANSWER_BASE+answer)).perform(scrollTo(),click());waitReady(scenario);onView(withId(MainActivity.NEXT)).perform(scrollTo(),click());waitReady(scenario);}
            screenshot(scenario,"08-reasoning-progress");assertEquals(1,store.sessions(p.getString("id"),false).length());
        }
    }
    private void waitReady(ActivityScenario<MainActivity> scenario)throws Exception{
        for(int i=0;i<150;i++){AtomicBoolean ready=new AtomicBoolean();scenario.onActivity(a->{try{Field f=MainActivity.class.getDeclaredField("busy");f.setAccessible(true);ready.set(!f.getBoolean(a));}catch(Exception e){throw new RuntimeException(e);}});if(ready.get()){InstrumentationRegistry.getInstrumentation().waitForIdleSync();return;}Thread.sleep(100);}fail("Activity remained busy");
    }
    private JSONObject current(ActivityScenario<MainActivity> scenario){final JSONObject[] result={null};scenario.onActivity(a->{try{Field f=MainActivity.class.getDeclaredField("profile");f.setAccessible(true);result[0]=Engine.copy((JSONObject)f.get(a));}catch(Exception e){throw new RuntimeException(e);}});return result[0];}
    private void screenshot(ActivityScenario<MainActivity> scenario,String name)throws Exception{
        scenario.onActivity(a->a.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE));InstrumentationRegistry.getInstrumentation().waitForIdleSync();Thread.sleep(300);
        Bitmap bitmap=InstrumentationRegistry.getInstrumentation().getUiAutomation().takeScreenshot();assertNotNull(bitmap);File out=new File(context.getExternalFilesDir(null),name+".png");try(FileOutputStream stream=new FileOutputStream(out)){bitmap.compress(Bitmap.CompressFormat.PNG,100,stream);}bitmap.recycle();
        // Gradle removes the test application after the run. Preserve synthetic evidence first.
        try(InputStream command=new android.os.ParcelFileDescriptor.AutoCloseInputStream(InstrumentationRegistry.getInstrumentation().getUiAutomation().executeShellCommand("cp "+out.getAbsolutePath()+" /data/local/tmp/sendero-"+name+".png"))){while(command.read()!=-1){}}
    }
    @Test public void nativeGameSurvivesRecreationAndHasVisibleCorrection()throws Exception{
        JSONObject p=store.create("Colibrí","clave-prueba".toCharArray());String id=p.getString("id");
        try(ActivityScenario<MainActivity> scenario=ActivityScenario.launch(MainActivity.class)){
            waitReady(scenario);onView(withText("Colibrí")).perform(scrollTo(),click());onView(withHint("Contraseña")).perform(typeText("clave-prueba"),closeSoftKeyboard());onView(withText("Entrar")).perform(click());waitReady(scenario);screenshot(scenario,"01-home");
            onView(withText("+  El bosque de las sumas")).perform(scrollTo(),click());waitReady(scenario);
            JSONObject q=Engine.currentQuestion(current(scenario).getJSONObject("current"));int wrong=0;if(q.getJSONArray("options").getInt(0)==q.getInt("answer"))wrong=1;
            onView(withId(MainActivity.ANSWER_BASE+wrong)).perform(scrollTo(),click());waitReady(scenario);onView(withId(MainActivity.SOLUTION)).check(matches(withText(org.hamcrest.Matchers.startsWith("¡"))));screenshot(scenario,"02-correction");
            scenario.recreate();waitReady(scenario);assertTrue(Engine.currentQuestion(current(scenario).getJSONObject("current")).getBoolean("solutionShown"));
            scenario.onActivity(a->a.setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));Thread.sleep(1000);waitReady(scenario);onView(withId(MainActivity.SOLUTION)).perform(scrollTo());screenshot(scenario,"04-landscape-correction");
            scenario.onActivity(a->a.setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT));Thread.sleep(1000);waitReady(scenario);
            for(int i=0;i<8;i++){q=Engine.currentQuestion(current(scenario).getJSONObject("current"));int option=0;while(q.getJSONArray("options").getInt(option)!=q.getInt("answer"))option++;onView(withId(MainActivity.ANSWER_BASE+option)).perform(scrollTo(),click());waitReady(scenario);if(i<7)assertEquals(i+1,current(scenario).getJSONObject("current").getInt("index"));}
            screenshot(scenario,"03-progress");assertEquals(1,store.sessions(id,false).length());assertEquals(7,Engine.metrics(store.sessions(id,false),"",0)[2]);
            try(android.os.ParcelFileDescriptor command=InstrumentationRegistry.getInstrumentation().getUiAutomation().executeShellCommand("settings put system font_scale 1.5")){Thread.sleep(1200);}waitReady(scenario);screenshot(scenario,"05-large-text-progress");
            try(android.os.ParcelFileDescriptor command=InstrumentationRegistry.getInstrumentation().getUiAutomation().executeShellCommand("settings put system font_scale 1.0")){Thread.sleep(1000);}waitReady(scenario);
            onView(withText("Salir")).perform(click());waitReady(scenario);onView(withText("Cada explorador, su camino")).check(matches(isDisplayed()));
        }
    }
}
