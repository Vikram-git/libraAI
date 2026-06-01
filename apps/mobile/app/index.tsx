import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export default function Home() {
  const [cachedBooks, setCachedBooks] = useState<unknown[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("cached-catalog").then((data) => {
      if (data) setCachedBooks(JSON.parse(data));
    });
    fetch(`${API_URL}/api/books?limit=6`)
      .then((r) => r.json())
      .then((data) => {
        const books = data.books ?? [];
        setCachedBooks(books);
        AsyncStorage.setItem("cached-catalog", JSON.stringify(books));
      })
      .catch(() => {
        /* offline: use cache */
      });
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>LibraAI</Text>
      <Text style={styles.subtitle}>Smart Library — Mobile</Text>

      <Link href="/scanner" asChild>
        <Pressable style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>📷 Scan Barcode / ISBN</Text>
        </Pressable>
      </Link>

      <Link href="/my-books" asChild>
        <Pressable style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>My Borrowed Books</Text>
        </Pressable>
      </Link>

      <Text style={styles.sectionTitle}>
        {cachedBooks.length ? "Books (cached offline)" : "Loading catalog..."}
      </Text>
      {(cachedBooks as Array<{ id: string; title: string; author: string }>).map((book) => (
        <View key={book.id} style={styles.card}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.bookAuthor}>{book.author}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: "700", color: "#4f46e5" },
  subtitle: { fontSize: 16, color: "#64748b", marginBottom: 24 },
  primaryBtn: {
    backgroundColor: "#4f46e5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: "#4f46e5",
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  secondaryBtnText: { color: "#4f46e5", fontSize: 16, fontWeight: "600", textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  bookTitle: { fontSize: 16, fontWeight: "600" },
  bookAuthor: { fontSize: 14, color: "#64748b", marginTop: 4 },
});
