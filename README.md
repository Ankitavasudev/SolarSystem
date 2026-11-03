<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:04060B,50:0B7285,100:00ADB5&height=180&section=header&text=Solar%20System&fontSize=52&fontColor=EAF1F8&fontAlignY=38&desc=An%20interactive%203D%20orrery%20in%20the%20browser&descAlignY=58&descSize=16" width="100%" alt="Solar System" />

**Real textures. Kepler-correct orbits. Asteroids, comets and shooting stars.**

<br />

<a href="https://ankitavasudev.github.io/SolarSystem/"><img src="https://img.shields.io/badge/%E2%96%B6%20LIVE%20DEMO-00ADB5?style=for-the-badge&logoColor=white" alt="Live demo" /></a>
&nbsp;
<img src="https://img.shields.io/badge/no%20build%20step-0D1117?style=for-the-badge&logoColor=white" />
&nbsp;
<img src="https://img.shields.io/badge/three.js-r170-0D1117?style=for-the-badge&logo=three.js&logoColor=white" />

<br /><br />

<img src="https://img.shields.io/badge/JavaScript-F7DF1E?flat-square&logo=javascript&logoColor=black" />
<img src="https://img.shields.io/badge/WebGL-990000?flat-square&logo=webgl&logoColor=white" />
<img src="https://img.shields.io/badge/CSS3-1572B6?flat-square&logo=css3&logoColor=white" />
<img src="https://img.shields.io/badge/GitHub%20Pages-222222?flat-square&logo=githubpages&logoColor=white" />

</div>

---

## What you're looking at

A full solar system that runs from a static folder — no bundler, no framework, no server. Everything is real: NASA-scale surface maps, Saturn's rings with their actual gap structure, an asteroid belt of 2,400 rocks, two comets trailing ion tails, and the Milky Way as the skybox.

| | |
| :-- | :-- |
| **Real surface maps** | 2K albedo maps for all eight planets, plus the Moon, the Sun, Earth's cloud layer and Saturn's ring alpha map |
| **Kepler-correct motion** | Angular speed ∝ `1/√a`, so Mercury laps Earth four times in the time Earth orbits once |
| **Asteroid belt** | 2,400 instanced rocks between Mars and Jupiter, each with its own size and spin |
| **Kuiper belt** | 2,600 icy bodies beyond Neptune |
| **Comets** | Two long-period comets with sun-facing ion tails that stretch as they approach |
| **Shooting stars** | Random meteors streak across the sky every few seconds |
| **Hover + click** | Cursor labels, planet highlight, click ripple, animated selection reticle |
| **Live data** | Distance, period, diameter, day length, moons and temperature per planet |
| **Cinematic camera** | Drag to orbit, scroll to zoom, click a planet to fly to it and track it |
| **Keyboard** | `Space` pause · `1`–`8` jump to a planet · `Esc` close |

## Controls

| Input | Action |
| :-- | :-- |
| Drag | Orbit the camera |
| Scroll / pinch | Zoom in and out |
| Hover a planet | Show its name at the cursor and light it up |
| Click a planet | Fly in, lock on, open the data panel |
| `Space` | Pause / resume the simulation |
| Speed slider | `0×` to `4×` orbital speed |
| Reset button | Return to the wide system view |

## Skewed scale, honest physics

A true-scale solar system cannot be drawn. Neptune is 7,500 Earth-widths away, and at that scale the planets are sub-pixel. So the scene compresses space while keeping the *ratios* that matter:

```js
// orbital radius: log compression keeps every orbit on screen
r = 7 + 7.5 · log₂(1 + AU)

// body size: square-root compression of the real diameter
size = 0.46 + 0.9 · √(diameter / 12,756 km)

// angular velocity: Kepler's third law, preserved exactly
ω ∝ 1 / √a
```

Ordering, relative periods and orbital speed relationships are all real. Distances and diameters are compressed — the README says so, and so does the code.

## Run it locally

Textures are served from the repo, so no CORS workarounds are needed — but ES modules do need an HTTP origin:

```bash
python -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` over `file://` will fail on the module imports.

## Structure

```
SolarSystem/
├── index.html      # markup, import map, HUD
├── style.css       # glass UI, tooltip, ripple, responsive layout
├── script.js       # scene graph, orbital maths, belt, comets, interaction
├── textures/       # 13 maps incl. the Milky Way (≈1.5 MB, self-hosted)
└── README.md
```

## Credits

- Planet, ring and Milky Way maps: [SolarSystemScope](https://www.solarsystemscope.com/textures/) — **CC BY 4.0**
- Planetary data: NASA planetary fact sheets
- 3D engine: [Three.js](https://threejs.org/) r170 via CDN import map

---

<div align="center">

**Ankita Salaria** · [@Ankitavasudev](https://github.com/Ankitavasudev)

</div>
