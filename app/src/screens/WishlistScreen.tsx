import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { TileGrid, shared, useNav } from "../ui";
import { useWishlist } from "../../lib/wishlist";
import { c, serif } from "../../lib/theme";

export default function WishlistScreen() {
  const nav = useNav();
  const { ready, items } = useWishlist();
  if (ready && items.length === 0) {
    return (
      <View style={[styles.screen, { alignItems: "center", justifyContent: "center", gap: 14, padding: 24 }]}>
        <Text style={[serif, styles.h]}>Nothing saved yet</Text>
        <Text style={styles.sub}>Tap the heart on any product to keep it here for later.</Text>
        <Pressable style={shared.btn} onPress={() => nav.navigate("Browse", { category: "sarees" })}><Text style={shared.btnText}>Browse sarees</Text></Pressable>
      </View>
    );
  }
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      <Text style={[serif, styles.h]}>Your wishlist</Text>
      <TileGrid products={items} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ground },
  h: { fontSize: 30, color: c.plum },
  sub: { color: c.muted, textAlign: "center", fontSize: 15 },
});
