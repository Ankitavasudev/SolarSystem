# Solar System — interactive 3D orrery

> A real-time 3D model of the solar system in the browser. Planets orbit at their **true relative speeds**, surfaces are generated procedurally on a canvas, and every body is clickable.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=three.js&logoColor=white)
![No build step](https://img.shields.io/badge/build-none-00ADB5?style=flat-square)

**[▶ Open the live demo](https://ankitavasudev.github.io/SolarSystem/)**

---

## What makes it more than a spinning sphere

- **Kepler-correct relative motion.** Each planet's angular velocity is scaled by `1/√a`, so Mercury completes four orbits while Earth finishes one — the same relationship Kepler described in 1619.
- **Compressed but honest scale.** Orbital radii use `7 + 7.5·log₂(1 + AU)`, and body sizes use a square-root compression of real diameters. A linear scale would put Neptune 7,500 planet-widths off screen; this keeps every orbit visible without lying about the ordering.
- **Procedural surfaces.** Gas giants get latitude bands and turbulence, Earth gets continents plus polar ice, and Jupiter carries its own Great Red Spot — all painted into `<canvas>` textures at load time. No texture downloads, no broken assets, no CORS.
- **Real data panel.** Distance, orbital period, diameter, day length, moon count, mean temperature and one genuinely interesting fact per planet.
- **Click to follow.** Selecting a planet eases the camera in and then keeps tracking it along its orbit while you stay free to drag and zoom.

## Controls

| Input | Action |
| --- | --- |
| Drag | Orbit the camera |
| Scroll / pinch | Zoom |
| Click a planet | Open its data panel and follow it |
| `Pause` / `Play` | Freeze or resume orbital motion |
| Speed slider | 0× to 4× orbital speed |
| `Reset view` | Return to the wide system view |
| Planet chips | Jump straight to a world |

## Run it locally

No build step, no `npm install` — it is three static files plus a CDN import map.

```bash
# any static server works
python -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly with `file://` will **not** work: ES module imports require an HTTP origin.

## Project structure

```
SolarSystem/
├── index.html   # markup, import map, HUD
├── style.css    # dark glassmorphism UI, responsive layout
├── script.js    # scene graph, procedural textures, orbital maths, interaction
└── README.md
```

## Planet data

| Planet | Distance (AU) | Orbital period | Diameter (km) | Moons |
| --- | --- | --- | --- | --- |
| Mercury | 0.387 | 88.0 d | 4,879 | 0 |
| Venus | 0.723 | 224.7 d | 12,104 | 0 |
| Earth | 1.000 | 365.3 d | 12,756 | 1 |
| Mars | 1.524 | 687.0 d | 6,792 | 2 |
| Jupiter | 5.203 | 11.9 y | 142,984 | 95 |
| Saturn | 9.537 | 29.5 y | 120,536 | 274 |
| Uranus | 19.190 | 84.0 y | 51,118 | 28 |
| Neptune | 30.070 | 164.8 y | 49,528 | 16 |

Figures from NASA planetary fact sheets. Moon counts track the most recent confirmed totals.

## Built with

`Three.js r170` (ES modules via CDN) · `OrbitControls` · Canvas 2D for texture generation · zero dependencies beyond that.

---

**Ankita Salaria** — [@Ankitavasudev](https://github.com/Ankitavasudev)
