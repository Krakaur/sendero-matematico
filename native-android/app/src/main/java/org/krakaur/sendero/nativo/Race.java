package org.krakaur.sendero.nativo;
import org.json.*;
import java.util.*;
public final class Race {
 private Race(){}
 public static JSONObject create(JSONArray sessions,String trail,int level)throws JSONException{
  List<Long> times=new ArrayList<>();for(int i=0;i<sessions.length();i++){JSONObject s=sessions.getJSONObject(i);if(!trail.equals(s.optString("trail")))continue;JSONArray qs=s.getJSONArray("questions");for(int j=0;j<qs.length();j++){JSONObject q=qs.getJSONObject(j);long t=q.optLong("firstResponseMs");if(q.optInt("level")==level&&q.optInt("timingProtocol")==1&&!q.optBoolean("hint")&&!q.optBoolean("timingInterrupted")&&t>=500&&t<=60000)times.add(t);}}
  if(times.size()>24)times=new ArrayList<>(times.subList(times.size()-24,times.size()));Collections.sort(times);double pace=times.size()>=5?times.get(times.size()/2):6000,target=Math.max(24000,Math.min(160000,pace*8*1.2));
  return Engine.object("protocol",1,"elapsedMs",0,"level",level,"calibrationN",times.size(),"finishMs",new JSONArray(new double[]{target*1.22,target,target*.82}),"names",new JSONArray(new String[]{"Nube","Rayo","Chispa"}));
 }
 public static int first(JSONObject s){int n=0;JSONArray qs=s.optJSONArray("questions");for(int i=0;i<qs.length();i++){JSONObject q=qs.optJSONObject(i);if(q.optBoolean("done")&&q.optJSONArray("attempts").length()==1&&q.optJSONArray("attempts").optInt(0)==q.optInt("answer")&&!q.optBoolean("hint"))n++;}return n;}
 public static int done(JSONObject s){int n=0;JSONArray qs=s.optJSONArray("questions");for(int i=0;i<qs.length();i++)if(qs.optJSONObject(i).optBoolean("done"))n++;return n;}
 public static int level(JSONObject s){int n=first(s),l=s.optJSONObject("race").optInt("level",1);return n>=7?Math.min(4,l+1):n<=4?Math.max(1,l-1):l;}
 public static int rank(JSONObject s,long elapsed){int rank=1;double progress=done(s)/8.0;JSONArray finishes=s.optJSONObject("race").optJSONArray("finishMs");for(int i=0;i<3;i++){double t=finishes.optDouble(i);if(progress==1?t<elapsed:Math.min(1,elapsed/t)>progress)rank++;}return rank;}
 public static int points(JSONObject s){return done(s)*10+first(s)*5;}
}
