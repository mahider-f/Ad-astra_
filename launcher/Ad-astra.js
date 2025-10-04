const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 20, attribution: 'USGS'
}).addTo(map)

const dSlider = document.getElementById("diameter");
const vSlider = document.getElementById("velocity");
const aSlider = document.getElementById("angle");
const typeSel = document.getElementById("type");
const dVal = document.getElementById("diamVal");
const vVal = document.getElementById("velVal");
const aVal = document.getElementById("angVal");

const locEl = document.getElementById("loc");
const eEl = document.getElementById("energy");
const cEl = document.getElementById("crater");
const tEl = document.getElementById("thermal");
const sEl = document.getElementById("shock");
const seiEl = document.getElementById("seismic");
const gEl = document.getElementById("global");

let impactMarker, craterCircle, thermalCircle, blastCircle, seismicCircle, globalCircle;

// Update slider labels
dSlider.oninput = ()=> dVal.textContent = dSlider.value;
vSlider.oninput = ()=> vVal.textContent = vSlider.value;
aSlider.oninput = ()=> aVal.textContent = aSlider.value;

// Sound & shake
function playExplosionSound() {
  const s = document.getElementById("explosionSound");
  s.currentTime = 0; s.play();
}
function screenShake() {
  document.body.classList.add('shake');
  setTimeout(()=>document.body.classList.remove('shake'),600);
}

// Fireball effect
function fireballVisual(latlng) {
  const point = map.latLngToContainerPoint(latlng);
  const fb = document.createElement("div");
  fb.className = "fireball";
  fb.style.left = (point.x-50)+"px";
  fb.style.top = (point.y-50)+"px";
  fb.style.width = "100px"; fb.style.height = "100px";
  document.body.appendChild(fb);
  setTimeout(()=>fb.remove(),1000);
}

// Physics model
function calcImpact(diameter, velocity, angle, type){
  const density = {rock:3000, iron:7800, ice:1000}[type];
  const r = diameter/2;
  const volume = (4/3)*Math.PI*r**3;
  const mass = volume*density;
  const v_ms = velocity*1000;
  const joules = 0.5*mass*v_ms**2 * Math.sin(angle*Math.PI/180);
  const mt = joules/4.184e15;

  return {
    energy: mt.toFixed(2),
    crater: (1.8*Math.pow(mt,0.25)*1000).toFixed(0),
    thermal: (0.25*Math.pow(joules/4.184e12,1/3)*1000).toFixed(0),
    shock: (0.35*Math.pow(joules/4.184e12,1/3)*1000).toFixed(0),
    seismic: (50*Math.pow(mt,0.17)).toFixed(0),
    global: (mt>1000 ? (mt/100).toFixed(0):0)
  };
}

function simulate(lat,lng){
  const d = +dSlider.value;
  const v = +vSlider.value;
  const a = +aSlider.value;
  const type = typeSel.value;

  const res = calcImpact(d,v,a,type);
  locEl.textContent = lat.toFixed(2)+", "+lng.toFixed(2);
  eEl.textContent = res.energy;
  cEl.textContent = res.crater;
  tEl.textContent = res.thermal;
  sEl.textContent = res.shock;
  seiEl.textContent = res.seismic;
  gEl.textContent = res.global;

  if(impactMarker) map.removeLayer(impactMarker);
  [craterCircle,thermalCircle,blastCircle,seismicCircle,globalCircle].forEach(c=>c && map.removeLayer(c));

  impactMarker = L.marker([lat,lng]).addTo(map);
  craterCircle = L.circle([lat,lng],{radius:res.crater/2,color:"red",fillColor:"#f87171",fillOpacity:0.4}).addTo(map);
  thermalCircle = L.circle([lat,lng],{radius:res.thermal,color:"orange",fillColor:"#fb923c",fillOpacity:0.3}).addTo(map);
  blastCircle = L.circle([lat,lng],{radius:res.shock,color:"yellow",fillColor:"#facc15",fillOpacity:0.25}).addTo(map);
  seismicCircle = L.circle([lat,lng],{radius:res.seismic,color:"blue",fillColor:"#3b82f6",fillOpacity:0.2}).addTo(map);
  if(res.global>0) globalCircle = L.circle([lat,lng],{radius:res.global*1000,color:"purple",fillColor:"#a855f7",fillOpacity:0.15}).addTo(map);

  playExplosionSound();
  screenShake();
  fireballVisual({lat,lng});
}

// Map click
map.on("click",e=>simulate(e.latlng.lat,e.latlng.lng));

// Reset
document.getElementById("resetBtn").onclick = ()=>{
  if(impactMarker) map.removeLayer(impactMarker);
  [craterCircle,thermalCircle,blastCircle,seismicCircle,globalCircle].forEach(c=>c && map.removeLayer(c));
  locEl.textContent="-- , --"; eEl.textContent=cEl.textContent=tEl.textContent=sEl.textContent=seiEl.textContent=gEl.textContent="--";
};

// Random
document.getElementById("randomBtn").onclick = ()=>{
  const lat=(Math.random()*180)-90;
  const lng=(Math.random()*360)-180;
  dSlider.value=Math.floor(Math.random()*(5000-50)+50);
  vSlider.value=(Math.random()*(70-11)+11).toFixed(1);
  aSlider.value=Math.floor(Math.random()*(90-10)+10);
  const types=["rock","iron","ice"];
  typeSel.value=types[Math.floor(Math.random()*types.length)];
  dVal.textContent=dSlider.value; vVal.textContent=vSlider.value; aVal.textContent=aSlider.value;
  simulate(lat,lng);
  map.setView([lat,lng],4);
};
