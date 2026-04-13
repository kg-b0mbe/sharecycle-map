import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "./style.css";

const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error("Missing VITE_MAPBOX_ACCESS_TOKEN in .env");
}

mapboxgl.accessToken = accessToken;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/keiji/clq3vqvpg00o601re68ogfe9w",
  center: [139.6917, 35.6895],
  zoom: 12
});

const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl,
  marker: false,
  placeholder: "地名・住所で検索",
  language: "ja",
  country: "jp"
});

document.getElementById("geocoder-container").appendChild(geocoder.onAdd(map));

map.addControl(new mapboxgl.NavigationControl(), "top-right");
const scale = new mapboxgl.ScaleControl({ maxWidth: 80, unit: "metric" });
map.addControl(scale, "bottom-left");
map.addControl(new mapboxgl.GeolocateControl({}), "top-right");

map.on("load", () => {
  scale.setUnit("metric");
});

function updateMobileLayout() {
  const mapEl = document.getElementById("map");
  const topbarEl = document.getElementById("topbar");
  const overlayEl = document.getElementById("info-overlay");
  const geocoderContainerEl = document.getElementById("geocoder-container");

  if (!mapEl || !topbarEl || !overlayEl || !geocoderContainerEl) return;

  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  if (isMobile) {
    const topbarHeight = topbarEl.offsetHeight || 0;
    const overlayHeight = overlayEl.offsetHeight || 0;

    mapEl.style.top = `${topbarHeight}px`;
    mapEl.style.bottom = `${overlayHeight}px`;
    mapEl.style.height = "auto";

    geocoderContainerEl.style.top = `${topbarHeight + 10}px`;
    geocoderContainerEl.style.left = "10px";
    geocoderContainerEl.style.right = "10px";
  } else {
    mapEl.style.top = "50px";
    mapEl.style.bottom = "0";
    mapEl.style.height = "calc(100% - 50px)";

    geocoderContainerEl.style.top = "10px";
    geocoderContainerEl.style.right = "70px";
    geocoderContainerEl.style.left = "";
  }

  map.resize();
}

window.addEventListener("load", updateMobileLayout);
window.addEventListener("resize", updateMobileLayout);
window.addEventListener("orientationchange", updateMobileLayout);
