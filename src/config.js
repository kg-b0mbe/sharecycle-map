export const SITE_URL = "https://kg-b0mbe.github.io/sharecycle-map/";

export const MAP_OPTIONS = {
  style: "mapbox://styles/keiji/clq3vqvpg00o601re68ogfe9w",
  center: [139.6917, 35.6895],
  zoom: 12
};

export const GEOCODER_OPTIONS = {
  marker: false,
  placeholder: "地名・住所で検索",
  language: "ja",
  countries: "jp"
};

export function getShareUrl() {
  const url = new URL("https://twitter.com/intent/tweet");
  url.searchParams.set("text", "『🚲 つながれ！シェアサイクルマップ』\n\n・自転車で行き来しやすい“ネットワーク”としてのつながりを表現しました。\n");
  url.searchParams.set("url", SITE_URL);
  return url.href;
}
