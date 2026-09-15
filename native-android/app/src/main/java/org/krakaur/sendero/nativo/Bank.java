package org.krakaur.sendero.nativo;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import org.json.*;
import java.io.*;
import java.util.*;

/** Read-only versioned content, separate from children's records. No network or model. */
public final class Bank {
    private static SQLiteDatabase db;
    private Bank() {}
    public static synchronized void init(Context context) {
        if(db!=null) return;
        File dest=new File(context.getFilesDir(),"bank-0.3.0.db");
        try {
            if(!dest.exists()) {
                File temp=new File(context.getFilesDir(),"bank-0.3.0.tmp");
                try(InputStream in=context.getAssets().open("bank-0.3.0.db");OutputStream out=new FileOutputStream(temp)) {
                    byte[] bytes=new byte[8192]; int n; while((n=in.read(bytes))!=-1) out.write(bytes,0,n);
                }
                if(!temp.renameTo(dest)) throw new IOException("No se pudo preparar el banco de actividades.");
            }
            db=SQLiteDatabase.openDatabase(dest.getPath(),null,SQLiteDatabase.OPEN_READONLY);
        } catch(IOException e) {throw new IllegalStateException(e);}
    }
    public static JSONObject item(String id)throws JSONException {
        if(db==null) throw new JSONException("El banco no está preparado.");
        try(Cursor c=db.rawQuery("SELECT body FROM items WHERE id=?",new String[]{id})) {
            if(!c.moveToFirst()) throw new JSONException("Actividad desconocida.");
            return new JSONObject(c.getString(0));
        }
    }
    private static boolean contains(JSONArray a,String s) {for(int i=0;i<a.length();i++)if(s.equals(a.optString(i)))return true;return false;}
    private static JSONArray recent(JSONArray a,String s,int limit) {JSONArray out=new JSONArray();for(int i=Math.max(0,a.length()-limit+1);i<a.length();i++)out.put(a.optString(i));out.put(s);return out;}
    public static JSONObject draw(JSONObject profile,int level,boolean transfer,Random rng)throws JSONException {
        String pool=transfer?"transfer":"practice",key=level+"-"+pool;
        JSONObject history=profile.optJSONObject("bankHistory");if(history==null){history=new JSONObject();profile.put("bankHistory",history);}
        JSONObject used=history.optJSONObject(key);if(used==null){used=Engine.object("seen",new JSONObject(),"cycle",0);history.put(key,used);}
        JSONObject seen=used.getJSONObject("seen");
        JSONArray recent=history.optJSONArray("recent");if(recent==null)recent=new JSONArray();
        JSONArray families=history.optJSONArray("families");if(families==null)families=new JSONArray();
        String chosen=null;int best=Integer.MIN_VALUE,ties=0;
        for(int pass=0;pass<2&&chosen==null;pass++) {
            try(Cursor c=db.rawQuery("SELECT id,template,family FROM items WHERE level=? AND pool=? ORDER BY id",new String[]{String.valueOf(level),pool})) {
                while(c.moveToNext()) {
                    if(seen.has(c.getString(0)))continue;
                    int score=(contains(recent,c.getString(1))?0:4)+(contains(families,c.getString(2))?0:2);
                    if(score>best){best=score;chosen=c.getString(0);ties=1;}
                    else if(score==best&&rng.nextInt(++ties)==0)chosen=c.getString(0);
                }
            }
            if(chosen==null&&pass==0){seen=new JSONObject();used.put("seen",seen);used.put("cycle",used.optInt("cycle")+1);}
        }
        if(chosen==null)throw new JSONException("No hay actividades para este nivel.");
        JSONObject q=item(chosen);seen.put(chosen,true);
        history.put("recent",recent(recent,q.getString("template"),8));history.put("families",recent(families,q.getString("family"),2));
        q.put("novel",used.optInt("cycle")==0);q.put("cycle",used.optInt("cycle"));
        q.put("bankVersion","0.3.0");q.put("bankId",q.getString("id"));
        List<Integer> options=new ArrayList<>();for(int i=0;i<4;i++)options.add(q.getJSONArray("options").getInt(i));Collections.shuffle(options,rng);q.put("options",new JSONArray(options));
        q.put("attempts",new JSONArray());q.put("hint",false);q.put("solutionShown",false);q.put("activeMs",0);q.put("done",false);
        return q;
    }
    public static boolean valid(JSONObject q)throws JSONException {
        JSONObject original=item(q.optString("bankId"));
        for(String field:new String[]{"bankVersion"})if(!"0.3.0".equals(q.optString(field)))return false;
        for(String field:new String[]{"a","b","answer","level","prompt","explanation","solution","pool","dimension","template","family"})if(!original.get(field).equals(q.opt(field)))return false;
        if(!original.optString("labels").equals(q.optString("labels")))return false;
        JSONArray opts=q.getJSONArray("options"),base=original.getJSONArray("options");Set<Integer> values=new HashSet<>();
        for(int i=0;i<opts.length();i++)values.add(opts.getInt(i));if(values.size()!=4||opts.length()!=4)return false;
        for(int i=0;i<4;i++)if(!values.contains(base.getInt(i)))return false;
        for(int i=0;i<q.getJSONArray("attempts").length();i++)if(!values.contains(q.getJSONArray("attempts").getInt(i)))return false;
        return true;
    }
}
