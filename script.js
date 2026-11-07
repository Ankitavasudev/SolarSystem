/**
 * Solar System — interactive 3D orrery
 * Author: Ankita Salaria
 *
 * Real planet maps (SolarSystemScope, CC BY 4.0) are self-hosted in ./textures
 * so the page needs no CORS negotiation. Orbits keep their true period ratios
 * (angular speed scales with 1/sqrt(a)); radii and sizes are compressed so the
 * whole system stays on screen.
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const AU_SCALE = 7.5;
const BASE_RADIUS = 7;
const SPEED = 0.12;
const TEXTURES = "./textures/";

const PLANETS = [
  {
    name: "Mercury", au: 0.387, period: 87.97, diameter: 4879, moons: 0,
    day: "58.6 days", temp: "-173 to 427 °C", tilt: 0.03, color: "#9c9186",
    map: "2k_mercury.jpg",
    fact: "Sunrise to sunrise on Mercury takes 176 Earth days. It is the smallest planet, and despite being closest to the Sun it is not the hottest.",
  },
  {
    name: "Venus", au: 0.723, period: 224.7, diameter: 12104, moons: 0,
    day: "243 days, retrograde", temp: "464 °C average", tilt: 177.4, color: "#e0c07a",
    map: "2k_venus_surface.jpg",
    fact: "Venus spins backwards and so slowly that its day outlasts its year. A runaway greenhouse effect keeps the surface hot enough to melt lead.",
  },
  {
    name: "Earth", au: 1.0, period: 365.25, diameter: 12756, moons: 1,
    day: "23.9 hours", temp: "-89 to 58 °C", tilt: 23.44, color: "#3a7bd5",
    map: "2k_earth_daymap.jpg", clouds: "earth_clouds.png",
    fact: "The only world where liquid water is stable at the surface. Its 23.4° axial tilt, not its distance from the Sun, is what gives us seasons.",
  },
  {
    name: "Mars", au: 1.524, period: 686.98, diameter: 6792, moons: 2,
    day: "24.6 hours", temp: "-143 to 35 °C", tilt: 25.19, color: "#c1440e",
    map: "2k_mars.jpg",
    fact: "Olympus Mons rises 22 km, nearly three times Everest. Mars has both the tallest volcano and the deepest canyon in the solar system.",
  },
  {
    name: "Jupiter", au: 5.203, period: 4332.6, diameter: 142984, moons: 95,
    day: "9.9 hours", temp: "-108 °C cloud tops", tilt: 3.13, color: "#d8b98a",
    map: "2k_jupiter.jpg",
    fact: "The Great Red Spot is a storm wider than Earth that has raged for at least 190 years. Jupiter holds more mass than every other planet combined.",
  },
  {
    name: "Saturn", au: 9.537, period: 10759, diameter: 120536, moons: 274,
    day: "10.7 hours", temp: "-139 °C cloud tops", tilt: 26.73, color: "#e3d1a0",
    map: "2k_saturn.jpg", ring: "2k_saturn_ring_alpha.png",
    fact: "Saturn is less dense than water. Its rings average only about 10 m thick yet span 280,000 km.",
  },
  {
    name: "Uranus", au: 19.19, period: 30687, diameter: 51118, moons: 28,
    day: "17.2 hours", temp: "-197 °C", tilt: 97.77, color: "#a8e4e6",
    map: "2k_uranus.jpg", faintRing: true,
    fact: "Uranus orbits on its side, most likely knocked over by a collision. Each pole gets 42 years of continuous sunlight, then 42 years of darkness.",
  },
  {
    name: "Neptune", au: 30.07, period: 60190, diameter: 49528, moons: 16,
    day: "16.1 hours", temp: "-201 °C", tilt: 28.32, color: "#3f63c9",
    map: "2k_neptune.jpg",
    fact: "Winds here reach 2,100 km/h, the fastest in the solar system. Neptune was found by mathematics before anyone saw it through a telescope.",
  },
];

const orbitRadius = (au) => BASE_RADIUS + AU_SCALE * Math.log2(1 + au);
const bodySize = (diameter) => 0.46 + Math.sqrt(diameter / 12756) * 0.9;

/* ------------------------------------------------------------ renderer */

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 6000);
const DEFAULT_CAM = new THREE.Vector3(0, 34, 78);
camera.position.copy(DEFAULT_CAM);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2.5;
controls.maxDistance = 420;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 0.85;

/* ------------------------------------------------------------- loading */

const loaderEl = document.getElementById("loader");
const loaderBar = document.getElementById("loaderBar");
const loaderText = document.getElementById("loaderText");

const manager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(manager);

manager.onProgress = (_url, loaded, total) => {
  loaderBar.style.width = `${Math.round((loaded / total) * 100)}%`;
  loaderText.textContent = `Loading textures ${loaded}/${total}`;
};

manager.onLoad = () => {
  loaderBar.style.width = "100%";
  loaderEl.classList.add("done");
};

/** Load a map with a graceful colour fallback if the file is missing. */
function applyTexture(material, file, onReady) {
  textureLoader.load(
    TEXTURES + file,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      material.map = texture;
      material.needsUpdate = true;
      if (onReady) onReady(texture);
    },
    undefined,
    () => console.warn(`Texture missing: ${file} (using flat colour)`)
  );
}

/* ---------------------------------------------------------------- sky */

function buildSky() {
  // Milky Way dome.
  const skyMaterial = new THREE.MeshBasicMaterial({ color: 0x223044, side: THREE.BackSide });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2200, 48, 32), skyMaterial);
  textureLoader.load(TEXTURES + "2k_stars_milky_way.jpg", (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    skyMaterial.map = texture;
    skyMaterial.color.set(0xb9c7dd);
    skyMaterial.needsUpdate = true;
  });
  scene.add(sky);

  // Extra parallax stars.
  const count = 3500;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 300 + Math.random() * 900;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  scene.add(
    new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xdce9ff, size: 1.4, sizeAttenuation: true,
        transparent: true, opacity: 0.85, depthWrite: false,
      })
    )
  );
}

/* ---------------------------------------------------------------- sun */

const sun = new THREE.Mesh(
  new THREE.SphereGeometry(3.2, 64, 64),
  new THREE.MeshBasicMaterial({ color: 0xffd479 })
);
applyTexture(sun.material, "2k_sun.jpg");
scene.add(sun);

function glowSprite(color, size, opacity) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, `rgba(${color}, ${opacity})`);
  g.addColorStop(0.35, `rgba(${color}, ${opacity * 0.35})`);
  g.addColorStop(1, `rgba(${color}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    })
  );
  sprite.scale.setScalar(size);
  return sprite;
}

const sunGlow = glowSprite("255, 190, 90", 30, 0.9);
scene.add(sunGlow);

const sunLight = new THREE.PointLight(0xfff0d0, 2.6, 0, 0);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x33415a, 0.85));

/* ------------------------------------------------------------- planets */

const bodies = [];
const clickable = [];

function ringGeometry(inner, outer, segments) {
  const geometry = new THREE.RingGeometry(inner, outer, segments, 1);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const vertex = new THREE.Vector3();
  for (let i = 0; i < position.count; i++) {
    vertex.fromBufferAttribute(position, i);
    uv.setXY(i, (vertex.length() - inner) / (outer - inner), 0.5);
  }
  return geometry;
}

PLANETS.forEach((data, index) => {
  const radius = orbitRadius(data.au);
  const size = bodySize(data.diameter);

  const points = [];
  for (let i = 0; i <= 256; i++) {
    const a = (i / 256) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const orbit = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0x4a6a8a, transparent: true, opacity: 0.36 })
  );
  scene.add(orbit);

  const material = new THREE.MeshStandardMaterial({
    color: data.color, roughness: 0.92, metalness: 0.02,
    emissive: 0x0d3b42, emissiveIntensity: 0,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 64, 64), material);
  applyTexture(material, data.map);
  mesh.rotation.z = THREE.MathUtils.degToRad(data.tilt);
  mesh.userData.bodyIndex = index;
  scene.add(mesh);
  clickable.push(mesh);

  let clouds = null;
  if (data.clouds) {
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, transparent: true, opacity: 0.75,
      alphaMap: null, depthWrite: false, roughness: 1,
    });
    clouds = new THREE.Mesh(new THREE.SphereGeometry(size * 1.012, 64, 64), cloudMaterial);
    textureLoader.load(TEXTURES + data.clouds, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      cloudMaterial.alphaMap = texture;
      cloudMaterial.map = texture;
      cloudMaterial.needsUpdate = true;
    });
    mesh.add(clouds);
  }

  if (data.ring) {
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff, side: THREE.DoubleSide, transparent: true,
      opacity: 0.92, depthWrite: false, alphaTest: 0.02,
    });
    textureLoader.load(TEXTURES + data.ring, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      ringMaterial.map = texture;
      ringMaterial.alphaMap = texture;
      ringMaterial.needsUpdate = true;
    });
    const ring = new THREE.Mesh(ringGeometry(size * 1.28, size * 2.35, 160), ringMaterial);
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);
  }

  if (data.faintRing) {
    const ring = new THREE.Mesh(
      ringGeometry(size * 1.5, size * 1.9, 96),
      new THREE.MeshBasicMaterial({
        color: 0x9fd7de, side: THREE.DoubleSide,
        transparent: true, opacity: 0.16, depthWrite: false,
      })
    );
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);
  }

  bodies.push({
    ...data, radius, size, mesh, clouds, orbit,
    angle: (index / PLANETS.length) * Math.PI * 2 + Math.random() * 0.5,
    spin: 0.22 / Math.sqrt(data.au),
  });
});

/* --------------------------------------------------------- small bodies */

// Asteroid belt between Mars and Jupiter.
const beltInner = orbitRadius(2.1);
const beltOuter = orbitRadius(3.35);
const beltCount = 2400;
const beltGeometry = new THREE.IcosahedronGeometry(1, 0);
const beltMaterial = new THREE.MeshStandardMaterial({ color: 0x8c8378, roughness: 1, metalness: 0 });
const belt = new THREE.InstancedMesh(beltGeometry, beltMaterial, beltCount);
{
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  for (let i = 0; i < beltCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = beltInner + Math.random() * (beltOuter - beltInner);
    position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 0.9, Math.sin(angle) * radius);
    quaternion.setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
    const s = 0.035 + Math.random() * 0.075;
    scale.set(s, s * (0.7 + Math.random() * 0.6), s);
    matrix.compose(position, quaternion, scale);
    belt.setMatrixAt(i, matrix);
  }
  belt.instanceMatrix.needsUpdate = true;
}
scene.add(belt);

// Kuiper belt beyond Neptune.
{
  const count = 2600;
  const positions = new Float32Array(count * 3);
  const inner = orbitRadius(33);
  const outer = orbitRadius(52);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = inner + Math.random() * (outer - inner);
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  scene.add(
    new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0x9fb4c9, size: 0.26, sizeAttenuation: true,
        transparent: true, opacity: 0.55, depthWrite: false,
      })
    )
  );
}

/* --------------------------------------------------------------- comets */

const TAIL_PARTICLES = 90;
const comets = [];

function createComet({ a, b, speed, phase, tilt }) {
  const group = new THREE.Group();
  const nucleus = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xdff3ff })
  );
  group.add(nucleus);

  const glow = glowSprite("190, 230, 255", 2.4, 0.6);
  group.add(glow);

  const tailPositions = new Float32Array(TAIL_PARTICLES * 3);
  const tailGeometry = new THREE.BufferGeometry();
  tailGeometry.setAttribute("position", new THREE.BufferAttribute(tailPositions, 3));
  const tailMaterial = new THREE.PointsMaterial({
    color: 0xbfe6ff, size: 0.45, sizeAttenuation: true,
    transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const tail = new THREE.Points(tailGeometry, tailMaterial);
  scene.add(tail);

  scene.add(group);
  comets.push({ group, tail, tailPositions, tailGeometry, a, b, speed, phase, tilt });
}

createComet({ a: 38, b: 26, speed: 0.22, phase: 0.4, tilt: 0.32 });
createComet({ a: 58, b: 34, speed: 0.14, phase: 3.1, tilt: -0.26 });

function updateComets(elapsed, dt) {
  for (const comet of comets) {
    const theta = comet.phase + elapsed * comet.speed;
    const x = Math.cos(theta) * comet.a;
    const z = Math.sin(theta) * comet.b;
    const y = Math.sin(theta * 2) * 2.2 * comet.tilt;
    comet.group.position.set(x, y, z);

    // Tail points away from the Sun.
    const away = comet.group.position.clone().normalize();
    for (let i = 0; i < TAIL_PARTICLES; i++) {
      const t = i / TAIL_PARTICLES;
      const spread = 0.35 + t * 2.4;
      comet.tailPositions[i * 3] = x + away.x * t * 9 + (Math.random() - 0.5) * spread * 0.4;
      comet.tailPositions[i * 3 + 1] = y + away.y * t * 9 + (Math.random() - 0.5) * spread * 0.4;
      comet.tailPositions[i * 3 + 2] = z + away.z * t * 9 + (Math.random() - 0.5) * spread * 0.4;
    }
    comet.tailGeometry.attributes.position.needsUpdate = true;
  }
}

/* ------------------------------------------------------- shooting stars */

const streaks = [];
for (let i = 0; i < 7; i++) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
  const material = new THREE.LineBasicMaterial({
    color: 0xeaf6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  streaks.push({ line, material, geometry, life: 0, wait: Math.random() * 6, velocity: new THREE.Vector3() });
}

function spawnStreak(streak) {
  const radius = 140 + Math.random() * 160;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(1 - Math.random() * 1.2);
  const start = new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi) * 0.8 + 30,
    radius * Math.sin(phi) * Math.sin(theta)
  );
  streak.velocity.set(
    (Math.random() - 0.5) * 130,
    -40 - Math.random() * 60,
    (Math.random() - 0.5) * 130
  );
  const end = start.clone().addScaledVector(streak.velocity.clone().normalize(), 9);
  const positions = streak.geometry.attributes.position;
  positions.setXYZ(0, start.x, start.y, start.z);
  positions.setXYZ(1, end.x, end.y, end.z);
  positions.needsUpdate = true;
  streak.start = start;
  streak.life = 0.9 + Math.random() * 0.6;
  streak.material.opacity = 0.9;
}

function updateStreaks(dt) {
  for (const streak of streaks) {
    if (streak.life > 0) {
      streak.life -= dt;
      streak.material.opacity = Math.max(0, streak.life);
      const offset = streak.velocity.clone().multiplyScalar(dt);
      const positions = streak.geometry.attributes.position;
      for (let i = 0; i < 2; i++) {
        positions.setXYZ(i, positions.getX(i) + offset.x, positions.getY(i) + offset.y, positions.getZ(i) + offset.z);
      }
      positions.needsUpdate = true;
    } else {
      streak.wait -= dt;
      if (streak.wait <= 0) {
        spawnStreak(streak);
        streak.wait = 3 + Math.random() * 9;
      }
    }
  }
}

/* ------------------------------------------------------------------- UI */

const nav = document.getElementById("nav");
const panel = document.getElementById("panel");
const toggleBtn = document.getElementById("toggle");
const resetBtn = document.getElementById("reset");
const speedInput = document.getElementById("speed");
const speedOut = document.getElementById("speedOut");

let follow = null;
let desiredDistance = 0;
let paused = false;
let speed = 1;
let resetting = false;

/* ------------------------------------------------------------------- sound */
const Sound = (() => {
  let ctx = null;
  let muted = localStorage.getItem("solarsys-sound") === "0";
  function ensure() {
    if (!ctx) try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type = "sine", gain = 0.07, slide = 0) {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const now = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, now);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), now + dur);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g).connect(c.destination);
    o.start(now); o.stop(now + dur + 0.02);
  }
  return {
    select: () => { tone(523, 0.07, "sine", 0.07); setTimeout(() => tone(659, 0.09, "sine", 0.08), 70); },
    toggle: () => tone(740, 0.05, "triangle", 0.06),
    reset: () => tone(440, 0.14, "sawtooth", 0.06, -220),
    close: () => tone(660, 0.06, "sine", 0.06),
    toggleMute: () => {
      muted = !muted;
      localStorage.setItem("solarsys-sound", muted ? "0" : "1");
      if (!muted) tone(880, 0.06, "sine", 0.08);
      return muted;
    },
    isMuted: () => muted,
  };
})();

bodies.forEach((body) => {
  const button = document.createElement("button");
  button.type = "button";
  button.innerHTML = `<span class="swatch" style="color:${body.color}"></span>${body.name}`;
  button.addEventListener("click", () => selectBody(body));
  nav.appendChild(button);
  body.navButton = button;
});

function showPanel(body) {
  document.getElementById("panelName").textContent = body.name;
  document.getElementById("dDist").textContent = `${body.au.toFixed(3)} AU`;
  document.getElementById("dPeriod").textContent =
    body.period < 1000 ? `${body.period.toFixed(0)} days` : `${(body.period / 365.25).toFixed(1)} years`;
  document.getElementById("dDia").textContent = `${body.diameter.toLocaleString("en-US")} km`;
  document.getElementById("dDay").textContent = body.day;
  document.getElementById("dMoons").textContent = body.moons.toLocaleString("en-US");
  document.getElementById("dTemp").textContent = body.temp;
  document.getElementById("dFact").textContent = body.fact;
  panel.hidden = false;
}

function selectBody(body) {
  follow = body;
  desiredDistance = Math.max(body.size * 7.5, 4.2);
  resetting = false;
  showPanel(body);
  bodies.forEach((other) => {
    other.navButton.setAttribute("aria-current", other === body ? "true" : "false");
    other.orbit.material.opacity = other === body ? 0.85 : 0.2;
  });
  Sound.select();
}

function clearSelection() {
  follow = null;
  panel.hidden = true;
  bodies.forEach((body) => {
    body.navButton.setAttribute("aria-current", "false");
    body.orbit.material.opacity = 0.36;
  });
}

document.getElementById("panelClose").addEventListener("click", () => { clearSelection(); Sound.close(); });

toggleBtn.addEventListener("click", () => {
  paused = !paused;
  toggleBtn.setAttribute("aria-pressed", String(paused));
  Sound.toggle();
});

resetBtn.addEventListener("click", () => {
  clearSelection();
  resetting = true;
  Sound.reset();
});

const muteBtn = document.getElementById("muteBtn");
muteBtn.addEventListener("click", () => {
  const m = Sound.toggleMute();
  muteBtn.setAttribute("aria-pressed", String(m));
  muteBtn.title = m ? "Sound off" : "Toggle sound";
});

speedInput.addEventListener("input", () => {
  speed = Number(speedInput.value);
  speedOut.textContent = `${speed.toFixed(1)}×`;
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    toggleBtn.click();
  } else if (event.key >= "1" && event.key <= "8") {
    selectBody(bodies[Number(event.key) - 1]);
  } else if (event.key === "Escape") {
    clearSelection();
  }
});

/* -------------------------------------------------------------- picking */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tooltip = document.getElementById("tooltip");
const tooltipName = document.getElementById("tooltipName");
let hovered = null;
let downX = 0;
let downY = 0;

function pick(clientX, clientY) {
  pointer.x = (clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(clickable, false)[0];
  return hit ? bodies[hit.object.userData.bodyIndex] : null;
}

function spawnRipple(x, y) {
  const ripple = document.createElement("div");
  ripple.className = "ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  document.body.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
  window.setTimeout(() => ripple.remove(), 900);
}

renderer.domElement.addEventListener("pointermove", (event) => {
  hovered = pick(event.clientX, event.clientY);
  renderer.domElement.classList.toggle("is-hovering", Boolean(hovered));
  if (hovered) {
    tooltip.hidden = false;
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
    tooltipName.textContent = hovered.name;
  } else {
    tooltip.hidden = true;
  }
});

renderer.domElement.addEventListener("pointerleave", () => {
  hovered = null;
  tooltip.hidden = true;
  renderer.domElement.classList.remove("is-hovering");
});

renderer.domElement.addEventListener("pointerdown", (event) => {
  downX = event.clientX;
  downY = event.clientY;
});

renderer.domElement.addEventListener("pointerup", (event) => {
  if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) return;
  const body = pick(event.clientX, event.clientY);
  if (body) {
    spawnRipple(event.clientX, event.clientY);
    selectBody(body);
  }
});

/* Reticle that hugs the selected planet. */
const selectRing = new THREE.Mesh(
  new THREE.RingGeometry(1, 1.035, 96),
  new THREE.MeshBasicMaterial({
    color: 0x00d8e8, transparent: true, opacity: 0,
    side: THREE.DoubleSide, depthWrite: false,
  })
);
scene.add(selectRing);

/* ----------------------------------------------------------------- loop */

buildSky();

const clock = new THREE.Clock();
const offset = new THREE.Vector3();
const direction = new THREE.Vector3();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  if (!paused) {
    for (const body of bodies) {
      body.angle += (dt * SPEED * speed) / Math.sqrt(body.au);
      body.mesh.position.set(
        Math.cos(body.angle) * body.radius, 0, Math.sin(body.angle) * body.radius
      );
      body.mesh.rotation.y += dt * body.spin * speed;
      if (body.clouds) body.clouds.rotation.y += dt * body.spin * speed * 0.35;
    }
    belt.rotation.y += dt * 0.035 * speed;
    sun.rotation.y += dt * 0.02;
    sunGlow.scale.setScalar(30 + Math.sin(elapsed * 1.7) * 0.8);
    updateComets(elapsed, dt);
  }
  updateStreaks(dt);

  if (follow) {
    offset.copy(follow.mesh.position).sub(controls.target);
    controls.target.add(offset);
    camera.position.add(offset);
    direction.copy(camera.position).sub(controls.target);
    const next = THREE.MathUtils.lerp(direction.length(), desiredDistance, 0.05);
    camera.position.copy(controls.target).add(direction.setLength(next));
  } else if (resetting) {
    camera.position.lerp(DEFAULT_CAM, 0.07);
    controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.07);
    if (camera.position.distanceTo(DEFAULT_CAM) < 0.5) resetting = false;
  }

  // Pointer affordance: gentle emissive lift + scale on the hovered body.
  for (const body of bodies) {
    const target = hovered === body ? 1 : 0;
    body.hoverT = THREE.MathUtils.lerp(body.hoverT ?? 0, target, 0.16);
    body.mesh.material.emissiveIntensity = body.hoverT * 0.85;
    body.mesh.scale.setScalar(1 + body.hoverT * 0.06);
  }

  // Reticle around the selected planet.
  if (follow) {
    selectRing.position.copy(follow.mesh.position);
    selectRing.lookAt(camera.position);
    selectRing.rotateZ(elapsed * 0.35);
    selectRing.scale.setScalar(follow.size * 1.55 + Math.sin(elapsed * 2.2) * follow.size * 0.03);
    selectRing.material.opacity = 0.5;
  } else {
    selectRing.material.opacity = 0;
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* Small hook for automated smoke tests. */
window.__orrery = {
  bodies: () => bodies.map((b) => b.name),
  select: (name) => {
    const body = bodies.find((b) => b.name.toLowerCase() === String(name).toLowerCase());
    if (body) selectBody(body);
    return Boolean(body);
  },
  panelVisible: () => !panel.hidden,
  project: (name) => {
    const body = bodies.find((b) => b.name.toLowerCase() === String(name).toLowerCase());
    if (!body) return null;
    const v = body.mesh.position.clone().project(camera);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
    };
  },
  stats: () => ({
    belt: beltCount,
    comets: comets.length,
    texturesLoaded: manager.isLoaded ?? null,
  }),
};
