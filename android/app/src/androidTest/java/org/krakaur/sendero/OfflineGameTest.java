package org.krakaur.sendero;

import android.webkit.WebView;
import android.view.View;
import android.view.ViewGroup;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.rule.ActivityTestRule;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class OfflineGameTest {
    @Rule public ActivityTestRule<MainActivity> rule = new ActivityTestRule<>(MainActivity.class);

    private WebView findWeb(View view) {
        if (view instanceof WebView) return (WebView) view;
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                WebView found = findWeb(group.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }
    private String js(String script) throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            WebView web = findWeb(rule.getActivity().getWindow().getDecorView());
            assertNotNull(web);
            web.evaluateJavascript(script, value -> { result.set(value); latch.countDown(); });
        });
        assertTrue("JavaScript callback timeout", latch.await(10, TimeUnit.SECONDS));
        return result.get();
    }
    private void until(String condition) throws Exception {
        long deadline = System.currentTimeMillis() + 20000;
        do {
            if ("true".equals(js(condition))) return;
            Thread.sleep(200);
        } while (System.currentTimeMillis() < deadline);
        fail("Condition not reached: " + condition);
    }
    @Test public void bundledGameKeepsProgressAndTeachesAfterAnError() throws Exception {
        // The production manifest has no INTERNET permission: first load is necessarily local.
        until("document.querySelector('#offline-badge')?.textContent === 'Incluida sin conexión'");
        assertEquals("true", js("document.querySelector('#main').textContent.includes('El bosque de las sumas')"));
        js("document.querySelector('[data-trail=\"suma\"]').click()");
        until("!!document.querySelector('.answer')");
        // Choose a wrong option from the visible exercise; then follow the revealed solution.
        js("(()=>{const text=document.querySelector('.equation').textContent; const ns=text.match(/\\d+/g).map(Number); const correct=ns[0]+ns[1]; [...document.querySelectorAll('.answer')].find(x=>Number(x.textContent)!==correct).click();})()");
        until("!!document.querySelector('.solution-callout')");
        assertEquals("true", js("/^¡.*=!?.*!$/.test(document.querySelector('.solution-callout strong').textContent)"));
        assertEquals("true", js("document.documentElement.scrollWidth <= window.innerWidth"));
        String solution = js("document.querySelector('.solution-callout strong').textContent");
        js("window.__senderoTestOldDocument = true");
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> findWeb(rule.getActivity().getWindow().getDecorView()).reload());
        until("!window.__senderoTestOldDocument && document.readyState === 'complete' && !!document.querySelector('.solution-callout')");
        assertEquals(solution, js("document.querySelector('.solution-callout strong').textContent"));
        js("(()=>{const answer=document.querySelector('.solution-callout strong').textContent.match(/=\\s*(\\d+)/)[1]; [...document.querySelectorAll('.answer')].find(x=>x.textContent.trim()===answer).click();})()");
        until("document.querySelector('.solution-callout').textContent.includes('Ya puedes continuar')");
        assertEquals("true", js("JSON.parse(localStorage.getItem('sendero.state.v1')).current.questions[0].solutionShown === true"));
        assertEquals("2", js("JSON.parse(localStorage.getItem('sendero.state.v1')).current.questions[0].attempts.length"));
    }
}
