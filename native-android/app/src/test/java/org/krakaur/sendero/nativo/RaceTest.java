package org.krakaur.sendero.nativo;
import org.json.*;import org.junit.Test;import static org.junit.Assert.*;
public class RaceTest {
 @Test public void fixedLevelAndRewards()throws Exception{
  JSONObject p=Engine.profile("Test");Engine.start(p,"suma");JSONObject s=p.getJSONObject("current");s.put("race",Race.create(new JSONArray(),"suma",1));
  JSONObject complete=null;for(int i=0;i<8;i++){JSONObject q=Engine.currentQuestion(p.getJSONObject("current"));assertEquals(1,q.getInt("level"));Engine.answer(q,q.getInt("answer"));complete=Engine.advance(p);}
  assertNotNull(complete);assertEquals(120,Race.points(complete));assertEquals(2,p.getJSONObject("adaptive").getJSONObject("suma").getInt("level"));assertEquals(1,Race.rank(complete,1000));assertEquals(4,Race.rank(complete,200000));
 }
}
