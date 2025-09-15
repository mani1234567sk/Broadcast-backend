import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="matches" />
      <Stack.Screen name="leagues" />
      <Stack.Screen name="videos" />
      <Stack.Screen name="highlights" />
      <Stack.Screen name="featured" />
    </Stack>
  );
}