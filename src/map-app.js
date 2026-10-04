import { GEOCODER_OPTIONS, MAP_OPTIONS, getShareUrl } from "./config.js";

// Keep SDK construction separate so startup/retry can be tested without WebGL,
// a Mapbox token, or network requests.
export function createMapApp({ mapboxgl, MapboxGeocoder, accessToken, document, window }) {
  let mapEl = document.getElementById("map");
  const region = document.getElementById("map-region");
  const overlay = document.getElementById("info-overlay");
  const geocoderContainer = document.getElementById("geocoder-container");
  const searchStatus = document.getElementById("search-status");
  const status = document.getElementById("map-status");
  const message = document.getElementById("map-status-message");
  const retry = document.getElementById("map-retry");
  document.getElementById("share-link").href = getShareUrl();

  let active = null;
  let starting = false;
  let disposed = false;
  let retryWithReload = false;
  let reloading = false;

  function updateLayout() {
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    region.style.setProperty("--overlay-height", `${mobile ? overlay.offsetHeight : 0}px`);
    active?.map?.resize();
  }

  function cleanUp(attempt) {
    if (active === attempt) active = null;
    if (attempt?.map) {
      if (attempt.onLoad) attempt.map.off("load", attempt.onLoad);
      if (attempt.onError) attempt.map.off("error", attempt.onError);
    }
    // Geocoder is mounted outside Mapbox's control containers, so Map.remove()
    // alone does not detach its moveend listener.
    try {
      attempt?.geocoder?.onRemove();
    } catch {
      // An SDK setup failure may leave only a partially constructed control.
    }
    try {
      attempt?.map?.remove();
    } catch {
      // Continue clearing partial SDK output even if SDK teardown fails.
    } finally {
      geocoderContainer.replaceChildren();
      // Mapbox can attach DOM listeners before its constructor throws, leaving
      // no instance to remove(). Discard that container as well as its children.
      const freshContainer = document.createElement("div");
      freshContainer.id = "map";
      mapEl.replaceWith(freshContainer);
      mapEl = freshContainer;
    }
  }

  function fail(attempt, text, requiresReload = false) {
    if (disposed || active !== attempt) return;
    cleanUp(attempt);
    retryWithReload = requiresReload;
    retry.textContent = requiresReload ? "ページを再読み込み" : "再試行";
    message.textContent = text;
    status.hidden = false;
    retry.hidden = false;
    retry.disabled = false;
    geocoderContainer.hidden = true;
    searchStatus.textContent = "地図を表示できないため、検索は利用できません。";
    searchStatus.hidden = false;
    updateLayout();
    if (attempt.fromRetry) retry.focus();
  }

  function start() {
    // A double click or an old retry callback must never create a second map.
    if (disposed || starting || active || reloading) return;
    // supported() caches its WebGL result. Also, a throwing Map constructor may
    // have installed global SDK listeners before returning an instance. A full
    // reload safely resets both; never accumulate failed partial map instances.
    if (retryWithReload) {
      reloading = true;
      retry.disabled = true;
      window.location.reload();
      return;
    }
    starting = true;
    const attempt = { fromRetry: document.activeElement === retry };
    active = attempt;
    retry.disabled = true;
    retry.hidden = true;
    message.textContent = "地図を読み込んでいます…";
    status.hidden = false;
    geocoderContainer.hidden = true;
    searchStatus.textContent = "検索を準備しています…";
    searchStatus.hidden = false;

    try {
      if (!mapboxgl.supported()) {
        fail(attempt, "このブラウザーでは地図の描画に必要な WebGL 2 を利用できません。対応ブラウザーやハードウェアアクセラレーションの設定を確認し、ページを再読み込みしてください。", true);
        return;
      }
      if (!accessToken) {
        fail(attempt, "地図の設定が見つかりません。時間をおいて再読み込みするか、サイトの管理者にお知らせください。", true);
        return;
      }

      mapboxgl.accessToken = accessToken;
      attempt.map = new mapboxgl.Map({ container: mapEl, ...MAP_OPTIONS });
      const map = attempt.map;
      const scale = new mapboxgl.ScaleControl({ maxWidth: 80, unit: "metric" });
      attempt.onLoad = () => {
        if (disposed || active !== attempt) return;
        attempt.loaded = true;
        scale.setUnit("metric");
        status.hidden = true;
        updateLayout();
        if (attempt.fromRetry) geocoderContainer.querySelector("input")?.focus();
      };
      attempt.onError = () => {
        // A later failed tile must not tear down an otherwise usable map.
        if (!attempt.loaded) fail(attempt, "地図を読み込めませんでした。通信環境をご確認のうえ、再試行してください。");
      };
      map.on("load", attempt.onLoad);
      map.on("error", attempt.onError);
      attempt.geocoder = new MapboxGeocoder({ accessToken, mapboxgl, ...GEOCODER_OPTIONS });
      const geocoderElement = attempt.geocoder.onAdd(map);
      if (active !== attempt) return;
      geocoderContainer.appendChild(geocoderElement);
      geocoderContainer.hidden = false;
      searchStatus.hidden = true;
      map.addControl(new mapboxgl.NavigationControl(), "top-right");
      if (active !== attempt) return;
      map.addControl(scale, "bottom-left");
      if (active !== attempt) return;
      map.addControl(new mapboxgl.GeolocateControl({}), "top-right");
      if (active !== attempt) return;
      updateLayout();
    } catch {
      fail(attempt, "地図を初期化できませんでした。ブラウザーの設定や通信環境をご確認のうえ、再試行してください。", !attempt.map);
    } finally {
      starting = false;
    }
  }

  retry.addEventListener("click", start);
  const layoutEvents = ["load", "resize", "orientationchange"];
  layoutEvents.forEach((event) => window.addEventListener(event, updateLayout));
  const observer = window.ResizeObserver ? new window.ResizeObserver(updateLayout) : null;
  observer?.observe(region);
  observer?.observe(overlay);
  updateLayout();
  start();

  return {
    retry: start,
    dispose() {
      if (disposed) return;
      disposed = true;
      retry.removeEventListener("click", start);
      layoutEvents.forEach((event) => window.removeEventListener(event, updateLayout));
      observer?.disconnect();
      cleanUp(active);
    }
  };
}
