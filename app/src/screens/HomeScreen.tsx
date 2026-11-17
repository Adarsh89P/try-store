import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { shared, useNav } from "../ui";
import { c, serif } from "../../lib/theme";
import { formatPrice } from "../../lib/format";
import { CATEGORIES, productsIn } from "../../lib/products";

export default function HomeScreen() {
  const nav = useNav();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.ground }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>NEW ARRIVALS</Text>
        <Text style={[serif, styles.title]}>Find your saree without ever going back.</Text>
        <Text style={styles.sub}>Swipe sideways to browse. The details change as you go.</Text>
        <Pressable accessibilityLabel="Shop sarees" onPress={() => nav.navigate("Browse", { category: "sarees" })} style={[shared.btn, { alignSelf: "flex-start", marginTop: 8 }]}>
          <Text style={shared.btnText}>Shop sarees</Text>
        </Pressable>
      </View>

      <Text style={[serif, styles.h]}>Shop by category</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <Pressable key={cat.id} accessibilityLabel={`Browse ${cat.label}`} onPress={() => nav.navigate("Browse", { category: cat.id })} style={[styles.tile, { backgroundColor: cat.tint }]}>
            <Text style={[serif, styles.tileText]}>{cat.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[serif, styles.h]}>Trending sarees</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {productsIn("sarees").map((p) => (
          <Pressable key={p.slug} onPress={() => nav.navigate("Browse", { category: "sarees", slug: p.slug })} style={styles.rail}>
            <Image source={p.colours[0].image} resizeMode={p.colours[0].fit} style={styles.railImg} />
            <Text style={styles.railName} numberOfLines={1}>{p.name}</Text>
            <Text style={styles.railPrice}>{formatPrice(p.price)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* TODO: contact details, address and policies. */}
      <Text style={styles.footer}>[YOUR STORE] · [PHONE] · [EMAIL]</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { margin: 16, padding: 24, gap: 10, backgroundColor: c.blush, borderRadius: 28 },
  eyebrow: { fontSize: 12, fontWeight: "800", letterSpacing: 1.2, color: c.brand },
  title: { fontSize: 34, lineHeight: 40, fontWeight: "500", color: c.plum },
  sub: { fontSize: 15, lineHeight: 22, color: "#4a3340" },
  h: { fontSize: 24, fontWeight: "500", color: c.plum, marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16 },
  tile: { width: "47.5%", height: 84, borderRadius: 20, backgroundColor: c.white, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" },
  tileText: { fontSize: 17, color: c.plum },
  note: { marginHorizontal: 16, marginTop: 10, color: c.muted, fontSize: 14 },
  rail: { width: 150 },
  railImg: { width: 150, height: 210, borderRadius: 16, backgroundColor: c.white },
  railName: { marginTop: 8, fontWeight: "700", color: c.plum, fontSize: 14 },
  railPrice: { color: c.brand, fontWeight: "700", fontSize: 13 },
  footer: { textAlign: "center", color: c.muted, marginTop: 28, fontSize: 13 },
});
