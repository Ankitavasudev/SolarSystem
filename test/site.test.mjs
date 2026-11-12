// Smoke tests for the static orrery.
//
// There is no bundler and no browser in CI, so these checks cover the failures that
// would actually break the page: missing head metadata, missing assets, missing
// textures, a broken module, and a planet table that no longer follows Kepler's
// third law. Run with `npm test` (or `node --test`).

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const script = readFileSync(join(root, "script.js"), "utf8");

test("index.html has the required head metadata", () => {
  assert.match(html, /<!DOCTYPE html>/i);
  assert.match(html, /<html[^>]*\blang="en"/i);
  assert.match(html, /<meta[^>]+charset="UTF-8"/i);
  assert.match(html, /<meta[^>]+name="viewport"/i);
  assert.match(html, /<title>[^<]+<\/title>/i);
  assert.match(html, /<meta[^>]+name="description"[^>]*content="[^"]+"/i);
});

test("local files referenced by index.html exist", () => {
  const refs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
  const local = refs.filter((ref) => !/^(?:[a-z]+:|\/\/|#|data:)/i.test(ref));
  assert.ok(local.includes("script.js"), "index.html should load script.js");
  assert.ok(local.includes("style.css"), "index.html should load style.css");
  for (const ref of local) {
    assert.ok(existsSync(join(root, ref.split(/[?#]/)[0])), `missing local file: ${ref}`);
  }
});

test("every texture referenced by script.js exists", () => {
  const textures = [...script.matchAll(/"([^"]+\.(?:jpe?g|png))"/gi)].map((m) => m[1]);
  assert.ok(textures.length >= 12, `expected at least 12 textures, found ${textures.length}`);
  for (const file of textures) {
    assert.ok(existsSync(join(root, "textures", file)), `missing texture: textures/${file}`);
  }
});

test("the textures directory holds no unreferenced files", () => {
  // Keep the repo honest: an unused map is either a missing feature or dead weight.
  const KNOWN_UNUSED = new Set(["2k_moon.jpg"]); // shipped for a future Moon body, not rendered yet
  const onDisk = readdirSync(join(root, "textures"));
  const referenced = new Set(
    [...script.matchAll(/"([^"]+\.(?:jpe?g|png))"/gi)].map((m) => m[1]),
  );
  const unused = onDisk.filter((file) => !referenced.has(file) && !KNOWN_UNUSED.has(file));
  assert.deepEqual(unused, [], `unreferenced textures: ${unused.join(", ")}`);
});

const planets = [...script.matchAll(
  /name:\s*"([^"]+)",\s*au:\s*([\d.]+),\s*period:\s*([\d.]+),/g,
)].map((m) => ({ name: m[1], au: Number(m[2]), period: Number(m[3]) }));

test("the planet table lists all eight planets", () => {
  assert.deepEqual(
    planets.map((p) => p.name),
    ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"],
  );
});

test("planets are ordered outward and have positive orbital values", () => {
  for (const planet of planets) {
    assert.ok(planet.au > 0, `${planet.name} has a non-positive semi-major axis`);
    assert.ok(planet.period > 0, `${planet.name} has a non-positive period`);
  }
  for (let i = 1; i < planets.length; i += 1) {
    assert.ok(
      planets[i].au > planets[i - 1].au,
      `${planets[i].name} should orbit beyond ${planets[i - 1].name}`,
    );
  }
});

test("orbital periods follow Kepler's third law (T² ∝ a³)", () => {
  // In days² / AU³ the constant is ~133,400; a 5% band catches typos without
  // rejecting the rounded values published in the fact sheets.
  const K = 133_400;
  for (const planet of planets) {
    const ratio = (planet.period ** 2) / planet.au ** 3;
    const error = Math.abs(ratio - K) / K;
    assert.ok(
      error < 0.05,
      `${planet.name}: T²/a³ = ${ratio.toFixed(0)}, expected ~${K} (±5%)`,
    );
  }
});

test("script.js parses as an ES module", () => {
  assert.doesNotThrow(() => {
    execFileSync(process.execPath, ["--check", join(root, "script.js")], { stdio: "pipe" });
  });
});
