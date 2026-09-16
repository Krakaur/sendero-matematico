package org.krakaur.sendero.nativo;
import org.junit.Test;
import org.json.*;
import java.util.*;
import static org.junit.Assert.*;
public class EngineTest {
    @Test public void fluencySeparatesFirstAnswerAndCorrection()throws Exception {
        JSONObject a=Engine.question("suma",1,new Random(1)),b=Engine.question("suma",1,new Random(2));
        a.put("activeMs",2000);Engine.answer(a,a.getInt("answer"));
        b.put("activeMs",4000);int wrong=b.getJSONArray("options").getInt(0);if(wrong==b.getInt("answer"))wrong=b.getJSONArray("options").getInt(1);
        Engine.answer(b,wrong);b.put("activeMs",94000);Engine.answer(b,b.getInt("answer"));
        JSONArray ss=new JSONArray().put(Engine.object("trail","suma","questions",new JSONArray().put(a).put(b)));
        assertArrayEquals(new double[]{2,1,6000,0},Engine.fluency(ss,"suma",1),0.01);
        a.put("hint",true);assertArrayEquals(new double[]{1,0,4000,1},Engine.fluency(ss,"suma",1),0.01);
        b.put("timingInterrupted",true);assertEquals(0,Engine.fluency(ss,"suma",1)[0],0.01);
        a.remove("hint");a.remove("timingProtocol");assertEquals(0,Engine.fluency(ss,"suma",1)[0],0.01);
    }
    @Test public void twelveThousandExercisesAreCoherent()throws Exception{
        Random rng=new Random(42);for(String t:new String[]{"suma","resta","multi","tablas20"})for(int l=1;l<=4;l++)for(int n=0;n<1000;n++){
            JSONObject q=Engine.question(t,l,rng);int a=q.getInt("a"),b=q.getInt("b"),answer=q.getInt("answer");assertEquals(t.equals("suma")?a+b:t.equals("resta")?a-b:a*b,answer);assertTrue(answer>=0);Set<Integer> values=new HashSet<>();for(int j=0;j<4;j++)values.add(q.getJSONArray("options").getInt(j));assertEquals(4,values.size());assertTrue(values.contains(answer));
        }
    }
    @Test public void errorRevealsAndCannotCountAsIndependent()throws Exception{
        JSONObject q=Engine.question("suma",1,new Random(1));int wrong=q.getJSONArray("options").getInt(0);if(wrong==q.getInt("answer"))wrong=q.getJSONArray("options").getInt(1);assertTrue(Engine.answer(q,wrong));assertTrue(q.getBoolean("solutionShown"));assertFalse(Engine.answer(q,wrong));assertTrue(Engine.answer(q,q.getInt("answer")));assertFalse(Engine.answer(q,wrong));JSONObject state=Engine.adapt(Engine.object("level",2,"streak",2),q);assertEquals(2,state.getInt("level"));assertEquals(0,state.getInt("streak"));assertEquals(1,state.getInt("support"));
    }
    @Test public void completedSessionRoundTripsAndAdapts()throws Exception{
        JSONObject p=Engine.profile("Colibrí");p.put("current",Engine.session("suma",1,p.getString("id")));JSONObject completed=null;
        for(int i=0;i<8;i++){JSONObject q=Engine.currentQuestion(p.getJSONObject("current"));Engine.answer(q,q.getInt("answer"));completed=Engine.advance(p);}
        assertNotNull(completed);assertTrue(p.isNull("current"));assertEquals(3,p.getJSONObject("adaptive").getJSONObject("suma").getInt("level"));JSONArray sessions=new JSONArray().put(completed);assertEquals(8,Engine.metrics(sessions,"",0)[2]);Engine.validate(Engine.report(p.getString("id"),sessions));assertFalse(Engine.report(p.getString("id"),sessions).toString().contains("Colibrí"));assertTrue(Engine.csv(sessions).startsWith("\uFEFFperfil"));
    }
    @Test public void adjustmentIsBoundedAndIndependentOfTime()throws Exception{
        JSONObject q=Engine.question("multi",1,new Random(4));q.put("activeMs",800000);Engine.answer(q,q.getInt("answer"));assertEquals(4,Engine.adapt(Engine.object("level",4,"streak",2),q).getInt("level"));q.put("hint",true);assertEquals(1,Engine.adapt(Engine.object("level",1,"support",1),q).getInt("level"));
    }
    @Test(expected=JSONException.class) public void malformedReportRejected()throws Exception{Engine.validate(Engine.object("schema",Engine.SCHEMA,"profile","bad/profile","sessions",new JSONArray()));}
}
