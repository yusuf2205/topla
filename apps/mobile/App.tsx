import React from "react";
import { SafeAreaView, StyleSheet, Text } from "react-native";

/**
 * Каркас мобильного приложения. Экраны из ТЗ §26 (Splash, Onboarding, Login,
 * Home, Catalog, Search, Product, Cart, Checkout, Payment, Orders,
 * Order Details, Favorites, Profile, Notifications, Chat) добавляются на
 * ШАГ 13 (docs/mvp-roadmap.md) через React Navigation.
 */
export default function App(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>TOPLA</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "600" },
});
