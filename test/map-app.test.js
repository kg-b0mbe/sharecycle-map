import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createMapApp } from "../src/map-app.js";
import { SITE_URL, MAP_OPTIONS, GEOCODER_OPTIONS, getShareUrl } from "../src/config.js";

function fixture(options = {}) {
  const settings = { supported: true, mobile: false, ...options };
  const handlers = new Map();
  const document = { activeElement: null };
  class Element {
    constructor() {
      this.children = [];
      this.hidden = false;
      this.textContent = "";
      this.listeners = new Map();
      this.classList = { remove() {} };
      this.style = { setProperty(name, value) { this[name] = value; } };
      this.offsetHeight = 280;
    }
    addEventListener(name, fn) { this.listeners.set(name, fn); }
    removeEventListener(name, fn) { if (this.listeners.get(name) === fn) this.listeners.delete(name); }
    click() { if (!this.disabled) this.listeners.get("click")?.(); }
    focus() { document.activeElement = this; }
    appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
    replaceChildren() { this.children.forEach(child => child.parentNode = null); this.children = []; }
    querySelector() { return this.children[0]?.input; }
    replaceWith(replacement) { elements.map = replacement; }
  }
  const ids = ["map", "map-region", "info-overlay", "geocoder-container", "search-status", "map-status", "map-status-message", "map-retry", "share-link"];
  const elements = Object.fromEntries(ids.map(id => [id, new Element()]));
  document.getElementById = id => elements[id];
  document.createElement = () => new Element();
  const observers = [];
  let reloads = 0;
  const window = {
    location: { reload() { reloads++; } },
    matchMedia: () => ({ matches: settings.mobile }),
    addEventListener(name, fn) { handlers.set(name, fn); },
    removeEventListener(name, fn) { if (handlers.get(name) === fn) handlers.delete(name); },
    ResizeObserver: class {
      constructor(callback) { this.callback = callback; this.targets = []; observers.push(this); }
      observe(target) { this.targets.push(target); }
      disconnect() { this.disconnected = true; }
    }
  };
  if (settings.noObserver) delete window.ResizeObserver;
  const maps = [];
  const geocoders = [];
  let constructions = 0;
  let supportChecks = 0;
  class FakeMap {
    constructor(config) {
      constructions++;
      elements.map.appendChild(new Element());
      elements.map.addEventListener("scroll", () => {});
      if (settings.constructorError) throw new Error("GPU context failed");
      this.config = config;
      this.events = new Map();
      this.controls = [];
      this.removals = 0;
      this.resizes = 0;
      maps.push(this);
    }
    on(name, callback) { this.events.set(name, callback); }
    off(name, callback) { if (this.events.get(name) === callback) this.events.delete(name); }
    emit(name) { this.events.get(name)?.(); }
    addControl(control, position) {
      if (settings.controlError) throw new Error("control failed");
      this.controls.push({ control, position });
      if (settings.synchronousError) this.emit("error");
    }
    resize() { this.resizes++; }
    remove() {
      this.removals++;
      if (settings.removeError) throw new Error("teardown failed");
    }
  }
  const mapboxgl = {
    supported() { supportChecks++; if (settings.supportError) throw new Error("probe failed"); return settings.supported; },
    Map: FakeMap,
    NavigationControl: class {},
    ScaleControl: class { setUnit(unit) { this.unit = unit; } },
    GeolocateControl: class {}
  };
  class MapboxGeocoder {
    constructor(config) { this.config = config; this.removals = 0; geocoders.push(this); }
    onAdd(map) {
      this.map = map;
      this.move = () => {};
      map.on("moveend", this.move);
      if (settings.geocoderError) throw new Error("geocoder failed");
      this.element = new Element();
      this.element.input = new Element();
      return this.element;
    }
    onRemove() { this.removals++; this.map?.off("moveend", this.move); }
  }
  const app = createMapApp({ mapboxgl, MapboxGeocoder, accessToken: options.accessToken ?? "test-token", document, window });
  return { app, settings, maps, geocoders, elements, handlers, observers, document, counts: () => ({ constructions, supportChecks, reloads }) };
}

test("canonical URL is shared by X and documented without the retired host", () => {
  assert.equal(SITE_URL, "https://kg-b0mbe.github.io/sharecycle-map/");
  const share = new URL(getShareUrl());
  assert.equal(share.origin + share.pathname, "https://twitter.com/intent/tweet");
  assert.equal(share.searchParams.get("url"), SITE_URL);
  assert.match(share.searchParams.get("text"), /つながれ！シェアサイクルマップ/);
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  assert.ok(readme.includes(SITE_URL));
  assert.ok(!readme.includes("https://keijipoon.github.io/sharecycle-map/"));
});

test("hosted map style, initial location, and Japan-only geocoder configuration are preserved", () => {
  assert.deepEqual(MAP_OPTIONS, { style: "mapbox://styles/keiji/clq3vqvpg00o601re68ogfe9w", center: [139.6917, 35.6895], zoom: 12 });
  assert.equal(GEOCODER_OPTIONS.countries, "jp");
  assert.equal(GEOCODER_OPTIONS.language, "ja");
  assert.equal(GEOCODER_OPTIONS.marker, false);
  assert.equal("country" in GEOCODER_OPTIONS, false);
  const f = fixture();
  assert.equal(f.geocoders[0].config.countries, "jp");
  assert.equal(f.elements["share-link"].href, getShareUrl());
  f.app.dispose();
});

test("unsupported WebGL renders explanatory fallback without constructing a map", () => {
  const f = fixture({ supported: false });
  assert.deepEqual(f.counts(), { constructions: 0, supportChecks: 1, reloads: 0 });
  assert.equal(f.elements["map-status"].hidden, false);
  assert.match(f.elements["map-status-message"].textContent, /WebGL 2/);
  assert.equal(f.elements["map-retry"].hidden, false);
  assert.equal(f.elements["map-retry"].disabled, false);
  assert.equal(f.elements["search-status"].hidden, false);
  assert.equal(f.elements.map.children.length, 0);
  f.app.dispose();
});

test("missing token renders fallback and does not construct a map", () => {
  const f = fixture({ accessToken: "" });
  assert.equal(f.counts().constructions, 0);
  assert.match(f.elements["map-status-message"].textContent, /設定が見つかりません/);
  f.app.dispose();
});

test("an exception from the WebGL probe is guarded", () => {
  const f = fixture({ supportError: true });
  assert.equal(f.counts().constructions, 0);
  assert.match(f.elements["map-status-message"].textContent, /初期化できません/);
  f.app.dispose();
});

test("constructor failure clears partial output and repeated clicks request only one safe page reload", () => {
  const f = fixture({ constructorError: true });
  for (let i = 0; i < 3; i++) f.elements["map-retry"].click();
  assert.equal(f.counts().constructions, 1);
  assert.equal(f.counts().reloads, 1);
  assert.equal(f.elements.map.listeners.size, 0);
  assert.equal(f.elements.map.children.length, 0);
  assert.equal(f.elements["geocoder-container"].children.length, 0);
  assert.match(f.elements["map-status-message"].textContent, /初期化できません/);
  assert.equal(f.handlers.size, 3);
  assert.equal(f.observers.length, 1);
  f.app.dispose();
});

test("control failure retry recovers, and repeated clicks cannot create duplicate maps", () => {
  const f = fixture({ controlError: true });
  f.settings.controlError = false;
  f.elements["map-retry"].focus();
  f.elements["map-retry"].click();
  f.elements["map-retry"].click();
  f.app.retry();
  assert.equal(f.counts().constructions, 2);
  assert.equal(f.maps[1].controls.length, 3);
  assert.equal(f.elements["geocoder-container"].children.length, 1);
  f.maps[1].emit("load");
  assert.equal(f.elements["map-status"].hidden, true);
  assert.equal(f.elements["search-status"].hidden, true);
  assert.equal(f.document.activeElement, f.geocoders[1].element.input);
  assert.equal(f.maps[1].controls[1].control.unit, "metric");
  f.app.retry();
  assert.equal(f.counts().constructions, 2);
  f.app.dispose();
});

test("unsupported WebGL retry reloads to reset the SDK's cached support result", () => {
  const f = fixture({ supported: false });
  f.settings.supported = true;
  f.elements["map-retry"].click();
  f.app.retry();
  assert.equal(f.counts().reloads, 1);
  assert.equal(f.counts().constructions, 0);
  assert.equal(f.elements["map-retry"].textContent, "ページを再読み込み");
  f.app.dispose();
});

for (const failure of ["controlError", "geocoderError"]) {
  test(`${failure} cleans controls and listeners before retry recovery`, () => {
    const f = fixture({ [failure]: true });
    assert.equal(f.maps[0].removals, 1);
    assert.equal(f.maps[0].events.size, 0);
    assert.equal(f.geocoders[0].removals, 1);
    assert.equal(f.elements["geocoder-container"].children.length, 0);
    f.settings[failure] = false;
    f.elements["map-retry"].click();
    f.maps[1].emit("load");
    assert.equal(f.elements["map-status"].hidden, true);
    f.app.dispose();
  });
}

test("startup error tears down once; stale SDK callbacks cannot affect a recovered map", () => {
  const f = fixture();
  const previous = f.maps[0];
  const staleLoad = previous.events.get("load");
  const staleError = previous.events.get("error");
  previous.emit("error");
  staleError();
  assert.equal(previous.removals, 1);
  assert.equal(previous.events.size, 0);
  assert.equal(f.geocoders[0].removals, 1);
  f.app.retry();
  staleLoad();
  assert.equal(f.elements["map-status"].hidden, false);
  staleError();
  assert.equal(f.maps[1].removals, 0);
  f.maps[1].emit("load");
  assert.equal(f.elements["map-status"].hidden, true);
  f.app.dispose();
});

test("a tile error after load does not tear down a usable map", () => {
  const f = fixture();
  f.maps[0].emit("load");
  f.maps[0].emit("error");
  assert.equal(f.maps[0].removals, 0);
  assert.equal(f.elements["map-status"].hidden, true);
  f.app.dispose();
});

test("teardown exceptions do not suppress fallback or leave stale DOM", () => {
  const f = fixture({ removeError: true });
  f.maps[0].emit("error");
  assert.equal(f.elements["map-status"].hidden, false);
  assert.equal(f.elements.map.children.length, 0);
  assert.equal(f.elements["geocoder-container"].children.length, 0);
  f.app.dispose();
});

test("mobile layout reserves the existing explanation panel and responds to resizing", () => {
  const f = fixture({ mobile: true });
  assert.equal(f.elements["map-region"].style["--overlay-height"], "280px");
  f.elements["info-overlay"].offsetHeight = 320;
  f.observers[0].callback();
  assert.equal(f.elements["map-region"].style["--overlay-height"], "320px");
  f.settings.mobile = false;
  f.handlers.get("resize")();
  assert.equal(f.elements["map-region"].style["--overlay-height"], "0px");
  assert.ok(f.maps[0].resizes >= 3);
  f.app.dispose();
});

test("layout also works with no map and no ResizeObserver", () => {
  const f = fixture({ mobile: true, supported: false, noObserver: true });
  f.handlers.get("orientationchange")();
  assert.equal(f.elements["map-region"].style["--overlay-height"], "280px");
  f.app.dispose();
});

test("dispose removes listeners, observer, map, and geocoder exactly once", () => {
  const f = fixture();
  const staleLoad = f.maps[0].events.get("load");
  const staleError = f.maps[0].events.get("error");
  f.app.dispose();
  f.app.dispose();
  staleLoad();
  staleError();
  f.app.retry();
  f.elements["map-retry"].click();
  assert.equal(f.counts().constructions, 1);
  assert.equal(f.maps[0].removals, 1);
  assert.equal(f.geocoders[0].removals, 1);
  assert.equal(f.maps[0].events.size, 0);
  assert.equal(f.handlers.size, 0);
  assert.equal(f.elements["map-retry"].listeners.size, 0);
  assert.equal(f.observers[0].disconnected, true);
  assert.equal(f.elements.map.children.length, 0);
});

test("HTML/CSS layout contract places search in normal flow outside the map controls", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/style.css", import.meta.url), "utf8");
  assert.ok(html.indexOf('id="topbar"') < html.indexOf('id="searchbar"'));
  assert.ok(html.indexOf('id="geocoder-container"') < html.indexOf('id="map-region"'));
  assert.match(css, /body\s*{[^}]*display: flex;[^}]*flex-direction: column;/);
  assert.match(css, /#topbar\s*{[^}]*position: relative;[^}]*flex: 0 0 auto;/);
  assert.match(css, /#searchbar\s*{[^}]*position: relative;[^}]*min-height: 60px;/);
  assert.match(css, /#map-region\s*{[^}]*position: relative;[^}]*flex: 1 1 auto;/);
  assert.match(css, /#map\s*{[^}]*bottom: var\(--overlay-height\);/);
  assert.match(css, /bottom: calc\(var\(--overlay-height\) \+ 10px\);/);
  assert.match(css, /\[hidden\]\s*{\s*display: none !important;/);
  assert.match(html, /id="map-status" aria-live="polite"/);
  assert.ok(!html.includes("https://keijipoon.github.io/sharecycle-map/"));
});

test("a synchronous SDK error stops setup immediately after cleanup", () => {
  const f = fixture({ synchronousError: true });
  assert.equal(f.maps[0].removals, 1);
  assert.equal(f.maps[0].controls.length, 1);
  assert.equal(f.elements["geocoder-container"].children.length, 0);
  assert.equal(f.elements["search-status"].hidden, false);
  assert.equal(f.elements["map-status"].hidden, false);
  f.app.dispose();
});
