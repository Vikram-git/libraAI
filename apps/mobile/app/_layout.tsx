import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: "LibraAI" }} />
        <Stack.Screen name="scanner" options={{ title: "Scan ISBN" }} />
        <Stack.Screen name="my-books" options={{ title: "My Books" }} />
      </Stack>
    </>
  );
}
