package org.krakaur.sendero.nativo;

import android.content.*;
import android.database.Cursor;
import android.database.sqlite.*;
import android.util.Base64;
import org.json.*;
import java.security.*;
import java.util.*;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

/** All calls run on the activity's serial IO executor. Passwords never enter reports. */
public final class Store extends SQLiteOpenHelper {
    public Store(Context c){super(c,"sendero-native.db",null,1);}
    @Override public void onCreate(SQLiteDatabase db){
        db.execSQL("CREATE TABLE profiles(id TEXT PRIMARY KEY, alias TEXT NOT NULL UNIQUE COLLATE NOCASE, body TEXT NOT NULL, salt TEXT NOT NULL, hash TEXT NOT NULL, failures INTEGER NOT NULL DEFAULT 0, retry INTEGER NOT NULL DEFAULT 0)");
        db.execSQL("CREATE TABLE sessions(owner TEXT NOT NULL,id TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(owner,id))");
        db.execSQL("CREATE TABLE received(owner TEXT NOT NULL,profile TEXT NOT NULL,id TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(owner,profile,id))");
    }
    @Override public void onUpgrade(SQLiteDatabase db,int old,int next){throw new IllegalStateException("Se necesita una migración compatible antes de abrir estos datos.");}
    public JSONArray profiles()throws JSONException{
        JSONArray rows=new JSONArray();try(Cursor c=getReadableDatabase().rawQuery("SELECT id,alias FROM profiles ORDER BY alias",null)){while(c.moveToNext())rows.put(Engine.object("id",c.getString(0),"alias",c.getString(1)));}return rows;
    }
    public JSONObject profile(String id)throws JSONException{
        try(Cursor c=getReadableDatabase().rawQuery("SELECT body FROM profiles WHERE id=?",new String[]{id})){if(!c.moveToFirst())throw new JSONException("Perfil no encontrado.");return new JSONObject(c.getString(0));}
    }
    private static String derive(char[] password,byte[] salt)throws GeneralSecurityException{
        PBEKeySpec spec=new PBEKeySpec(password,salt,210000,256);
        try{return Base64.encodeToString(SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded(),Base64.NO_WRAP);}finally{spec.clearPassword();}
    }
    public JSONObject create(String alias,char[] password)throws Exception{
        alias=alias.trim();if(alias.length()<2||alias.length()>24||password.length<6||password.length>128)throw new Exception("Usa un alias de 2 a 24 caracteres y una contraseña de 6 a 128 caracteres.");
        if(profiles().length()>=8)throw new Exception("Este teléfono admite hasta 8 perfiles.");
        byte[] salt=new byte[16];new SecureRandom().nextBytes(salt);String hash;
        try{hash=derive(password,salt);}finally{Arrays.fill(password,'\0');}
        JSONObject p=Engine.profile(alias);ContentValues v=new ContentValues();v.put("id",p.getString("id"));v.put("alias",alias);v.put("body",p.toString());v.put("salt",Base64.encodeToString(salt,Base64.NO_WRAP));v.put("hash",hash);
        try{getWritableDatabase().insertOrThrow("profiles",null,v);}catch(SQLiteConstraintException e){throw new Exception("Ese alias ya existe. Elige otro.");}return p;
    }
    public JSONObject login(String id,char[] password)throws Exception{
        SQLiteDatabase db=getWritableDatabase();
        try(Cursor c=db.rawQuery("SELECT salt,hash,failures,retry FROM profiles WHERE id=?",new String[]{id})){
            if(!c.moveToFirst())throw new Exception("Perfil no encontrado.");
            long now=System.currentTimeMillis();if(c.getLong(3)>now)throw new Exception("Espera un minuto antes de volver a intentar.");
            String actual=derive(password,Base64.decode(c.getString(0),Base64.NO_WRAP));
            boolean valid=MessageDigest.isEqual(actual.getBytes(java.nio.charset.StandardCharsets.UTF_8),c.getString(1).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            int failures=valid?0:c.getInt(2)+1;ContentValues v=new ContentValues();v.put("failures",failures);v.put("retry",!valid&&failures>=5?now+60000:0);db.update("profiles",v,"id=?",new String[]{id});
            if(!valid)throw new Exception("Contraseña incorrecta.");return profile(id);
        }finally{Arrays.fill(password,'\0');}
    }
    public void changePassword(String id,char[] previous,char[] next)throws Exception{
        try{login(id,previous);if(next.length<6||next.length>128)throw new Exception("La contraseña debe tener entre 6 y 128 caracteres.");byte[] salt=new byte[16];new SecureRandom().nextBytes(salt);ContentValues v=new ContentValues();v.put("salt",Base64.encodeToString(salt,Base64.NO_WRAP));v.put("hash",derive(next,salt));getWritableDatabase().update("profiles",v,"id=?",new String[]{id});}finally{Arrays.fill(previous,'\0');Arrays.fill(next,'\0');}
    }
    public void save(JSONObject p,JSONObject completed)throws JSONException{
        SQLiteDatabase db=getWritableDatabase();db.beginTransaction();try{
            ContentValues v=new ContentValues();v.put("body",p.toString());if(db.update("profiles",v,"id=?",new String[]{p.getString("id")})!=1)throw new IllegalStateException("Perfil no encontrado.");
            if(completed!=null){v=new ContentValues();v.put("owner",p.getString("id"));v.put("id",completed.getString("id"));v.put("body",completed.toString());db.insertOrThrow("sessions",null,v);}db.setTransactionSuccessful();
        }finally{db.endTransaction();}
    }
    public JSONArray sessions(String owner,boolean received)throws JSONException{
        JSONArray out=new JSONArray();String table=received?"received":"sessions";
        try(Cursor c=getReadableDatabase().rawQuery("SELECT body FROM "+table+" WHERE owner=? ORDER BY rowid",new String[]{owner})){while(c.moveToNext())out.put(new JSONObject(c.getString(0)));}return out;
    }
    // Key-order independent equality rejects conflicting IDs instead of silently overwriting evidence.
    private static boolean same(Object a,Object b)throws JSONException{
        if(a instanceof JSONObject&&b instanceof JSONObject){JSONObject x=(JSONObject)a,y=(JSONObject)b;if(x.length()!=y.length())return false;Iterator<String> it=x.keys();while(it.hasNext()){String k=it.next();if(!y.has(k)||!same(x.get(k),y.get(k)))return false;}return true;}
        if(a instanceof JSONArray&&b instanceof JSONArray){JSONArray x=(JSONArray)a,y=(JSONArray)b;if(x.length()!=y.length())return false;for(int i=0;i<x.length();i++)if(!same(x.get(i),y.get(i)))return false;return true;}return Objects.equals(a,b);
    }
    public int receive(String owner,JSONObject report)throws Exception{
        Engine.validate(report);SQLiteDatabase db=getWritableDatabase();int added=0;db.beginTransaction();try{
            JSONArray sessions=report.getJSONArray("sessions");String profile=report.getString("profile");
            for(int i=0;i<sessions.length();i++){JSONObject s=sessions.getJSONObject(i);String id=s.getString("id");
                try(Cursor c=db.rawQuery("SELECT body FROM received WHERE owner=? AND profile=? AND id=?",new String[]{owner,profile,id})){
                    if(c.moveToFirst()){if(!same(new JSONObject(c.getString(0)),s))throw new Exception("Hay dos informes diferentes con el mismo identificador. No se importó ningún registro.");continue;}}
                ContentValues v=new ContentValues();v.put("owner",owner);v.put("profile",profile);v.put("id",id);v.put("body",s.toString());db.insertOrThrow("received",null,v);added++;
            }db.setTransactionSuccessful();return added;
        }finally{db.endTransaction();}
    }
}
