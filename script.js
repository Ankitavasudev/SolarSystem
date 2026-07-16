/**
 * Solar System Interactive Visualization
 * @author Ankita Salaria
 */

// Planet data
const planets = [
    {
        name: 'Mercury',
        className: 'mercury',
        orbitSize: 80,
        speed: 4.15,
        size: 12,
        data: {
            distance: '57.9 million km',
            orbitalPeriod: '88 Earth days',
            dayLength: '59 Earth days',
            moons: '0',
            temperature: '-180°C to 430°C',
            funFact: 'Mercury is the smallest planet and closest to the Sun. Despite being closest, it\'s not the hottest - Venus is!'
        }
    },
    {
        name: 'Venus',
        className: 'venus',
        orbitSize: 120,
        speed: 1.62,
        size: 16,
        data: {
            distance: '108.2 million km',
            orbitalPeriod: '225 Earth days',
            dayLength: '243 Earth days',
            moons: '0',
            temperature: '462°C average',
            funFact: 'Venus rotates backwards compared to other planets, and a day on Venus is longer than its year!'
        }
    },
    {
        name: 'Earth',
        className: 'earth',
        orbitSize: 170,
        speed: 1.0,
        size: 18,
        data: {
            distance: '149.6 million km',
            orbitalPeriod: '365.25 days',
            dayLength: '24 hours',
            moons: '1',
            temperature: '-88°C to 58°C',
            funFact: 'Earth is the only known planet to support life. It\'s also the only planet not named after a Greek or Roman god!'
        }
    },
    {
        name: 'Mars',
        className: 'mars',
        orbitSize: 220,
        speed: 0.53,
        size: 14,
        data: {
            distance: '227.9 million km',
            orbitalPeriod: '687 Earth days',
            dayLength: '24.6 hours',
            moons: '2 (Phobos & Deimos)',
            temperature: '-140°C to 20°C',
            funFact: 'Mars has the largest volcano in the solar system - Olympus Mons, which is nearly 3 times the height of Everest!'
        }
    },
    {
        name: 'Jupiter',
        className: 'jupiter',
        orbitSize: 300,
        speed: 0.084,
        size: 35,
        data: {
            distance: '778.5 million km',
            orbitalPeriod: '11.86 Earth years',
            dayLength: '9.93 hours',
            moons: '95 known',
            temperature: '-110°C',
            funFact: 'Jupiter is so large that all other planets could fit inside it! Its Great Red Spot is a storm larger than Earth.'
        }
    },
    {
        name: 'Saturn',
        className: 'saturn',
        orbitSize: 380,
        speed: 0.034,
        size: 30,
        data: {
            distance: '1.4 billion km',
            orbitalPeriod: '29.46 Earth years',
            dayLength: '10.7 hours',
            moons: '146 known',
            temperature: '-178°C',
            funFact: 'Saturn\'s rings are made mostly of ice particles and rocky debris. The planet is so light it would float in water!'
        }
    },
    {
        name: 'Uranus',
        className: 'uranus',
        orbitSize: 450,
        speed: 0.012,
        size: 22,
        data: {
            distance: '2.9 billion km',
            orbitalPeriod: '84 Earth years',
            dayLength: '17.24 hours',
            moons: '27 known',
            temperature: '-224°C',
            funFact: 'Uranus rotates on its side, likely due to a collision with an Earth-sized object long ago!'
        }
    },
    {
        name: 'Neptune',
        className: 'neptune',
        orbitSize: 510,
        speed: 0.006,
        size: 20,
        data: {
            distance: '4.5 billion km',
            orbitalPeriod: '164.8 Earth years',
            dayLength: '16.11 hours',
            moons: '16 known',
            temperature: '-214°C',
            funFact: 'Neptune has the strongest winds in the solar system, reaching speeds of over 2,000 km/h!'
        }
    }
];

// State
let isPaused = false;
let animationFrameId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    createStars();
    createSolarSystem();
    setupControls();
});

// Create star field
function createStars() {
    const starsContainer = document.getElementById('stars');
    const starCount = 200;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.width = Math.random() * 3 + 1 + 'px';
        star.style.height = star.style.width;
        star.style.animationDelay = Math.random() * 2 + 's';
        starsContainer.appendChild(star);
    }
}

// Create solar system
function createSolarSystem() {
    const solarSystem = document.getElementById('solarSystem');
    
    planets.forEach((planet, index) => {
        // Create orbit
        const orbit = document.createElement('div');
        orbit.className = 'orbit';
        orbit.style.width = planet.orbitSize * 2 + 'px';
        orbit.style.height = planet.orbitSize * 2 + 'px';
        orbit.style.animationDuration = (10 / planet.speed) + 's';
        solarSystem.appendChild(orbit);
        
        // Create planet
        const planetEl = document.createElement('div');
        planetEl.className = `planet ${planet.className}`;
        planetEl.style.width = planet.size + 'px';
        planetEl.style.height = planet.size + 'px';
        planetEl.style.left = planet.orbitSize + 'px';
        planetEl.style.top = '50%';
        planetEl.style.transform = `translate(-50%, -50%)`;
        
        // Planet name
        const nameEl = document.createElement('span');
        nameEl.className = 'planet-name';
        nameEl.textContent = planet.name;
        planetEl.appendChild(nameEl);
        
        // Click handler
        planetEl.addEventListener('click', () => showPlanetInfo(planet));
        
        // Add to orbit
        orbit.appendChild(planetEl);
    });
    
    // Sun click handler
    document.getElementById('sun').addEventListener('click', () => showSunInfo());
}

// Show planet info
function showPlanetInfo(planet) {
    const panel = document.getElementById('infoPanel');
    document.getElementById('planetName').textContent = planet.name;
    document.getElementById('distance').textContent = planet.data.distance;
    document.getElementById('orbitalPeriod').textContent = planet.data.orbitalPeriod;
    document.getElementById('dayLength').textContent = planet.data.dayLength;
    document.getElementById('moons').textContent = planet.data.moons;
    document.getElementById('temperature').textContent = planet.data.temperature;
    document.getElementById('funFact').textContent = planet.data.funFact;
    panel.classList.add('active');
}

// Show sun info
function showSunInfo() {
    const panel = document.getElementById('infoPanel');
    document.getElementById('planetName').textContent = 'Sun';
    document.getElementById('distance').textContent = 'Center of Solar System';
    document.getElementById('orbitalPeriod').textContent = '225-250 million years (galactic orbit)';
    document.getElementById('dayLength').textContent = '25 Earth days (equator)';
    document.getElementById('moons').textContent = '8 planets';
    document.getElementById('temperature').textContent = '5,500°C (surface)';
    document.getElementById('funFact').textContent = 'The Sun contains 99.86% of all mass in the solar system. It\'s a nearly perfect sphere of hot plasma!';
    panel.classList.add('active');
}

// Setup controls
function setupControls() {
    // Pause button
    document.getElementById('pauseBtn').addEventListener('click', () => {
        isPaused = !isPaused;
        const orbits = document.querySelectorAll('.orbit');
        orbits.forEach(orbit => {
            orbit.style.animationPlayState = isPaused ? 'paused' : 'running';
        });
        document.getElementById('pauseBtn').textContent = isPaused ? '▶️ Play' : '⏸️ Pause';
    });
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
        const orbits = document.querySelectorAll('.orbit');
        orbits.forEach(orbit => {
            orbit.style.animation = 'none';
            orbit.offsetHeight; // Trigger reflow
            orbit.style.animation = null;
            orbit.style.animationPlayState = 'running';
        });
        isPaused = false;
        document.getElementById('pauseBtn').textContent = '⏸️ Pause';
    });
    
    // Close panel
    document.getElementById('closePanel').addEventListener('click', () => {
        document.getElementById('infoPanel').classList.remove('active');
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            document.getElementById('pauseBtn').click();
        }
        if (e.key === 'r' || e.key === 'R') {
            document.getElementById('resetBtn').click();
        }
    });
}
