package org.krakaur.sendero.nativo;
import org.json.*;
import javax.crypto.*;
import javax.crypto.spec.*;
import java.security.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
/** Portable protected snapshot; independent of Android Keystore and the login password. */
public final class BackupCrypto {
 private static final String SCHEMA="sendero.native-backup.v1";
 private static SecretKey key(char[] password,byte[] salt)throws Exception {
  if(password.length<10||password.length>128)throw new Exception("Usa una contraseña de respaldo de 10 a 128 caracteres.");
  PBEKeySpec spec=new PBEKeySpec(password,salt,210000,256);
  try{return new SecretKeySpec(SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded(),"AES");}finally{spec.clearPassword();}
 }
 public static JSONObject encrypt(JSONObject data,char[] password)throws Exception {
  byte[] salt=new byte[16],iv=new byte[12];new SecureRandom().nextBytes(salt);new SecureRandom().nextBytes(iv);
  try{Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,key(password,salt),new GCMParameterSpec(128,iv));c.updateAAD(SCHEMA.getBytes(StandardCharsets.UTF_8));
   return Engine.object("schema",SCHEMA,"iterations",210000,"salt",Base64.getEncoder().encodeToString(salt),"iv",Base64.getEncoder().encodeToString(iv),"data",Base64.getEncoder().encodeToString(c.doFinal(data.toString().getBytes(StandardCharsets.UTF_8))));
  }finally{Arrays.fill(password,'\0');}
 }
 public static JSONObject decrypt(JSONObject envelope,char[] password)throws Exception {
  try{if(!SCHEMA.equals(envelope.optString("schema"))||envelope.optInt("iterations")!=210000||envelope.optString("data").length()>28*1024*1024)throw new Exception("Formato de respaldo no válido.");
   byte[] salt=Base64.getDecoder().decode(envelope.getString("salt")),iv=Base64.getDecoder().decode(envelope.getString("iv"));if(salt.length!=16||iv.length!=12)throw new Exception("Formato no válido.");
   Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,key(password,salt),new GCMParameterSpec(128,iv));c.updateAAD(SCHEMA.getBytes(StandardCharsets.UTF_8));return new JSONObject(new String(c.doFinal(Base64.getDecoder().decode(envelope.getString("data"))),StandardCharsets.UTF_8));
  }catch(Exception e){throw new Exception("No se pudo abrir la copia. Comprueba su contraseña, integridad y versión.");}finally{Arrays.fill(password,'\0');}
 }
}
