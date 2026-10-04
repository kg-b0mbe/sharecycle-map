# つながれ！シェアサイクルマップ / Connect! Share Cycle Map

このリポジトリは、シェアサイクルのポート（ステーション）の位置と、近接ネットワークを可視化する地図プロジェクトです。  
This repository provides a visualization of bikeshare stations and their proximity network.

👉 デモサイト / Demo site: [つながれ！シェアサイクルマップ](https://kg-b0mbe.github.io/sharecycle-map/)

---

## 📸 スクリーンショット / Screenshots

<p align="center">
  <img src="images/tokyo.png" alt="Tokyo" width="45%"><br>
  <sub>東京 / Tokyo</sub>
</p>

<p align="center">
  <img src="images/osaka.png" alt="Osaka" width="45%"><br>
  <sub>大阪 / Osaka</sub>
</p>

<p align="center">
  <img src="images/nagoya.png" alt="Nagoya" width="45%"><br>
  <sub>名古屋 / Nagoya</sub>
</p>

<p align="center">
  <img src="images/okinawa.png" alt="Okinawa" width="45%"><br>
  <sub>沖縄 / Okinawa</sub>
</p>

---


## 🇯🇵 日本語

### 特徴
- シェアサイクル各社のGBFSオープンデータをもとにポートの位置を表示  
- 半径1.5km以内のポート同士を線でつなぎ、移動しやすさの「ネットワーク」を可視化  
- 駐輪台数の大小を色やサイズで表現  

### 利用データ
- [HELLO CYCLING](https://www.hellocycling.jp/)（GBFS API）  
- [ドコモ・バイクシェア](https://docomo-cycle.jp/)（GBFS API）  

### 技術
- [Mapbox GL JS](https://www.mapbox.com/)  
- [OpenStreetMap](https://www.openstreetmap.org/)  

### 開発環境（Vite）
1. 依存関係をインストール  
   `npm install`
2. `.env.example` をコピーして `.env` を作成し、Mapboxトークンを設定  
   `VITE_MAPBOX_ACCESS_TOKEN=...`
3. 開発サーバーを起動  
   `npm run dev`
4. 回帰テストと本番ビルドを確認
   `npm test` / `npm run build`

公開URLと検索設定は `src/config.js` にまとめています。公開URLを変更する場合は、このREADMEのデモリンクも更新してください。
WebGL 2非対応、地図の初期化失敗、トークン未設定の場合は説明と再試行ボタンを表示します。テストはSDKをモックし、通信や位置情報の許可なしで実行します。実際の地図描画はWebGL 2対応ブラウザーと有効なMapboxトークンで別途確認してください。

---

## 🇬🇧 English

### Features
- Displays bikeshare station locations based on GBFS open data  
- Connects stations within a 1.5 km radius to show an accessible cycling network  
- Visualizes the number of docks with color and size  

### Data Sources
- [HELLO CYCLING](https://www.hellocycling.jp/) (GBFS API)  
- [Docomo Bike Share](https://docomo-cycle.jp/) (GBFS API)  

### Technologies
- [Mapbox GL JS](https://www.mapbox.com/)  
- [OpenStreetMap](https://www.openstreetmap.org/)  

### Development (Vite)
1. Install dependencies  
   `npm install`
2. Copy `.env.example` to `.env`, then set your Mapbox token  
   `VITE_MAPBOX_ACCESS_TOKEN=...`
3. Start local server  
   `npm run dev`
4. Run regression tests and the production build
   `npm test` / `npm run build`

The canonical site URL and search options live in `src/config.js`. If the URL changes, also update the demo link in this README.
Unsupported WebGL 2, startup failures, and missing tokens show an explanation and retry button. Tests mock the SDK and require neither network calls nor geolocation permission. Verify actual map rendering separately in a WebGL 2-capable browser with a valid Mapbox token.

---

## 📜 License
- ソースコードは [MIT License](LICENSE) で公開しています。  
- データ利用については各事業者の利用規約に従ってください。  
The source code is released under the [MIT License](LICENSE).  
Please follow the terms of each operator when using their data.
