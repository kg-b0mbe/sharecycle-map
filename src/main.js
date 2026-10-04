import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "./style.css";
import { createMapApp } from "./map-app.js";

const app = createMapApp({
  mapboxgl,
  MapboxGeocoder,
  accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
  document,
  window
});

if (import.meta.hot) import.meta.hot.dispose(() => app.dispose());
