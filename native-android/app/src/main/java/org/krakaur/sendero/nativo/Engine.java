package org.krakaur.sendero.nativo;

import org.json.*;
import java.text.SimpleDateFormat;
import java.util.*;

/** Platform-independent arithmetic and report contract, compatible with sendero.report.v1. */
public final class Engine {
    public static final String VERSION="0.3.0", SCHEMA="sendero.report.v2";
    public static final String[] TRAILS={"suma","resta","multi","tablas20","razonar"};
    private Engine() {}
    public static JSONObject object(Object... entries) {
        JSONObject o=new JSONObject();
        try { for(int i=0;i<entries.length;i+=2) o.put((String)entries[i],entries[i+1]); }
        catch(JSONException e){throw new IllegalArgumentException(e);}
        return o;
    }
    public static JSONObject copy(JSONObject o) { try{return new JSONObject(o.toString());}catch(JSONException e){throw new IllegalArgumentException(e);} }
    public static String now(){SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",Locale.US);f.setTimeZone(TimeZone.getTimeZone("UTC"));return f.format(new Date());}
    public static String id(){return UUID.randomUUID().toString();}
    public static JSONObject profile(String alias){return object("id",id(),"alias",alias,"adaptive",new JSONObject(),"current",JSONObject.NULL);}
    public static String title(String t){return t.equals("razonar")?"El taller de las ideas":t.equals("tablas20")?"Tablas hasta el 20":t.equals("suma")?"El bosque de las sumas":t.equals("resta")?"El río de las restas":"La huerta de los grupos";}
    public static String symbol(String t){return t.equals("razonar")?"?":t.equals("suma")?"+":t.equals("resta")?"−":"×";}
    public static String level(int n){return new String[]{"Primeros pasos","Un poco más lejos","Nuevos caminos","Gran exploración"}[n-1];}
    public static JSONObject question(String trail,int level,Random rng){
        if(!Arrays.asList(TRAILS).contains(trail)||trail.equals("razonar")||level<1||level>4)throw new IllegalArgumentException();
        boolean multiplication=trail.equals("multi")||trail.equals("tablas20");
        int max=(trail.equals("tablas20")?new int[]{10,12,15,20}:trail.equals("multi")?new int[]{3,5,8,10}:new int[]{5,10,20,50})[level-1];
        int min=1;
        int a=min+rng.nextInt(max-min+1),b=min+rng.nextInt(max-min+1);
        if(trail.equals("resta")&&a<b){int swap=a;a=b;b=swap;}
        int answer=trail.equals("suma")?a+b:trail.equals("resta")?a-b:a*b;
        Set<Integer> set=new LinkedHashSet<>();set.add(answer);
        while(set.size()<4)set.add(Math.max(0,answer-5)+rng.nextInt(answer+5-Math.max(0,answer-5)+1));
        List<Integer> options=new ArrayList<>(set);Collections.shuffle(options,rng);
        return object("a",a,"b",b,"answer",answer,"level",level,"options",new JSONArray(options),"attempts",new JSONArray(),"hint",false,"solutionShown",false,"activeMs",0,"done",false);
    }
    public static JSONObject session(String trail,int level,String profile){
        return object("id",id(),"profile",profile,"trail",trail,"level",level,"version",VERSION,"startedAt",now(),"completedAt",JSONObject.NULL,"index",0,"questions",new JSONArray().put(question(trail,level,new Random())));
    }
    public static void start(JSONObject p,String trail)throws JSONException {
        JSONObject state=p.getJSONObject("adaptive").optJSONObject(trail);int level=state==null?1:state.optInt("level",1);
        if(trail.equals("razonar"))p.put("current",object("id",id(),"profile",p.getString("id"),"trail",trail,"level",level,"version",VERSION,"startedAt",now(),"completedAt",JSONObject.NULL,"index",0,"questions",new JSONArray().put(Bank.draw(p,level,false,new Random()))));
        else {JSONObject session=session(trail,level,p.getString("id"));session.put("questions",new JSONArray().put(practiceQuestion(p,trail,level,new Random())));p.put("current",session);}
    }
    private static JSONObject practiceQuestion(JSONObject p,String trail,int level,Random rng)throws JSONException {
        JSONObject q=question(trail,level,rng),memory=p.optJSONObject("practiceMemory");if(memory==null)return q;
        JSONObject track=memory.optJSONObject(trail);if(track==null||rng.nextDouble()>0.65)return q;
        int step=track.optInt("step");JSONObject facts=track.optJSONObject("facts");if(facts==null)return q;
        Iterator<String> keys=facts.keys();JSONObject chosen=null;int oldest=Integer.MAX_VALUE;
        while(keys.hasNext()){JSONObject f=facts.getJSONObject(keys.next());if(f.optInt("level")==level&&f.optInt("due")<=step&&f.optInt("due")<oldest){chosen=f;oldest=f.optInt("due");}}
        if(chosen==null)return q;int a=chosen.getInt("a"),b=chosen.getInt("b"),answer=trail.equals("suma")?a+b:trail.equals("resta")?a-b:a*b;
        q.put("a",a);q.put("b",b);q.put("answer",answer);Set<Integer> values=new LinkedHashSet<>();values.add(answer);while(values.size()<4)values.add(Math.max(0,answer-5)+rng.nextInt(11));List<Integer> opts=new ArrayList<>(values);Collections.shuffle(opts,rng);q.put("options",new JSONArray(opts));q.put("review",true);return q;
    }
    private static void remember(JSONObject p,String trail,JSONObject q)throws JSONException {
        if(trail.equals("razonar"))return;JSONObject memory=p.optJSONObject("practiceMemory");if(memory==null){memory=new JSONObject();p.put("practiceMemory",memory);}JSONObject track=memory.optJSONObject(trail);if(track==null){track=object("step",0,"facts",new JSONObject());memory.put(trail,track);}int step=track.optInt("step")+1;track.put("step",step);JSONObject facts=track.getJSONObject("facts");String key=q.getInt("a")+":"+q.getInt("b");JSONObject old=facts.optJSONObject(key);int success=old==null?0:old.optInt("success");boolean ok=q.getJSONArray("attempts").length()==1&&q.getJSONArray("attempts").getInt(0)==q.getInt("answer")&&!q.optBoolean("hint");success=ok?Math.min(5,success+1):0;facts.put(key,object("a",q.getInt("a"),"b",q.getInt("b"),"level",q.getInt("level"),"success",success,"due",step+(ok?new int[]{3,5,10,20,35,60}[success]:2)));
    }
    public static String option(JSONObject q,int n){return q.has("labels")?q.optJSONArray("labels").optString(n):String.valueOf(n);}
    public static JSONObject currentQuestion(JSONObject session){return session.optJSONArray("questions").optJSONObject(session.optInt("index"));}
    public static boolean answer(JSONObject q,int answer){
        JSONArray attempts=q.optJSONArray("attempts"),options=q.optJSONArray("options");
        if(q.optBoolean("done"))return false;
        boolean offered=false;
        for(int i=0;i<options.length();i++)if(options.optInt(i)==answer)offered=true;
        for(int i=0;i<attempts.length();i++)if(attempts.optInt(i)==answer)return false;
        if(!offered)return false;
        attempts.put(answer);
        try{q.put("solutionShown",q.optBoolean("solutionShown")||answer!=q.optInt("answer"));q.put("done",answer==q.optInt("answer"));}catch(JSONException e){throw new IllegalArgumentException(e);}
        return true;
    }
    public static JSONObject adapt(JSONObject state,JSONObject q){
        int level=state.optInt("level",1),streak=state.optInt("streak"),support=state.optInt("support");
        JSONArray attempts=q.optJSONArray("attempts");
        boolean independent=attempts.length()==1&&attempts.optInt(0)==q.optInt("answer")&&!q.optBoolean("hint");
        if(independent){streak++;support=0;if(streak>=(q.has("bankId")?6:3)){level=Math.min(4,level+1);streak=0;}}
        else{streak=0;support++;if(support>=2){level=Math.max(1,level-1);support=0;}}
        return object("level",level,"streak",streak,"support",support);
    }
    public static JSONObject advance(JSONObject p)throws JSONException{
        JSONObject s=p.getJSONObject("current"),q=currentQuestion(s);if(!q.optBoolean("done"))return null;
        String trail=s.getString("trail");remember(p,trail,q);JSONObject states=p.getJSONObject("adaptive");
        JSONObject next=adapt(states.optJSONObject(trail)==null?object("level",q.getInt("level")):states.getJSONObject(trail),q);states.put(trail,next);
        if(s.getInt("index")==7){s.put("completedAt",now());p.put("current",JSONObject.NULL);return s;}
        s.put("index",s.getInt("index")+1);s.getJSONArray("questions").put(trail.equals("razonar")?Bank.draw(p,next.getInt("level"),s.getInt("index")==7,new Random()):practiceQuestion(p,trail,next.getInt("level"),new Random()));return null;
    }
    public static int[] metrics(JSONArray sessions,String trail,int level){
        // count, first, independent, hint, errors, second-attempt recovery, active milliseconds capped to int.
        int[] m=new int[7];
        for(int i=0;i<sessions.length();i++){JSONObject s=sessions.optJSONObject(i);if(!trail.isEmpty()&&!trail.equals(s.optString("trail")))continue;
            JSONArray qs=s.optJSONArray("questions");for(int j=0;j<qs.length();j++){JSONObject q=qs.optJSONObject(j);if(level>0&&q.optInt("level")!=level)continue;
                JSONArray a=q.optJSONArray("attempts");if(a.length()==0)continue;m[0]++;
                if(a.optInt(0)==q.optInt("answer")){m[1]++;if(a.length()==1&&!q.optBoolean("hint"))m[2]++;}
                else{m[4]++;if(a.length()==2&&a.optInt(1)==q.optInt("answer"))m[5]++;}
                if(q.optBoolean("hint"))m[3]++;
                m[6]=(int)Math.min(Integer.MAX_VALUE,(long)m[6]+q.optLong("activeMs"));
            }}return m;
    }
    public static JSONObject report(String profile,JSONArray sessions){return object("schema",SCHEMA,"version",VERSION,"profile",profile,"exportedAt",now(),"sessions",sessions);}
    private static void require(boolean valid)throws JSONException{if(!valid)throw new JSONException("Informe de Sendero no válido o fuera de límites.");}
    private static boolean finite(double d){return !Double.isNaN(d)&&!Double.isInfinite(d);}
    private static boolean integer(Object o){return o instanceof Number&&finite(((Number)o).doubleValue())&&((Number)o).doubleValue()==((Number)o).longValue();}
    private static boolean date(String s){try{SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",Locale.US);f.setLenient(false);f.setTimeZone(TimeZone.getTimeZone("UTC"));return s.length()==24&&f.parse(s)!=null;}catch(Exception e){return false;}}
    public static JSONObject validate(JSONObject r)throws JSONException{
        require((SCHEMA.equals(r.optString("schema"))||"sendero.report.v1".equals(r.optString("schema")))&&r.optString("profile").matches("[a-zA-Z0-9-]{1,60}"));
        JSONArray sessions=r.getJSONArray("sessions");require(sessions.length()<=5000);Set<String> ids=new HashSet<>();
        for(int i=0;i<sessions.length();i++){JSONObject s=sessions.getJSONObject(i);
            require(s.optString("id").matches("[a-zA-Z0-9-]{1,80}")&&ids.add(s.getString("id"))&&s.optString("profile").equals(r.getString("profile"))&&Arrays.asList(TRAILS).contains(s.optString("trail")));
            require(integer(s.get("level"))&&s.getInt("level")>=1&&s.getInt("level")<=4&&s.optString("version").length()<=20&&date(s.optString("startedAt"))&&date(s.optString("completedAt")));
            require(s.getString("completedAt").compareTo(s.getString("startedAt"))>=0);
            JSONArray qs=s.getJSONArray("questions");require(qs.length()==8);
            for(int j=0;j<8;j++){JSONObject q=qs.getJSONObject(j);
                for(String key:new String[]{"a","b","answer","level"})require(integer(q.get(key)));
                int a=q.getInt("a"),b=q.getInt("b"),answer=q.getInt("answer");require(a>=0&&a<=50&&b>=0&&b<=50&&q.getInt("level")>=1&&q.getInt("level")<=4);
                int expected=s.getString("trail").equals("suma")?a+b:s.getString("trail").equals("resta")?a-b:a*b;
                require((s.getString("trail").equals("razonar")?Bank.valid(q):answer==expected)&&answer>=0&&q.get("hint") instanceof Boolean&&(!q.has("solutionShown")||q.get("solutionShown") instanceof Boolean));
                Object time=q.get("activeMs");require(time instanceof Number&&finite(((Number)time).doubleValue())&&q.getDouble("activeMs")>=0&&q.getDouble("activeMs")<=86400000);
                JSONArray attempts=q.getJSONArray("attempts");require(attempts.length()>0&&attempts.length()<=20);
                for(int k=0;k<attempts.length();k++)require(integer(attempts.get(k))&&attempts.getInt(k)>=0&&attempts.getInt(k)<=2500);
                require(attempts.getInt(attempts.length()-1)==answer);
            }
        }return r;
    }
    public static String csv(JSONArray sessions)throws JSONException{
        StringBuilder b=new StringBuilder("\uFEFFperfil,sesion,contenido,nivel,a,b,respuesta,intentos,pista,solucion_mostrada,tiempo_ms,actividad,banco,dimension,reserva,nueva,enunciado,explicacion\r\n");
        for(int i=0;i<sessions.length();i++){JSONObject s=sessions.getJSONObject(i);JSONArray qs=s.getJSONArray("questions");
            for(int j=0;j<qs.length();j++){JSONObject q=qs.getJSONObject(j);Object[] row={s.getString("profile"),s.getString("id"),s.getString("trail"),q.getInt("level"),q.getInt("a"),q.getInt("b"),q.getInt("answer"),q.getJSONArray("attempts"),q.getBoolean("hint"),q.opt("solutionShown"),q.getLong("activeMs"),q.optString("bankId"),q.optString("bankVersion"),q.optString("dimension"),q.optString("pool"),q.opt("novel"),q.optString("prompt"),q.optString("explanation")};
                for(int k=0;k<row.length;k++){if(k>0)b.append(',');b.append('"').append(String.valueOf(row[k]).replace("\"","\"\"")).append('"');}b.append("\r\n");}}
        return b.toString();
    }
}

