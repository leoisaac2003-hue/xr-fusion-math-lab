import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const PI = Math.PI, $ = s => document.querySelector(s), clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const f2 = v => v.toFixed(2);

/* ---------- Datos matemáticos de los 3 casos ---------- */
const CASES = [
 { key: "cil", fig: "Círculo", solid: "Cilindro", type: "Extrusión",
   eq: "Círculo: x² + z² ≤ r²  →  Cilindro: x² + z² ≤ r², 0 ≤ y ≤ h",
   formulas: "V = π·r²·h\nA = 2π·r·(r + h)",
   vol: (r, h) => PI * r * r * h, area: (r, h) => 2 * PI * r * (r + h),
   rows: (r, h) => [["Área de una base π·r²", PI * r * r], ["Área lateral 2π·r·h", 2 * PI * r * h]],
   text: "Al desplazar el círculo perpendicularmente a su plano una distancia h, cada punto traza un segmento y aparece el cilindro. También se obtiene al girar un rectángulo de base r y altura h alrededor de uno de sus lados (revolución).",
   steps: ["Dibuja el círculo de radio r en el plano base.", "Elige la altura h, perpendicular al plano.", "Desplaza el círculo a lo largo de h: es la extrusión.", "Resultado: dos bases circulares y una cara lateral rectangular enrollada."] },
 { key: "con", fig: "Triángulo rectángulo", solid: "Cono", type: "Revolución",
   eq: "Triángulo: y = h·(1 − x/r), 0 ≤ x ≤ r  ·  eje de giro: cateto h",
   formulas: "V = ⅓·π·r²·h\nA = π·r·(r + g),  g = √(r² + h²)",
   vol: (r, h) => PI * r * r * h / 3, area: (r, h) => PI * r * (r + Math.hypot(r, h)),
   rows: (r, h) => [["Generatriz g = √(r²+h²)", Math.hypot(r, h)], ["Área lateral π·r·g", PI * r * Math.hypot(r, h)]],
   text: "Al girar 360° un triángulo rectángulo alrededor de uno de sus catetos (la altura h), el otro cateto (el radio r) dibuja la base circular y la hipotenusa g dibuja la superficie lateral.",
   steps: ["Dibuja el triángulo rectángulo con catetos r y h.", "Fija el cateto h como eje de giro.", "Gira el triángulo de 0° a 360° alrededor del eje.", "Resultado: un cono con base de radio r y generatriz g."] },
 { key: "par", fig: "Parábola (región acotada)", solid: "Paraboloide de revolución", type: "Revolución",
   eq: "Región: h·x²/r² ≤ y ≤ h, 0 ≤ x ≤ r  ·  eje de giro: eje y",
   formulas: "V = ½·π·r²·h\nA = A_lat + π·r²\nA_lat = ∫₀ʳ 2πx·√(1+(2hx/r²)²) dx\n      = πr/(6h²)·[(r²+4h²)^(3/2) − r³]",
   vol: (r, h) => PI * r * r * h / 2, area: (r, h) => latPar(r, h) + PI * r * r,
   rows: (r, h) => [["Área lateral (integral)", latPar(r, h)], ["Tapa circular π·r²", PI * r * r]],
   text: "Una parábola sola no encierra volumen. Por eso se usa una región acotada: la zona entre la parábola y la recta y = h. Al girarla alrededor del eje se obtiene un sólido de volumen finito, exactamente la mitad del cilindro de igual r y h.",
   steps: ["Dibuja la parábola y = h·x²/r² para 0 ≤ x ≤ r.", "Cierra la región con la recta y = h (acota el sólido).", "Gira la región 360° alrededor del eje y.", "Resultado: paraboloide con tapa circular de radio r."] }
];
function latPar(r, h) { return PI * r / (6 * h * h) * (Math.pow(r * r + 4 * h * h, 1.5) - Math.pow(r, 3)); }
function paraPts(r, h) {
  const p = []; for (let i = 0; i <= 28; i++) { const x = r * i / 28; p.push([x, h * (x / r) ** 2]); }
  p.push([0, h]); return p;
}

const state = { idx: 0, r: 1.5, h: 3, t: 0, playing: false, dirty: true };

/* ---------- Three.js ---------- */
const stage = $("#stage"), canvas = $("#gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
const HOME = new THREE.Vector3(5.5, 4.5, 7), TARGET = new THREE.Vector3(0, 1.5, 0);
camera.position.copy(HOME);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.target.copy(TARGET); controls.minDistance = 3; controls.maxDistance = 22;
scene.add(new THREE.AmbientLight(0xffffff, 0.75));
const sun = new THREE.DirectionalLight(0xffffff, 1.1); sun.position.set(4, 8, 5); scene.add(sun);
scene.add(new THREE.GridHelper(10, 20, 0x00e5ff, 0x1a3f80));
const group = new THREE.Group(); scene.add(group);

function build() {
  while (group.children.length) { const o = group.children.pop(); o.geometry && o.geometry.dispose(); }
  const { r, h, t } = state, k = CASES[state.idx].key;
  const fill = new THREE.MeshStandardMaterial({ color: 0x00b8e6, transparent: true, opacity: 0.62, side: THREE.DoubleSide, roughness: 0.45 });
  const wire = new THREE.MeshBasicMaterial({ color: 0xb6ff3b, wireframe: true, transparent: true, opacity: 0.3 });
  const flat = new THREE.MeshBasicMaterial({ color: 0xff8a1f, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
  let solid, fig;
  if (k === "cil") {
    const hh = Math.max(t * h, 0.001);
    solid = new THREE.CylinderGeometry(r, r, hh, 64, 1); solid.translate(0, hh / 2, 0);
    fig = new THREE.CircleGeometry(r, 64); fig.rotateX(-PI / 2); fig.translate(0, 0.002, 0);
  } else {
    const pts = k === "con" ? [[0, 0], [r, 0], [0, h]] : paraPts(r, h);
    solid = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), 72, PI / 2, Math.max(t * 2 * PI, 0.0001));
    const sh = new THREE.Shape(); pts.forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]));
    fig = new THREE.ShapeGeometry(sh);
    const ax = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0, h + 0.6, 0)]);
    group.add(new THREE.Line(ax, new THREE.LineBasicMaterial({ color: 0xffffff })));
  }
  group.add(new THREE.Mesh(fig, flat), new THREE.Mesh(solid, fill), new THREE.Mesh(solid, wire));
}

/* ---------- Dibujo de la figura 2D original ---------- */
const c2 = $("#fig2d"), g2 = c2.getContext("2d");
function draw2D() {
  const { r, h } = state, k = CASES[state.idx].key, W = c2.width, H = c2.height;
  g2.clearRect(0, 0, W, H); g2.font = "600 13px Figtree,sans-serif"; g2.lineWidth = 2;
  g2.fillStyle = "#ff8a1f"; g2.fillText("Figura 2D original", 10, 18);
  const lab = (s, x, y, c = "#fff") => { g2.fillStyle = c; g2.fillText(s, x, y); };
  g2.fillStyle = "rgba(255,138,31,.55)"; g2.strokeStyle = "#ff8a1f";
  if (k === "cil") {
    const R = Math.min(W - 40, H - 50) / 2, cx = W / 2, cy = H / 2 + 10;
    g2.beginPath(); g2.arc(cx, cy, R, 0, 2 * PI); g2.fill(); g2.stroke();
    g2.strokeStyle = "#b6ff3b"; g2.beginPath(); g2.moveTo(cx, cy); g2.lineTo(cx + R, cy); g2.stroke();
    lab("r = " + f2(r), cx + 6, cy - 6, "#b6ff3b");
  } else {
    const sc = Math.min((W - 60) / r, (H - 60) / h), x0 = 30, y0 = H - 24, X = x => x0 + x * sc, Y = y => y0 - y * sc;
    g2.beginPath();
    (k === "con" ? [[0, 0], [r, 0], [0, h]] : paraPts(r, h)).forEach((p, i) => i ? g2.lineTo(X(p[0]), Y(p[1])) : g2.moveTo(X(p[0]), Y(p[1])));
    g2.closePath(); g2.fill(); g2.stroke();
    g2.strokeStyle = "#fff"; g2.setLineDash([4, 4]); g2.beginPath(); g2.moveTo(x0, y0 + 6); g2.lineTo(x0, Y(h) - 6); g2.stroke(); g2.setLineDash([]);
    lab("r = " + f2(r), X(r / 2) - 20, y0 + 14, "#b6ff3b"); lab("h = " + f2(h), x0 + 6, Y(h / 2), "#b6ff3b");
    lab("eje", x0 - 22, Y(h) + 4);
    if (k === "con") lab("g", X(r / 2) + 8, Y(h / 2) - 4, "#00e5ff");
  }
}

/* ---------- Interfaz ---------- */
const catalog = $("#catalog");
CASES.forEach((c, i) => {
  const b = document.createElement("button"); b.dataset.sel = ""; b.innerHTML = `${c.fig} → ${c.solid}<small>${c.type}</small>`;
  b.onclick = () => { state.idx = i; state.t = 0; state.playing = false; refresh(true); }; catalog.append(b);
});
function refresh(full) {
  const c = CASES[state.idx], { r, h, t } = state;
  [...catalog.children].forEach((b, i) => b.setAttribute("aria-pressed", i === state.idx));
  $("#t").value = t; $("#tOut").textContent = Math.round(t * 100) + "%";
  $("#rOut").textContent = f2(r); $("#hOut").textContent = f2(h);
  $("#play").textContent = state.playing ? "Pausar" : "Animar";
  $("#badge").textContent = `${c.type}: ${Math.round(t * 100)}%`;
  $("#title").textContent = `${c.fig} → ${c.solid}`; $("#type").textContent = c.type;
  $("#eq").textContent = c.eq; $("#formulas").textContent = c.formulas; $("#explain").textContent = c.text;
  const vals = [["Radio r", r], ["Altura h", h], ...c.rows(r, h), ["Volumen V", c.vol(r, h)], ["Área total A", c.area(r, h)]];
  $("#values").innerHTML = vals.map(v => `<tr><td>${v[0]}</td><td>${f2(v[1])}</td></tr>`).join("");
  const on = Math.min(c.steps.length - 1, Math.floor(t * c.steps.length));
  $("#steps").innerHTML = c.steps.map((s, i) => `<li class="${i <= on && t > 0 ? "on" : ""}">${s}</li>`).join("");
  draw2D(); state.dirty = true;
}
const setT = v => { state.t = clamp(v, 0, 1); refresh(); };
$("#t").oninput = e => { state.playing = false; setT(+e.target.value); };
$("#r").oninput = e => { state.r = +e.target.value; refresh(); };
$("#h").oninput = e => { state.h = +e.target.value; refresh(); };
$("#play").onclick = () => { if (state.t >= 1) state.t = 0; state.playing = !state.playing; refresh(); };
$("#reset").onclick = () => { state.playing = false; state.t = 0; resetView(); refresh(); };
$("#overlay").onchange = e => stage.classList.toggle("overlay", e.target.checked);
function resetView() { group.rotation.set(0, 0, 0); camera.position.copy(HOME); controls.target.copy(TARGET); controls.update(); }

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight; renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage); resize();

let last = performance.now();
function frame(now) {
  const dt = (now - last) / 1000; last = now;
  if (state.playing) { state.t = Math.min(1, state.t + dt / 6); if (state.t >= 1) state.playing = false; refresh(); }
  if (state.dirty) { build(); state.dirty = false; }
  controls.update(); renderer.render(scene, camera); requestAnimationFrame(frame);
}

/* ---------- MediaPipe: solo reconoce gestos ---------- */
const MP = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
const video = $("#cam"), status = $("#status");
const cursor = Object.assign(document.createElement("div"), { id: "cursor" }); document.body.append(cursor);
let landmarker = null, camOn = false, lastVT = -1, prevPalm = null, prevPair = null, hoverEl = null, hoverT = 0, lastReset = 0;

$("#camBtn").onclick = async () => {
  if (camOn) return;
  try {
    status.textContent = "Cargando cámara y MediaPipe…";
    video.srcObject = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false });
    await video.play();
    const { HandLandmarker, FilesetResolver } = await import(MP + "/vision_bundle.mjs");
    const fs = await FilesetResolver.forVisionTasks(MP + "/wasm");
    landmarker = await HandLandmarker.createFromOptions(fs, {
      baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", delegate: "GPU" },
      runningMode: "VIDEO", numHands: 2 });
    camOn = true; $("#camBtn").textContent = "Gestos activos"; $("#overlay").checked = true; stage.classList.add("overlay");
    status.textContent = "Gestos activos: muestra una mano"; gestureLoop();
  } catch (e) { status.textContent = "No se pudo iniciar: " + e.message + " (usa localhost o https)"; }
};

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function pose(l) {
  const ext = (t, p) => dist(l[t], l[0]) > dist(l[p], l[0]) * 1.08;
  const f = [ext(8, 6), ext(12, 10), ext(16, 14), ext(20, 18)], n = f.filter(Boolean).length;
  if (dist(l[4], l[8]) < 0.35 * dist(l[0], l[9])) return "pinza";
  if (n === 0) return "puño";
  if (f[0] && n === 1) return "índice";
  if (n === 4) return "palma abierta";
  return "otro";
}
function handleHands(hands, now) {
  if (!hands.length) { cursor.style.display = "none"; prevPalm = prevPair = null; status.textContent = "Gestos activos: no veo ninguna mano"; return; }
  if (hands.length === 2) {
    const d = dist(hands[0][0], hands[1][0]);
    if (prevPair) { const f = clamp(prevPair / d, 0.9, 1.1), v = camera.position.clone().sub(controls.target).multiplyScalar(f); camera.position.copy(controls.target).add(v); }
    prevPair = d; prevPalm = null; cursor.style.display = "none"; status.textContent = "Dos manos: zoom"; return;
  }
  prevPair = null;
  const l = hands[0], p = pose(l); status.textContent = "Gesto: " + p;
  if (p === "palma abierta") {
    const c = { x: 1 - l[9].x, y: l[9].y };
    if (prevPalm) { group.rotation.y += (c.x - prevPalm.x) * 7; group.rotation.x = clamp(group.rotation.x + (c.y - prevPalm.y) * 5, -1.4, 1.4); }
    prevPalm = c;
  } else prevPalm = null;
  if (p === "pinza") { state.playing = false; setT((1 - (l[4].x + l[8].x) / 2 - 0.15) / 0.7); }
  if (p === "puño" && now - lastReset > 1200) { lastReset = now; resetView(); }
  if (p === "índice") {
    const x = (1 - l[8].x) * innerWidth, y = l[8].y * innerHeight;
    cursor.style.display = "block"; cursor.style.transform = `translate(${x + 20}px,${y + 20}px)`;
    const el = document.elementFromPoint(x, y)?.closest("[data-sel]") || null;
    cursor.classList.toggle("on", !!el);
    if (el !== hoverEl) { hoverEl = el; hoverT = now; }
    else if (el && now - hoverT > 900) { el.click(); hoverT = now + 1200; }
  } else { cursor.style.display = "none"; hoverEl = null; }
}
function gestureLoop() {
  if (!camOn) return;
  if (video.currentTime !== lastVT) { lastVT = video.currentTime; const now = performance.now(); handleHands(landmarker.detectForVideo(video, now).landmarks || [], now); }
  requestAnimationFrame(gestureLoop);
}

refresh(true); requestAnimationFrame(frame);
