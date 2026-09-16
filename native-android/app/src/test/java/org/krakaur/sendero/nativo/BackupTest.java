package org.krakaur.sendero.nativo;
import org.junit.Test;import org.json.*;import static org.junit.Assert.*;
public class BackupTest {
 @Test public void restoresAndRejectsWrongPassword()throws Exception {
  JSONObject data=Engine.object("profile",Engine.profile("Colibrí"),"sessions",new JSONArray());
  JSONObject protectedCopy=BackupCrypto.encrypt(data,"respaldo-seguro".toCharArray());
  assertFalse(protectedCopy.toString().contains("Colibrí"));assertEquals(data.toString(),BackupCrypto.decrypt(protectedCopy,"respaldo-seguro".toCharArray()).toString());
  try{BackupCrypto.decrypt(protectedCopy,"clave-incorrecta".toCharArray());fail();}catch(Exception expected){}
  String cipher=protectedCopy.getString("data");protectedCopy.put("data",(cipher.startsWith("A")?"B":"A")+cipher.substring(1));
  try{BackupCrypto.decrypt(protectedCopy,"respaldo-seguro".toCharArray());fail();}catch(Exception expected){}
 }
}
