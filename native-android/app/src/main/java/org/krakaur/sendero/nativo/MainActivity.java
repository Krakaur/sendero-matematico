package org.krakaur.sendero.nativo;

import android.annotation.SuppressLint;
import android.app.*;
import android.content.*;
import android.content.res.ColorStateList;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.*;
import android.text.InputType;
import android.view.*;
import android.widget.*;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

/** Android framework UI: no browser, WebView, HTML, or JavaScript runtime. */
public class MainActivity extends Activity {
    static final int CREAM=0xfffaf8ef,GREEN=0xff285b40,INK=0xff25382e,GOLD=0xffffe5a1,BLUE=0xff2d6380;
    static final int ANSWER_BASE=1100,NEXT=1200,SOLUTION=1201;
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private Store store; private JSONObject profile; private String route="home";
    private LinearLayout root,content;private boolean busy,pickerOpen,stopped;private long activeAt;private int accessEpoch;
    private static final int EXPORT=41,IMPORT=42;
    interface Work<T>{T run()throws Exception;} interface Result<T>{void accept(T value)throws Exception;}
    private <T> void work(Work<T> task,Result<T> done){
        if(busy)return;busy=true;int epoch=accessEpoch;if(root!=null)setEnabled(root,false);
        io.execute(()->{try{T value=task.run();runOnUiThread(()->{busy=false;if(isDestroyed())return;if(epoch!=accessEpoch){profile=null;if(!stopped)loginScreen();return;}if(root!=null)setEnabled(root,true);try{done.accept(value);}catch(Exception e){error(e);}});}catch(Exception e){runOnUiThread(()->{busy=false;if(!isDestroyed()&&!stopped){if(root!=null)setEnabled(root,true);if(epoch!=accessEpoch)loginScreen();error(e);}});}});
    }
    private void error(Exception e){new AlertDialog.Builder(this).setTitle("No se completó la acción").setMessage(e.getMessage()==null?"Inténtalo de nuevo. No borres los datos de la aplicación.":e.getMessage()).setPositiveButton("Entendido",null).show();}
    private void setEnabled(View v,boolean value){v.setEnabled(value);if(v instanceof android.view.ViewGroup){android.view.ViewGroup g=(android.view.ViewGroup)v;for(int i=0;i<g.getChildCount();i++)setEnabled(g.getChildAt(i),value);}}
    @Override public void onCreate(Bundle state){super.onCreate(state);store=new Store(this);getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        if(state!=null){route=state.getString("route","home");pickerOpen=state.getBoolean("picker",false);}
        if(Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,()->back());
        Object retained=getLastNonConfigurationInstance();if(retained instanceof String)work(()->store.profile((String)retained),p->{profile=p;render();});else loginScreen();
    }
    @Override public Object onRetainNonConfigurationInstance(){return profile==null?null:profile.optString("id");}
    @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);state.putString("route",route);state.putBoolean("picker",pickerOpen);}
    @Override protected void onResume(){super.onResume();activeAt=SystemClock.elapsedRealtime();}
    @Override protected void onStart(){super.onStart();if(stopped){stopped=false;if(profile==null)loginScreen();}}
    @Override protected void onPause(){super.onPause();saveTime();activeAt=0;}
    @Override protected void onStop(){super.onStop();stopped=true;if(!isChangingConfigurations()&&!pickerOpen){accessEpoch++;profile=null;route="home";}}
    @Override protected void onDestroy(){super.onDestroy();io.execute(()->store.close());io.shutdown();}
    // Legacy Android requires this override; Android 13+ uses the callback registered above.
    @SuppressLint("GestureBackNavigation") @Override public void onBackPressed(){back();}
    private void back(){if(busy)return;if(profile!=null&&!route.equals("home")){saveTime();route="home";render();}else if(profile!=null)logout();else finish();}
    private void logout(){if(busy)return;saveTime();profile=null;route="home";loginScreen();}
    private void saveTime(){
        if(profile==null||busy||!route.equals("play")||profile.optJSONObject("current")==null)return;
        JSONObject snapshot=Engine.copy(profile);addTime(snapshot);profile=snapshot;io.execute(()->{try{store.save(snapshot,null);}catch(Exception e){runOnUiThread(()->{if(!isDestroyed())error(e);});}});
    }
    private void addTime(JSONObject p){JSONObject s=p.optJSONObject("current");if(s==null)return;JSONObject q=Engine.currentQuestion(s);if(!q.optBoolean("done")&&activeAt>0){try{q.put("activeMs",Math.min(86400000,q.optLong("activeMs")+Math.min(60000,Math.max(0,SystemClock.elapsedRealtime()-activeAt))));}catch(JSONException e){throw new IllegalStateException(e);}}activeAt=SystemClock.elapsedRealtime();}
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    private GradientDrawable bg(int color){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(18));return d;}
    private void shell(String subtitle){
        root=new LinearLayout(this);root.setOrientation(1);root.setBackgroundColor(CREAM);root.setPadding(dp(16),dp(8),dp(16),dp(8));setContentView(root);
        root.setOnApplyWindowInsetsListener((v,insets)->{if(Build.VERSION.SDK_INT>=30){Insets i=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());v.setPadding(dp(16)+i.left,dp(8)+i.top,dp(16)+i.right,dp(8)+i.bottom);}else{v.setPadding(dp(16)+insets.getSystemWindowInsetLeft(),dp(8)+insets.getSystemWindowInsetTop(),dp(16)+insets.getSystemWindowInsetRight(),dp(8)+insets.getSystemWindowInsetBottom());}return insets;});root.requestApplyInsets();
        TextView brand=text("SENDERO  /  Matemáticas",17,true);root.addView(brand);root.addView(text(subtitle,14,false));
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(false);root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        content=new LinearLayout(this);content.setOrientation(1);content.setPadding(0,dp(16),0,dp(20));scroll.addView(content);
        if(profile!=null){LinearLayout nav=new LinearLayout(this);root.addView(nav);nav.addView(button("Inicio",()->navigate("home")),new LinearLayout.LayoutParams(0,-2,1));nav.addView(button("Avances",()->navigate("progress")),new LinearLayout.LayoutParams(0,-2,1));nav.addView(button("Salir",this::logout),new LinearLayout.LayoutParams(0,-2,1));}
    }
    private TextView text(String s,int size,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextColor(INK);t.setTextSize(size);t.setPadding(dp(4),dp(6),dp(4),dp(6));if(bold)t.setTypeface(null,Typeface.BOLD);return t;}
    private Button button(String label,Runnable action){Button b=new Button(this);b.setText(label);b.setTextSize(16);b.setAllCaps(false);b.setTextColor(GREEN);b.setMinHeight(dp(52));b.setPadding(dp(8),dp(8),dp(8),dp(8));b.setOnClickListener(v->{if(!busy)action.run();});return b;}
    private void addButton(String label,Runnable action){content.addView(button(label,action),new LinearLayout.LayoutParams(-1,-2));}
    private void heading(String label){content.addView(text(label,28,true));}
    private void note(String label){content.addView(text(label,16,false));}
    private void navigate(String to){saveTime();route=to;render();}
    private void loginScreen(){if(isDestroyed())return;shell("Tus caminos se guardan en este teléfono");heading("Cada explorador, su camino");content.addView(new Landscape(this),new LinearLayout.LayoutParams(-1,dp(140)));note("Elige tu alias para entrar. Usa un apodo, sin nombre completo ni correo.");
        if(busy)return;work(()->store.profiles(),rows->{if(profile!=null)return;for(int i=0;i<rows.length();i++){JSONObject p=rows.getJSONObject(i);addButton(p.getString("alias"),()->loginDialog(p));}addButton("Crear perfil",this::createDialog);note("Hasta 8 perfiles. Si olvidas la contraseña, no hay recuperación por correo. Conserva una copia con una persona adulta de confianza.");});
    }
    private EditText input(String hint,boolean password){EditText e=new EditText(this);e.setHint(hint);e.setTextColor(INK);e.setSingleLine(true);e.setMinHeight(dp(52));e.setInputType(password?InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD:InputType.TYPE_CLASS_TEXT);e.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(password?128:24)});return e;}
    private LinearLayout form(){LinearLayout f=new LinearLayout(this);f.setOrientation(1);f.setPadding(dp(20),dp(8),dp(20),dp(8));return f;}
    private void loginDialog(JSONObject p){EditText pass=input("Contraseña",true);LinearLayout f=form();f.addView(pass);new AlertDialog.Builder(this).setTitle(p.optString("alias")).setView(f).setNegativeButton("Cancelar",null).setPositiveButton("Entrar",(d,w)->{char[] password=pass.getText().toString().toCharArray();pass.setText("");work(()->store.login(p.optString("id"),password),value->{profile=value;route="home";render();});}).show();}
    private void createDialog(){LinearLayout f=form();EditText alias=input("Alias (por ejemplo: Colibrí)",false),pass=input("Contraseña (mínimo 6 caracteres)",true),confirm=input("Repite la contraseña",true);f.addView(alias);f.addView(pass);f.addView(confirm);
        new AlertDialog.Builder(this).setTitle("Nuevo perfil local").setView(f).setNegativeButton("Cancelar",null).setPositiveButton("Crear",(d,w)->{if(!pass.getText().toString().equals(confirm.getText().toString())){error(new Exception("Las contraseñas no coinciden."));return;}char[] password=pass.getText().toString().toCharArray();String name=alias.getText().toString();pass.setText("");confirm.setText("");work(()->store.create(name,password),p->{profile=p;route="home";render();});}).show();
    }
    private void passwordDialog(){LinearLayout f=form();EditText old=input("Contraseña actual",true),next=input("Nueva contraseña",true),confirm=input("Repite la nueva contraseña",true);f.addView(old);f.addView(next);f.addView(confirm);new AlertDialog.Builder(this).setTitle("Cambiar contraseña").setView(f).setNegativeButton("Cancelar",null).setPositiveButton("Guardar",(d,w)->{if(!next.getText().toString().equals(confirm.getText().toString())){error(new Exception("Las contraseñas no coinciden."));return;}String id=profile.optString("id");char[] a=old.getText().toString().toCharArray(),b=next.getText().toString().toCharArray();old.setText("");next.setText("");confirm.setText("");work(()->{store.changePassword(id,a,b);return true;},v->Toast.makeText(this,"Contraseña actualizada",Toast.LENGTH_LONG).show());}).show();}
    private void render(){if(profile==null){loginScreen();return;}shell(profile.optString("alias")+" · Sin conexión · v"+Engine.VERSION);switch(route){case "play":play();break;case "progress":progress();break;case "teacher":teacher();break;default:home();}}
    private void home(){heading("Un pequeño reto.\nUn nuevo descubrimiento.");content.addView(new Landscape(this),new LinearLayout.LayoutParams(-1,dp(160)));note("Explora a tu ritmo. Cada camino tiene 8 retos; la dificultad se ajusta a tus respuestas.");
        if(profile.optJSONObject("current")!=null)addButton("Continuar mi camino",()->navigate("play"));
        for(String trail:Engine.TRAILS)addButton(Engine.symbol(trail)+"  "+Engine.title(trail),()->{if(profile.optJSONObject("current")!=null){new AlertDialog.Builder(this).setTitle("Tienes un camino en marcha").setMessage("Termínalo antes de comenzar otro. Tu progreso está guardado.").setPositiveButton("Continuar",(d,w)->navigate("play")).setNegativeButton("Después",null).show();return;}mutate(p->{JSONObject a=p.getJSONObject("adaptive").optJSONObject(trail);p.put("current",Engine.session(trail,a==null?1:a.optInt("level",1),p.getString("id")));return null;},"play");});
        addButton("Informes y acompañamiento",()->navigate("teacher"));addButton("Cambiar mi contraseña",this::passwordDialog);note("La práctica orienta el acompañamiento; no sustituye una evaluación escolar ni mide por sí sola el aprendizaje.");
    }
    interface Mutation{JSONObject apply(JSONObject p)throws Exception;}
    private void mutate(Mutation action,String next){if(profile==null||busy)return;JSONObject p=Engine.copy(profile);addTime(p);work(()->{JSONObject completed=action.apply(p);store.save(p,completed);return p;},saved->{if(profile==null)return;profile=saved;route=next;render();});}
    private void play(){JSONObject s=profile.optJSONObject("current");if(s==null){route="progress";progress();return;}JSONObject q=Engine.currentQuestion(s);heading(Engine.title(s.optString("trail")));note("Reto "+(s.optInt("index")+1)+" de 8 · "+Engine.level(q.optInt("level")));bar(s.optInt("index"),8,GREEN);String equation=q.optInt("a")+" "+Engine.symbol(s.optString("trail"))+" "+q.optInt("b");TextView problem=text(equation+" = ?",38,true);problem.setGravity(Gravity.CENTER);content.addView(problem);
        if(q.optBoolean("solutionShown")||q.optBoolean("done")){TextView solution=text("¡"+equation+" = "+q.optInt("answer")+"!",32,true);solution.setId(SOLUTION);solution.setGravity(Gravity.CENTER);solution.setBackground(bg(GOLD));solution.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE);content.addView(solution);note(q.optBoolean("done")?"¡Lo encontraste! Puedes continuar cuando quieras.":"Mira la solución y elige la respuesta para practicarla.");}
        JSONArray options=q.optJSONArray("options");for(int row=0;row<2;row++){LinearLayout line=new LinearLayout(this);content.addView(line);for(int col=0;col<2;col++){int index=row*2+col,value=options.optInt(index);Button b=button(String.valueOf(value),()->mutate(p->{Engine.answer(Engine.currentQuestion(p.getJSONObject("current")),value);return null;},"play"));b.setId(ANSWER_BASE+index);b.setTextSize(26);b.setMinHeight(dp(68));boolean used=false;for(int k=0;k<q.optJSONArray("attempts").length();k++)if(q.optJSONArray("attempts").optInt(k)==value)used=true;b.setEnabled(!q.optBoolean("done")&&!used);line.addView(b,new LinearLayout.LayoutParams(0,-2,1));}}
        if(q.optBoolean("hint"))note(hint(s.optString("trail"),q));
        if(!q.optBoolean("done")&&!q.optBoolean("hint"))addButton("Una pista",()->mutate(p->{Engine.currentQuestion(p.getJSONObject("current")).put("hint",true);return null;},"play"));
        if(q.optBoolean("done")){Button next=button(s.optInt("index")==7?"Ver mis avances":"Siguiente reto",()->mutate(Engine::advance,s.optInt("index")==7?"progress":"play"));next.setId(NEXT);content.addView(next);}activeAt=SystemClock.elapsedRealtime();
    }
    private String hint(String trail,JSONObject q){int a=q.optInt("a"),b=q.optInt("b");if(trail.equals("suma"))return "Empieza en "+a+" y cuenta "+b+" pasos hacia adelante.";if(trail.equals("resta"))return "Empieza en "+a+" y retrocede "+b+" pasos.";return "Imagina "+a+" grupos. En cada grupo hay "+b+" semillas. Suma los grupos.";}
    private void bar(int numerator,int denominator,int color){ProgressBar b=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);b.setMax(Math.max(1,denominator));b.setProgress(numerator);b.setProgressTintList(ColorStateList.valueOf(color));b.setProgressBackgroundTintList(ColorStateList.valueOf(0xffdcded2));b.setContentDescription(numerator+" de "+denominator);content.addView(b,new LinearLayout.LayoutParams(-1,dp(14)));}
    private void dimension(String label,int value,int total,boolean support){int percent=total==0?0:Math.round(100f*value/total);note(label+": "+(total==0?"sin observaciones":value+" de "+total+" · "+percent+" %"));bar(value,total,support?BLUE:percent>=80?GREEN:percent>=50?0xffa66d0a:0xffa24c40);}
    private void metrics(JSONArray sessions,String trail,int level){int[] m=Engine.metrics(sessions,trail,level);dimension("Acierto en el primer intento",m[1],m[0],false);dimension("Resolución sin pista ni error",m[2],m[0],false);dimension("Uso de pistas",m[3],m[0],true);dimension("Respuesta correcta tras un error",m[5],m[4],true);note("Tiempo de interacción aproximado: "+(m[6]/1000)+" s. No equivale a asistencia ni tiempo total de estudio.");}
    private void progress(){heading("Así va tu camino");String id=profile.optString("id");work(()->store.sessions(id,false),sessions->{if(profile==null||!route.equals("progress"))return;note(sessions.length()+" caminos terminados. Los retos en curso aparecerán cuando termines el camino.");metrics(sessions,"",0);for(String t:Engine.TRAILS){content.addView(text(Engine.title(t),22,true));for(int level=1;level<=4;level++){int[] m=Engine.metrics(sessions,t,level);dimension("Nivel "+level+" · primer intento",m[1],m[0],false);}}note("Verde: 80–100 %; ocre: 50–79 %; terracota: menos de 50 %. Azul: descripción de ayudas y correcciones. Los colores no son calificaciones ni diagnósticos. Comparar distintos niveles requiere cautela.");});}
    private void teacher(){heading("Compartir para acompañar");note("Los informes incluyen un identificador de perfil, respuestas y fechas. No incluyen alias ni contraseñas; son seudónimos, no anónimos. Entrégalos únicamente a la persona responsable.");addButton("Exportar informe JSON",()->export(false));addButton("Exportar tabla CSV",()->export(true));addButton("Recibir informe JSON",this::importReport);addButton("Ver informes recibidos",this::received);note("El envío es manual mediante el selector de archivos de Android. No hay servidor, envío automático ni recopilación para investigación. Importar conserva los informes separados y no modifica tu práctica.");note("Cada perfil ve sus propios informes recibidos. Esta edición no administra una escuela ni verifica la identidad de un docente.");}
    private void received(){String id=profile.optString("id");work(()->store.sessions(id,true),sessions->{if(profile==null)return;shell(profile.optString("alias")+" · Informes recibidos");heading("Registros para acompañar");Map<String,JSONArray> groups=new LinkedHashMap<>();for(int i=0;i<sessions.length();i++){JSONObject s=sessions.getJSONObject(i);String key=s.getString("profile");if(!groups.containsKey(key))groups.put(key,new JSONArray());groups.get(key).put(s);}if(groups.isEmpty())note("Todavía no hay informes recibidos.");for(Map.Entry<String,JSONArray> group:groups.entrySet()){note("Perfil: "+group.getKey());metrics(group.getValue(),"",0);}addButton("Volver",()->navigate("teacher"));});}
    private File pending(){return new File(getCacheDir(),"pending-export.txt");}
    private void export(boolean csv){String id=profile.optString("id");work(()->{JSONArray sessions=store.sessions(id,false);String data=csv?Engine.csv(sessions):Engine.report(id,sessions).toString(2);try(FileOutputStream out=new FileOutputStream(pending())){out.write(data.getBytes(StandardCharsets.UTF_8));}return true;},v->{Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType(csv?"text/csv":"application/json");intent.putExtra(Intent.EXTRA_TITLE,"Sendero-"+id.substring(0,8)+(csv?".csv":".json"));pickerOpen=true;try{startActivityForResult(intent,EXPORT);}catch(ActivityNotFoundException e){pickerOpen=false;error(new Exception("Este dispositivo no tiene selector de archivos habilitado."));}});}
    private void importReport(){Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);intent.addCategory(Intent.CATEGORY_OPENABLE);intent.setType("*/*");pickerOpen=true;try{startActivityForResult(intent,IMPORT);}catch(ActivityNotFoundException e){pickerOpen=false;error(new Exception("Este dispositivo no tiene selector de archivos habilitado."));}}
    @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);pickerOpen=false;if(result!=RESULT_OK||data==null||data.getData()==null){pending().delete();return;}Uri uri=data.getData();if(request==EXPORT){work(()->{try(InputStream in=new FileInputStream(pending());OutputStream out=getContentResolver().openOutputStream(uri,"wt")){if(out==null)throw new IOException("No se pudo abrir el archivo.");byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1)out.write(buffer,0,n);}pending().delete();return true;},v->Toast.makeText(this,"Informe guardado",Toast.LENGTH_LONG).show());}else if(request==IMPORT){if(profile==null){error(new Exception("Vuelve a entrar en tu perfil y selecciona el informe."));return;}String id=profile.optString("id");work(()->{try(InputStream in=getContentResolver().openInputStream(uri);ByteArrayOutputStream out=new ByteArrayOutputStream()){if(in==null)throw new IOException("No se pudo abrir el archivo.");byte[] buffer=new byte[8192];int n,total=0;while((n=in.read(buffer))!=-1){total+=n;if(total>10*1024*1024)throw new IOException("El informe supera el límite de 10 MB.");out.write(buffer,0,n);}return store.receive(id,new JSONObject(new String(out.toByteArray(),StandardCharsets.UTF_8)));}},count->new AlertDialog.Builder(this).setTitle("Informe recibido").setMessage(count+" sesiones nuevas. Los duplicados idénticos no se cuentan dos veces.").setPositiveButton("Entendido",null).show());}}
    private static class Landscape extends View {
        final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);Landscape(Context c){super(c);setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);}
        void color(int value){paint.setColor(value);}
        @Override protected void onDraw(Canvas canvas){super.onDraw(canvas);float w=getWidth(),h=getHeight();color(0xffe7eddd);canvas.drawRoundRect(0,0,w,h,28,28,paint);color(0xfff4c65b);canvas.drawCircle(w*.78f,h*.25f,h*.13f,paint);Path p=new Path();p.moveTo(0,h);p.lineTo(w*.27f,h*.15f);p.lineTo(w*.6f,h);p.close();color(0xff9bbba1);canvas.drawPath(p,paint);p.reset();p.moveTo(w*.35f,h);p.lineTo(w*.69f,h*.28f);p.lineTo(w,h);p.close();color(0xff5e896e);canvas.drawPath(p,paint);color(0xffffe5a1);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(h*.1f);p.reset();p.moveTo(w*.45f,h);p.cubicTo(w*.7f,h*.7f,w*.42f,h*.65f,w*.58f,h*.48f);canvas.drawPath(p,paint);paint.setStyle(Paint.Style.FILL);color(0xffbf6c3b);canvas.drawCircle(w*.21f,h*.7f,h*.11f,paint);p.reset();p.moveTo(w*.21f-h*.09f,h*.64f);p.lineTo(w*.21f-h*.09f,h*.49f);p.lineTo(w*.21f,h*.61f);p.lineTo(w*.21f+h*.09f,h*.49f);p.lineTo(w*.21f+h*.09f,h*.64f);p.close();canvas.drawPath(p,paint);color(CREAM);canvas.drawCircle(w*.21f,h*.75f,h*.055f,paint);color(INK);canvas.drawCircle(w*.21f-h*.035f,h*.67f,h*.012f,paint);canvas.drawCircle(w*.21f+h*.035f,h*.67f,h*.012f,paint);}
    }
}
