import { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookInfo, setBookInfo] = useState<{
    title?: string;
    author?: string;
    isbn?: string;
  } | null>(null);

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Camera permission required for barcode scanning</Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  async function handleScan({ data }: { data: string }) {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    const isbn = data.replace(/[^\dX]/gi, "");
    try {
      const res = await fetch(`${API_URL}/api/isbn/${isbn}`);
      if (res.ok) {
        const info = await res.json();
        setBookInfo(info);
      } else {
        setBookInfo({ isbn, title: "Book not found in Open Library" });
      }
    } catch {
      setBookInfo({ isbn, title: "Offline — ISBN saved", author: "Connect to sync" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {!bookInfo ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "qr"] }}
          onBarcodeScanned={scanned ? undefined : handleScan}
        />
      ) : (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>{bookInfo.title}</Text>
          {bookInfo.author && <Text style={styles.resultAuthor}>{bookInfo.author}</Text>}
          {bookInfo.isbn && <Text style={styles.isbn}>ISBN: {bookInfo.isbn}</Text>}
          <Text style={styles.hint}>Book details auto-filled — issue via librarian dashboard</Text>
          <Pressable
            style={styles.btn}
            onPress={() => {
              setBookInfo(null);
              setScanned(false);
            }}
          >
            <Text style={styles.btnText}>Scan Another</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.btnOutline]} onPress={() => router.back()}>
            <Text style={[styles.btnText, styles.btnOutlineText]}>Done</Text>
          </Pressable>
        </View>
      )}
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Looking up ISBN...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  message: { textAlign: "center", marginBottom: 16, fontSize: 16 },
  result: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#f8fafc" },
  resultTitle: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  resultAuthor: { fontSize: 18, color: "#64748b", marginBottom: 8 },
  isbn: { fontSize: 14, color: "#94a3b8", marginBottom: 16 },
  hint: { fontSize: 14, color: "#64748b", marginBottom: 24 },
  btn: { backgroundColor: "#4f46e5", padding: 16, borderRadius: 12, marginBottom: 12 },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  btnOutline: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#4f46e5" },
  btnOutlineText: { color: "#4f46e5" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayText: { color: "#fff", marginTop: 12 },
});
