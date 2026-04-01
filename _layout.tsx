// app/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Sembunyikan header default
        animation: 'fade',  // Animasi smooth bila tukar skrin
      }}
    />
  );
}
