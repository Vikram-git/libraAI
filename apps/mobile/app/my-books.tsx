import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

interface Borrow {
  id: string;
  dueDate: string;
  status: string;
  book: { title: string; author: string };
}

export default function MyBooks() {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = await AsyncStorage.getItem("libraai-token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/borrows/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const active = (data as Borrow[]).filter((b) => b.status !== "RETURNED");
        setBorrows(active);
        await AsyncStorage.setItem("cached-borrows", JSON.stringify(active));
      } catch {
        const cached = await AsyncStorage.getItem("cached-borrows");
        if (cached) setBorrows(JSON.parse(cached));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4f46e5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {borrows.length === 0 ? (
        <Text style={styles.empty}>No active borrows. Login on web to sync.</Text>
      ) : (
        borrows.map((b) => (
          <View key={b.id} style={styles.card}>
            <Text style={styles.title}>{b.book.title}</Text>
            <Text style={styles.author}>{b.book.author}</Text>
            <Text style={styles.due}>Due: {new Date(b.dueDate).toLocaleDateString()}</Text>
            <Text style={[styles.badge, b.status === "OVERDUE" && styles.overdue]}>{b.status}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: "#64748b", marginTop: 40 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  title: { fontSize: 16, fontWeight: "600" },
  author: { color: "#64748b", marginTop: 4 },
  due: { marginTop: 8, fontSize: 14 },
  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#dcfce7",
    color: "#166534",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
    overflow: "hidden",
  },
  overdue: { backgroundColor: "#fee2e2", color: "#991b1b" },
});
