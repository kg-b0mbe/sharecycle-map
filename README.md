# つながれ！シェアサイクルマップ / Connect! Share Cycle Map

このリポジトリは、シェアサイクルのポート（ステーション）の位置と、近接ネットワークを可視化する地図プロジェクトです。  
This repository provides a visualization of bikeshare stations and their proximity network.

👉 デモサイト / Demo site: [つながれ！シェアサイクルマップ](https://keijipoon.github.io/sharecycle-map/)

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

---

## 📜 License
- ソースコードは [MIT License](LICENSE) で公開しています。  
- データ利用については各事業者の利用規約に従ってください。  
The source code is released under the [MIT License](LICENSE).  
Please follow the terms of each operator when using their data.
