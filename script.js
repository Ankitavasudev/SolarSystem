/**
 * Solar System — interactive 3D orrery
 * Author: Ankita Salaria
 *
 * Planets are drawn to a compressed scale so every orbit fits on screen:
 * real orbital periods are preserved as ratios, sizes use a square-root
 * compression, and orbital radii use a log compression of the true AU values.
 * Surface textures are generated procedurally so the page ships with zero
 * external image assets.
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const AU_SCALE = 7.5; // log compression strength for orbital radius
const BASE_RADIUS = 7; // orbit radius of a body at 0 AU
const SPEED = 0.12; // global orbital speed at 1x

const PLANETS = [
  {
    name: "Mercury",
    au: 0.387,
    period: 87.97,
    diameter: 4879,
    moons: 0,
    day: "58.6 Earth days",
    temp: "-173 to 427 °C",
    tilt: 0.03,
    color: "#8c8279",
    style: "rocky",
    fact: "Sunrise to sunrise on Mercury takes 176 Earth days — two Mercury years. It is the smallest planet, and despite being closest to the Sun it is not the hottest.",
  },
  {
    name: "Venus",
    au: 0.723,
    period: 224.7,
    diameter: 12104,
    moons: 0,
    day: "243 Earth days (retrograde)",
    temp: "464 °C average",
    tilt: 177.4,
    color: "#e6c27a",
    style: "cloudy",
    fact: "Venus spins backwards and so slowly that its day is longer than its year. A runaway greenhouse effect keeps the surface hot enough to melt lead.",
  },
  {
    name: "Earth",
    au: 1.0,
    period: 365.25,
    diameter: 12756,
    moons: 1,
    day: "23.9 hours",
    temp: "-89 to 58 °C",
    tilt: 23.44,
    color: "#2f6fbf",
    style: "earth",
    fact: "The only world where liquid water is stable at the surface. Its 23.4° axial tilt, not distance from the Sun, is what gives us seasons.",
  },
  {
    name: "Mars",
    au: 1.524,
    period: 686.98,
    diameter: 6792,
    moons: 2,
    day: "24.6 hours",
    temp: "-143 to 35 °C",
    tilt: 25.19,
    color: "#c1440e",
    style: "rocky",
    fact: "Olympus Mons rises 22 km — nearly three times Everest. Mars has the tallest volcano and the deepest canyon in the solar system.",
  },
  {
    name: "Jupiter",
    au: 5.203,
    period: 4332.6,
    diameter: 142984,
    moons: 95,
    day: "9.9 hours",
    temp: "-108 °C cloud tops",
    tilt: 3.13,
    color: "#d8ca9d",
    style: "gas",
    fact: "The Great Red Spot is a storm wider than Earth that has been raging for at least 190 years. Jupiter holds more mass than every other planet combined.",
  },
  {
    name: "Saturn",
    au: 9.537,
    period: 10759,
    diameter: 120536,
    moons: 274,
    day: "10.7 hours",
    temp: "-139 °C cloud tops",
    tilt: 26.73,
    color: "#e3d1a0",
    style: "gas",
    ring: true,
    fact: "Saturn is less dense than water — it would float. Its rings are only about 10 m thick on average but span 280,000 km.",
  },
  {
    name: "Uranus",
    au: 19.19,
    period: 30687,
    diameter: 51118,
    moons: 28,
    day: "17.2 hours",
    temp: "-197 °C",
    tilt: 97.77,
    color: "#9fe3e3",
    style: "ice",
    fact: "Uranus orbits on its side, likely knocked over by a collision. Each pole gets 42 years of continuous sunlight, then 42 years of darkness.",
  },
  {
    name: "Neptune",
    au: 30.07,
    period: 60190,
    diameter: 49528,
    moons: 16,
    day: "16.1 hours",
    temp: "-201 °C",
    tilt: 28.32,
    color: "#3b5bdb",
    style: "ice",
    fact: "Winds here reach 2,100 km/h, the fastest in the solar system. Neptune was found by mathematics before anyone saw it through a telescope.",
  },
];

/* ---------------------------------------------------------------- helpers */

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Overlay translucent white/black ellipses to fake surface variation. */
function speckle(ctx, w, h, count, rand, alpha) {
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const rx = 12 + rand() * 70;
    const ry = 8 + rand() * 40;
    const light = rand() > 0.5;
    ctx.beginPath();
    ctx.fillStyle = light
      ? `rgba(255,255,255,${alpha * rand()})`
      : `rgba(0,0,0,${alpha * rand()})`;
    ctx.ellipse(x, y, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function makeSurfaceTexture(planet) {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const rand = seededRandom(planet.name.length * 7919 + Math.round(planet.au * 1000));

  ctx.fillStyle = planet.color;
  ctx.fillRect(0, 0, w, h);

  if (planet.style === "gas" || planet.style === "ice" || planet.style === "cloudy") {
    // Latitudinal bands, lighter near the equator.
    const bands = planet.style === "gas" ? 34 : 14;
    for (let i = 0; i < bands; i++) {
      const y = (h / bands) * i;
      const shade = rand();
      const alpha = planet.style === "gas" ? 0.1 + shade * 0.16 : 0.05 + shade * 0.08;
      ctx.fillStyle = i % 2 === 0
        ? `rgba(255,255,255,${alpha})`
        : `rgba(0,0,0,${alpha * 0.8})`;
      ctx.fillRect(0, y, w, h / bands + 1);
    }
    speckle(ctx, w, h, 40, rand, 0.08);
    if (planet.name === "Jupiter") {
      ctx.beginPath();
      ctx.fillStyle = "rgba(196, 74, 44, 0.75)";
      ctx.ellipse(w * 0.62, h * 0.62, 78, 40, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (planet.style === "earth") {
    speckle(ctx, w, h, 46, rand, 0.55);
    ctx.fillStyle = "rgba(58, 125, 68, 0.85)";
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.ellipse(
        rand() * w,
        h * 0.2 + rand() * h * 0.6,
        24 + rand() * 90,
        14 + rand() * 55,
        rand() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    // Polar ice.
    const north = ctx.createLinearGradient(0, 0, 0, h * 0.16);
    north.addColorStop(0, "rgba(255,255,255,0.95)");
    north.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = north;
    ctx.fillRect(0, 0, w, h * 0.16);
    const south = ctx.createLinearGradient(0, h, 0, h * 0.86);
    south.addColorStop(0, "rgba(255,255,255,0.95)");
    south.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = south;
    ctx.fillRect(0, h * 0.84, w, h * 0.16);
  } else {
    speckle(ctx, w, h, 130, rand, 0.3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeGlowTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255, 236, 170, 1)");
  g.addColorStop(0.25, "rgba(255, 196, 60, 0.55)");
  g.addColorStop(0.6, "rgba(255, 140, 20, 0.12)");
  g.addColorStop(1, "rgba(255, 120, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const orbitRadius = (au) => BASE_RADIUS + AU_SCALE * Math.log2(1 + au);
const bodySize = (diameter) => 0.42 + Math.sqrt(diameter / 12756) * 0.82;

/* ---------------------------------------------------------------- scene */

const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05070d, 0.0016);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 4000);
const DEFAULT_CAM = new THREE.Vector3(0, 26, 58);
camera.position.copy(DEFAULT_CAM);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 3;
controls.maxDistance = 320;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.8;

/* sun */
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(3.4, 64, 64),
  new THREE.MeshBasicMaterial({ color: 0xffcf5c })
);
scene.add(sun);

const glow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    color: 0xffffff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
);
glow.scale.setScalar(26);
scene.add(glow);

const sunLight = new THREE.PointLight(0xfff2cc, 2.6, 0, 0);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x2a3550, 0.55));

/* starfield */
function addStars(count, spread, size, opacity) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = spread * (0.45 + Math.random() * 0.55);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xdfe9ff,
    size,
    sizeAttenuation: true,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  scene.add(new THREE.Points(geo, mat));
}

addStars(6000, 900, 1.1, 0.85);
addStars(2500, 1600, 1.9, 0.45);

/* planets */
const bodies = [];

PLANETS.forEach((data, index) => {
  const radius = orbitRadius(data.au);
  const size = bodySize(data.diameter);

  const orbitPoints = [];
  const segments = 256;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    orbitPoints.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const orbit = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(orbitPoints),
    new THREE.LineBasicMaterial({
      color: 0x2b3d52,
      transparent: true,
      opacity: 0.55,
    })
  );
  scene.add(orbit);

  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(size, 48, 48),
    new THREE.MeshStandardMaterial({
      map: makeSurfaceTexture(data),
      roughness: 0.85,
      metalness: 0.04,
    })
  );
  mesh.rotation.z = THREE.MathUtils.degToRad(data.tilt);
  mesh.userData.bodyIndex = index;
  scene.add(mesh);

  if (data.ring) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(size * 1.35, size * 2.25, 128),
      new THREE.MeshBasicMaterial({
        color: 0xe6d5a8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
      })
    );
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);
  }

  bodies.push({
    ...data,
    radius,
    size,
    mesh,
    orbit,
    angle: (index / PLANETS.length) * Math.PI * 2 + Math.random() * 0.6,
    spin: 0.25 / Math.sqrt(data.au),
  });
});

/* ---------------------------------------------------------------- UI */

const nav = document.getElementById("nav");
const panel = document.getElementById("panel");
const hint = document.getElementById("hint");
const toggleBtn = document.getElementById("toggle");
const resetBtn = document.getElementById("reset");
const speedInput = document.getElementById("speed");
const speedOut = document.getElementById("speedOut");

let follow = null;
let desiredDistance = 0;
let paused = false;
let speed = 1;
let resetting = false;

bodies.forEach((body) => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.innerHTML = `<span class="swatch" style="color:${body.color}"></span>${body.name}`;
  btn.addEventListener("click", () => selectBody(body));
  nav.appendChild(btn);
  body.navButton = btn;
});

function showPanel(body) {
  document.getElementById("panelName").textContent = body.name;
  document.getElementById("panelDot").style.background = body.color;
  document.getElementById("dDist").textContent = `${body.au.toFixed(3)} AU · ${(
    body.au * 149.6
  ).toFixed(1)}M km`;
  document.getElementById("dPeriod").textContent =
    body.period < 1000
      ? `${body.period.toFixed(1)} Earth days`
      : `${(body.period / 365.25).toFixed(1)} Earth years`;
  document.getElementById("dDia").textContent = `${body.diameter.toLocaleString("en-US")} km`;
  document.getElementById("dDay").textContent = body.day;
  document.getElementById("dMoons").textContent = body.moons.toLocaleString("en-US");
  document.getElementById("dTemp").textContent = body.temp;
  document.getElementById("dFact").textContent = body.fact;
  panel.hidden = false;
}

function selectBody(body) {
  follow = body;
  desiredDistance = Math.max(body.size * 9, 7);
  resetting = false;
  showPanel(body);
  bodies.forEach((b) => {
    b.navButton.setAttribute("aria-current", b === body ? "true" : "false");
    if (b.orbit) b.orbit.material.opacity = b === body ? 0.95 : 0.25;
  });
  hint.style.opacity = "0";
}

function clearSelection() {
  follow = null;
  panel.hidden = true;
  bodies.forEach((b) => {
    b.navButton.setAttribute("aria-current", "false");
    b.orbit.material.opacity = 0.55;
  });
}

document.getElementById("panelClose").addEventListener("click", clearSelection);

toggleBtn.addEventListener("click", () => {
  paused = !paused;
  toggleBtn.textContent = paused ? "Play" : "Pause";
  toggleBtn.setAttribute("aria-pressed", String(paused));
});

resetBtn.addEventListener("click", () => {
  clearSelection();
  resetting = true;
});

speedInput.addEventListener("input", () => {
  speed = Number(speedInput.value);
  speedOut.textContent = `${speed.toFixed(1)}×`;
});

/* click to select */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downX = 0;
let downY = 0;

renderer.domElement.addEventListener("pointerdown", (event) => {
  downX = event.clientX;
  downY = event.clientY;
});

renderer.domElement.addEventListener("pointerup", (event) => {
  if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) return;

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hit = raycaster.intersectObjects(bodies.map((b) => b.mesh), false)[0];
  if (hit) {
    selectBody(bodies[hit.object.userData.bodyIndex]);
  }
});

/* ---------------------------------------------------------------- loop */

const clock = new THREE.Clock();
const offset = new THREE.Vector3();
const direction = new THREE.Vector3();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);

  if (!paused) {
    for (const body of bodies) {
      body.angle += (dt * SPEED * speed) / Math.sqrt(body.au);
      body.mesh.position.set(
        Math.cos(body.angle) * body.radius,
        0,
        Math.sin(body.angle) * body.radius
      );
      body.mesh.rotation.y += dt * body.spin * speed;
    }
    glow.scale.setScalar(26 + Math.sin(clock.elapsedTime * 1.6) * 0.6);
  }

  if (follow) {
    // Carry the camera along with the planet, then ease toward a close view.
    offset.copy(follow.mesh.position).sub(controls.target);
    controls.target.add(offset);
    camera.position.add(offset);

    direction.copy(camera.position).sub(controls.target);
    const current = direction.length();
    const next = THREE.MathUtils.lerp(current, desiredDistance, 0.05);
    camera.position.copy(controls.target).add(direction.setLength(next));
  } else if (resetting) {
    camera.position.lerp(DEFAULT_CAM, 0.07);
    controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.07);
    if (camera.position.distanceTo(DEFAULT_CAM) < 0.4) resetting = false;
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

/* expose a tiny API for automated smoke tests */
window.__orrery = {
  bodies: () => bodies.map((b) => b.name),
  select: (name) => {
    const body = bodies.find((b) => b.name.toLowerCase() === String(name).toLowerCase());
    if (body) selectBody(body);
    return Boolean(body);
  },
  panelVisible: () => !panel.hidden,
};
