/* ============ EDIT THESE ============ */
const NAME    = "Angeline";
const FROM    = "ky";
const MESSAGE = "Happy birthday po! 🎂\n\nTumatanda ka na… Auntie na ba ang itatawag ko sa ’yo siren? 😄\n\nPero seryoso, proud ako sa ’yo. Keep doing your best, and keep dreaming until every one of your dreams comes true. You deserve all of it.\n\nEnjoy your day, and God bless you always! 🙏";
const CANDLES = 25;          // how many candles on the cake
const SENSITIVITY = 0.16;   // lower = easier to blow out with the mic
/* ==================================== */

const $ = id => document.getElementById(id);
let ac, blown = false, songTimer, master, stream, raf, blowTime = 0;

$("gateTitle").textContent = `A surprise for ${NAME}`;
$("title").textContent = `Happy birthday, ${NAME}!`;
$("msgTitle").textContent = `Dear ${NAME},`;
$("msgText").textContent = MESSAGE;
$("msgFrom").textContent = FROM;

/* candles */
const candlesEl = $("candles");
function buildCandles(){
  candlesEl.innerHTML = "";
  const many = CANDLES > 8;
  candlesEl.classList.toggle("many", many);
  // many candles are split into three staggered rows (back row first)
  const base = Math.floor(CANDLES/3), rem = CANDLES % 3;
  const rows = many ? [base+(rem>0?1:0), base+(rem>1?1:0), base] : [CANDLES];
  rows.forEach((n,r)=>{
    for(let k=0;k<n;k++){
      const c = document.createElement("div"); c.className = "candle";
      c.innerHTML = '<div class="flame"><i></i></div><span class="smoke"></span>';
      if(many){ c.style.left=((k+.5)/n*100)+"%"; c.style.bottom=(22-r*11)+"px"; c.style.transform="translateX(-50%)"; }
      candlesEl.appendChild(c);
    }
  });
}
buildCandles();
// sprinkles
["#ff5f8f","#7fe0c3","#ffb347","#fff"].forEach((col,k)=>{
  for(let i=0;i<6;i++){
    const s=document.createElement("span"); s.className="sprinkle"; s.style.background=col;
    s.style.left=(8+((i*16+k*7)%84))+"%"; s.style.top=(32+((i*13+k*9)%40))+"px";
    s.style.transform=`rotate(${(i*47+k*30)%180}deg)`;
    document.querySelector(".l1").appendChild(s);
  }
});


const N={G4:392,A4:440,B4:494,C5:523,D5:587,E5:659,F5:698,G5:784};
const SONG=[["G4",.75],["G4",.25],["A4",1],["G4",1],["C5",1],["B4",2],
            ["G4",.75],["G4",.25],["A4",1],["G4",1],["D5",1],["C5",2],
            ["G4",.75],["G4",.25],["G5",1],["E5",1],["C5",1],["B4",1],["A4",2],
            ["F5",.75],["F5",.25],["E5",1],["C5",1],["D5",1],["C5",2]];
const BEAT=.46;
function playSong(){
  if(blown||!ac) return;
  let t=ac.currentTime+.05;
  SONG.forEach(([n,b])=>{
    const dur=b*BEAT;
    [[1,.5],[2,.12]].forEach(([mult,vol])=>{
      const o=ac.createOscillator(), g=ac.createGain();
      o.type="triangle"; o.frequency.value=N[n]*mult;
      g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol,t+.03);
      g.gain.exponentialRampToValueAtTime(.001,t+dur*.95);
      o.connect(g); g.connect(master); o.start(t); o.stop(t+dur);
    });
    t+=dur;
  });
  songTimer=setTimeout(playSong,(t-ac.currentTime+1.2)*1000);
}

/* ---- open the surprise ---- */
$("openBtn").addEventListener("click",()=>{
  ac=new (window.AudioContext||window.webkitAudioContext)();
  master=ac.createGain(); master.gain.value=.22; master.connect(ac.destination);
  $("gate").classList.add("hidden"); $("stage").classList.remove("hidden");
  document.body.classList.add("lit");
  playSong(); burst(60);
});

/* ---- blow out ---- */
function extinguish(){
  if(blown) return; blown=true;
  clearTimeout(songTimer); cancelAnimationFrame(raf);
  if(stream) stream.getTracks().forEach(t=>t.stop());
  master.gain.setTargetAtTime(0,ac.currentTime,.25);
  $("cake").classList.add("out"); document.body.classList.remove("lit");
  $("controls").classList.add("hidden"); $("meterWrap").classList.add("hidden");
  $("hint").textContent = "Your wish is on its way.";
  setTimeout(()=>{
    // short celebratory chime
    [523,659,784,1047].forEach((f,i)=>{
      const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+.05+i*.13;
      master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(.22,ac.currentTime);
      o.type="triangle";o.frequency.value=f;g.gain.setValueAtTime(.4,t);g.gain.exponentialRampToValueAtTime(.001,t+.7);
      o.connect(g);g.connect(master);o.start(t);o.stop(t+.75);
    });
    $("msg").classList.add("show"); $("again").classList.remove("hidden");
    $("hint").textContent=""; burst(220);
    $("msg").scrollIntoView({behavior:"smooth",block:"center"});
  },1400);
}
$("blowBtn").addEventListener("click",extinguish);

$("replayBtn").addEventListener("click",()=>{
  blown=false; blowTime=0;
  $("cake").classList.remove("out"); document.body.classList.add("lit");
  $("msg").classList.remove("show"); $("again").classList.add("hidden");
  $("controls").classList.remove("hidden"); $("meterWrap").classList.remove("hidden");
  $("hint").textContent="Make a wish, then blow out the candles.";
  buildCandles(); master.gain.cancelScheduledValues(ac.currentTime); master.gain.setValueAtTime(.22,ac.currentTime);
  playSong();
});

/* ---- microphone ---- */
$("micBtn").addEventListener("click",async()=>{
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:false,autoGainControl:false}});
  }catch(e){
    $("hint").textContent="The microphone isn’t available here. Use the button instead.";
    return;
  }
  $("micBtn").classList.add("hidden");
  $("hint").textContent="Take a deep breath and blow toward your mic…";
  $("meterWrap").style.visibility="visible";
  const an=ac.createAnalyser(); an.fftSize=1024;
  ac.createMediaStreamSource(stream).connect(an);
  const buf=new Float32Array(an.fftSize); let last=performance.now();
  (function loop(now){
    if(blown) return;
    an.getFloatTimeDomainData(buf);
    let s=0; for(const v of buf) s+=v*v;
    const level=Math.min(1,Math.sqrt(s/buf.length)*4);
    const dt=(now-last)/1000; last=now;
    blowTime = level>SENSITIVITY*2 ? blowTime+dt : Math.max(0,blowTime-dt*2);
    $("meter").style.width=(level*100)+"%";
    document.querySelectorAll(".flame").forEach((f,i)=>{
      f.style.setProperty("--r",(level*28*(i%2?1:-1))+"deg");
      f.style.setProperty("--s",Math.max(.55,1-level*.5));
    });
    if(blowTime>.45) return extinguish();
    raf=requestAnimationFrame(loop);
  })(last);
});
$("meterWrap").style.visibility="hidden";

/* ---- confetti ---- */
const cv=$("fx"),cx=cv.getContext("2d"); let parts=[],run=false;
function fit(){cv.width=innerWidth*devicePixelRatio;cv.height=innerHeight*devicePixelRatio}
addEventListener("resize",fit); fit();
function burst(n){
  const cols=["#ff8fb1","#7fe0c3","#ffb347","#fff1dc","#b79bff"];
  for(let i=0;i<n;i++) parts.push({x:Math.random()*cv.width,y:-20*devicePixelRatio,
    vx:(Math.random()-.5)*4,vy:(2+Math.random()*4)*devicePixelRatio,w:(6+Math.random()*6)*devicePixelRatio,
    h:(10+Math.random()*8)*devicePixelRatio,r:Math.random()*6,vr:(Math.random()-.5)*.3,c:cols[i%cols.length]});
  if(!run){run=true;requestAnimationFrame(tick)}
}
function tick(){
  cx.clearRect(0,0,cv.width,cv.height);
  parts=parts.filter(p=>p.y<cv.height+40);
  for(const p of parts){
    p.x+=p.vx*devicePixelRatio;p.y+=p.vy;p.r+=p.vr;p.vy+=.03*devicePixelRatio;
    cx.save();cx.translate(p.x,p.y);cx.rotate(p.r);cx.fillStyle=p.c;cx.fillRect(-p.w/2,-p.h/2,p.w,p.h);cx.restore();
  }
  if(parts.length) requestAnimationFrame(tick); else run=false;
}
