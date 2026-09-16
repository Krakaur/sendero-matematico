package org.krakaur.sendero.nativo;
import android.content.Context;
import android.graphics.*;
import android.view.View;
import org.json.*;
import java.util.Locale;
import java.util.function.LongSupplier;
/** Small Canvas scene: no browser, sprite downloads, or continuous background work. */
public final class RaceView extends View {
 private final Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);private final JSONObject session;private final LongSupplier clock;private final boolean animate;
 private final int[] colors={0xffffbd32,0xffab8dff,0xffff7797,0xff5ee6b2};
 public RaceView(Context c,JSONObject s,LongSupplier clock,boolean animate){super(c);session=s;this.clock=clock;this.animate=animate;setContentDescription("Carrera con Nube, Rayo y Chispa. Son rivales virtuales; tu avance es "+Race.done(s)+" de ocho retos.");}
 @Override protected void onDraw(Canvas canvas){super.onDraw(canvas);float w=getWidth(),h=getHeight(),scale=w/360f;long ms=clock.getAsLong();canvas.save();canvas.scale(scale,h/205f);p.setColor(0xff124675);canvas.drawRoundRect(0,0,360,205,14,14,p);p.setTypeface(Typeface.DEFAULT_BOLD);p.setTextSize(13);p.setColor(Color.WHITE);canvas.drawText("REGATA RELÁMPAGO",12,20,p);canvas.drawText("META",304,20,p);
  for(int i=0;i<4;i++){float y=27+i*36;p.setColor(i%2==0?0xff259bcc:0xff2aa5d6);canvas.drawRect(8,y,352,y+35,p);p.setColor(0xff124675);canvas.drawRoundRect(10,y+7,79,y+29,5,5,p);p.setColor(Color.WHITE);p.setTextSize(11);canvas.drawText(new String[]{"Tú","Nube","Rayo","Chispa"}[i],16,y+22,p);double progress=i==0?Race.done(session)/8.0:Math.min(1,ms/session.optJSONObject("race").optJSONArray("finishMs").optDouble(i-1));float x=91+(float)progress*216;p.setColor(colors[i]);canvas.drawOval(x-13,y+22,x+18,y+31,p);canvas.drawCircle(x+2,y+13,10,p);p.setColor(Color.WHITE);canvas.drawCircle(x-2,y+12,3,p);canvas.drawCircle(x+7,y+12,3,p);p.setColor(0xff102d52);canvas.drawCircle(x-2,y+12,1.5f,p);canvas.drawCircle(x+7,y+12,1.5f,p);p.setColor(Color.WHITE);canvas.drawRect(335,y+3,338,y+32,p);for(int k=0;k<3;k++){p.setColor(k%2==0?Color.WHITE:0xff124675);canvas.drawRect(338,y+3+k*5,348,y+8+k*5,p);}}
  p.setColor(0xffffe182);p.setTextSize(12);canvas.drawText(String.format(Locale.getDefault(),"%d / 4   ·   %.1f s   ·   %d puntos",Race.rank(session,ms),ms/1000.0,Race.points(session)),12,186,p);p.setColor(Color.WHITE);p.setTextSize(10);canvas.drawText("Tres rivales simulados en este dispositivo",12,200,p);canvas.restore();if(animate&&isShown())postInvalidateDelayed(120);
 }
}
