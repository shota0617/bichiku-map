'use client';

import React, { useState } from "react";
import { db } from "../lib/firebase";
import { addDoc, collection, Timestamp, query, orderBy } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

// あなたのGoogle Maps APIキーに書き換えてください
const GOOGLE_MAPS_API_KEY = "AIzaSyD_f3fUCg9IrFSEVpo70p0EPCZv-l_pOHk";

type RiceStock = {
  shopName: string;
  location: string;
  lat: string;
  lng: string;
  riceType: string;
  price: string;
  stock: string;
  contact: string;
  note: string;
};

export default function Home() {
  const [riceStock, setRiceStock] = useState<RiceStock>({
    shopName: "",
    location: "",
    lat: "",
    lng: "",
    riceType: "",
    price: "",
    stock: "",
    contact: "",
    note: "",
  });
  const [mapCenter, setMapCenter] = useState({ lat: 35.170915, lng: 136.881537 });
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Google Mapsロード
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });
  if (!isLoaded) return <div>地図を読み込み中...</div>;

  // 「現在地に移動」ボタン
  const setToCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("この端末は位置情報取得に対応していません");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLocation({ lat, lng });
        setMapCenter({ lat, lng });
        // 投稿フォームにも自動でセット
        setRiceStock((prev) => ({
          ...prev,
          lat: lat.toString(),
          lng: lng.toString(),
        }));
      },
      () => {
        alert("現在地が取得できませんでした");
      }
    );
  };

  // 地図クリックでピン＋緯度経度セット
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setRiceStock((s) => ({ ...s, lat: lat.toString(), lng: lng.toString() }));
      setMapCenter({ lat, lng });
    }
  };

  // フォーム入力
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRiceStock({ ...riceStock, [e.target.name]: e.target.value });
  };

  // 投稿
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!riceStock.lat || !riceStock.lng) {
      alert("地図クリック or 現在地ボタンで緯度経度を入力してください");
      return;
    }
    await addDoc(collection(db, "rice_stocks"), {
      ...riceStock,
      createdAt: Timestamp.now(),
    });
    alert("投稿しました！");
    setRiceStock({
      shopName: "",
      location: "",
      lat: "",
      lng: "",
      riceType: "",
      price: "",
      stock: "",
      contact: "",
      note: "",
    });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>全国備蓄米販売情報マップ</h1>

      {/* 地図メイン表示（最上部・大きめ） */}
      <div style={styles.mapWrapMain}>
        <GoogleMap
          mapContainerStyle={styles.mapContainerMain}
          center={
            riceStock.lat && riceStock.lng
              ? { lat: parseFloat(riceStock.lat), lng: parseFloat(riceStock.lng) }
              : (currentLocation ? currentLocation : mapCenter)
          }
          zoom={riceStock.lat && riceStock.lng ? 15 : (currentLocation ? 15 : 7)}
          onClick={handleMapClick}
        >
          {/* 現在地ピン（青） */}
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                scaledSize: new google.maps.Size(40, 40)
              }}
            />
          )}
          {/* 投稿しようとしているピン（赤） */}
          {riceStock.lat && riceStock.lng && (
            <Marker
              position={{ lat: parseFloat(riceStock.lat), lng: parseFloat(riceStock.lng) }}
            />
          )}
          {/* Firestoreの全ピン */}
          <MapRiceStocks />
        </GoogleMap>
      </div>

      {/* 投稿フォーム（地図下に表示） */}
      <button onClick={setToCurrentLocation} style={styles.currentBtn}>
        現在地を取得して地図を移動
      </button>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="shopName"
          placeholder="販売者・店舗名"
          value={riceStock.shopName}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="location"
          placeholder="販売場所（市区町村）"
          value={riceStock.location}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            name="lat"
            placeholder="緯度"
            value={riceStock.lat}
            readOnly
            required
            style={{ ...styles.input, flex: 1 }}
          />
          <input
            type="text"
            name="lng"
            placeholder="経度"
            value={riceStock.lng}
            readOnly
            required
            style={{ ...styles.input, flex: 1 }}
          />
          <span style={{ fontSize: 12, marginLeft: 8 }}>地図クリック or 現在地で自動入力</span>
        </div>
        <input
          type="text"
          name="riceType"
          placeholder="品種"
          value={riceStock.riceType}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="price"
          placeholder="価格（例：10kg 3500円）"
          value={riceStock.price}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="stock"
          placeholder="在庫（例：残り20袋）"
          value={riceStock.stock}
          onChange={handleChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="contact"
          placeholder="連絡先"
          value={riceStock.contact}
          onChange={handleChange}
          style={styles.input}
        />
        <textarea
          name="note"
          placeholder="備考"
          value={riceStock.note}
          onChange={handleChange}
          style={{ ...styles.input, minHeight: 60 }}
        />
        <button type="submit" style={styles.button}>備蓄米販売情報を投稿</button>
      </form>

      {/* 一覧 */}
      <h2 style={styles.subtitle}>一覧</h2>
      <ListRiceStocks />
    </div>
  );
}

// 地図にFirestoreのピンを表示（投稿者以外も含めて全て）
function MapRiceStocks() {
  const q = query(collection(db, "rice_stocks"), orderBy("createdAt", "desc"));
  const [snapshots, loading, error] = useCollection(q);

  if (loading) return null;
  if (error) return null;
  if (!snapshots?.docs?.length) return null;

  return (
    <>
      {snapshots.docs.map((doc) => {
        const d = doc.data() as any;
        if (!d.lat || !d.lng) return null;
        return (
          <Marker
            key={doc.id}
            position={{ lat: parseFloat(d.lat), lng: parseFloat(d.lng) }}
            title={`${d.shopName}：${d.riceType} ${d.price}（在庫：${d.stock}）`}
          />
        );
      })}
    </>
  );
}

// 一覧表示
function ListRiceStocks() {
  const q = query(collection(db, "rice_stocks"), orderBy("createdAt", "desc"));
  const [snapshots, loading, error] = useCollection(q);

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;
  if (!snapshots?.docs?.length) return <div>投稿はまだありません。</div>;

  return (
    <div>
      {snapshots.docs.map((doc) => {
        const d = doc.data() as any;
        return (
          <div key={doc.id} style={styles.card}>
            <div style={styles.cardRow}>販売者：{d.shopName}</div>
            <div style={styles.cardRow}>場所：{d.location}</div>
            <div style={styles.cardRow}>品種：{d.riceType}</div>
            <div style={styles.cardRow}>価格：{d.price}</div>
            <div style={styles.cardRow}>在庫：{d.stock}</div>
            <div style={styles.cardRow}>連絡先：{d.contact}</div>
            <div style={styles.cardRow}>備考：{d.note}</div>
          </div>
        );
      })}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { maxWidth: 600, margin: "0 auto", padding: 0, fontFamily: "'Noto Sans JP', sans-serif" },
  title: { fontSize: 24, margin: "12px 0 4px", textAlign: "center", fontWeight: 700, letterSpacing: 2 },
  mapWrapMain: { width: "100vw", maxWidth: "100vw", height: "60vh", minHeight: 320, margin: "0 auto", borderRadius: 0, overflow: "hidden" },
  mapContainerMain: { width: "100%", height: "100%" },
  currentBtn: { margin: "10px 0 0", background: "#0ea5e9", color: "#fff", padding: "8px 18px", border: "none", borderRadius: 5, fontSize: 15, display: "block" },
  form: { background: "#f8fafc", padding: 12, borderRadius: 8, margin: "10px auto 20px", maxWidth: 480 },
  input: { width: "100%", fontSize: 16, padding: 8, marginBottom: 10, borderRadius: 6, border: "1px solid #cbd5e1", background: "#fff" },
  button: { width: "100%", fontSize: 18, padding: "13px 0", borderRadius: 8, background: "#16a34a", color: "#fff", border: "none" },
  subtitle: { fontSize: 18, margin: "18px 0 8px", fontWeight: 600, textAlign: "center" },
  card: { background: "#fff", borderRadius: 12, padding: 14, marginBottom: 22, boxShadow: "0 2px 8px #ddd" },
  cardRow: { fontSize: 15, marginBottom: 4 },
};
