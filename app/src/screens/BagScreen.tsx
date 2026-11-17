import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Crop, shared, useNav } from "../ui";
import { sizeText } from "../../lib/products";
import { useCart } from "../../lib/cart";
import { formatPrice } from "../../lib/format";
import { c, serif } from "../../lib/theme";

export default function BagScreen() {
  const nav = useNav();
  const { ready, items, setQty, remove } = useCart();

  if (ready && items.length === 0) {
    return (
      <View style={[styles.screen, styles.empty]}>
        <Text style={[serif, styles.h]}>Your bag is empty</Text>
        <Pressable style={shared.btn} onPress={() => nav.navigate("Browse", { category: "sarees" })}>
          <Text style={shared.btnText}>Browse sarees</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 200 }}>
        <Text style={[serif, styles.h]}>Your bag</Text>
        {items.map((it) => {
          const col = it.product.colours.find((x) => x.name === it.colour) ?? it.product.colours[0];
          return (
            <View key={it.key} style={styles.item}>
              <Crop source={col.image} aspect={col.aspect} w={84} h={108} zoom={1} px={0.5} py={0} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name}>{it.product.name}</Text>
                <Text style={styles.meta}>{[it.colour, sizeText(it.product, it.size)].filter(Boolean).join(" · ")}</Text>
                <Text style={styles.price}>{formatPrice(it.product.price)}</Text>
                <View style={styles.qtyRow}>
                  <Pressable accessibilityLabel={`Decrease quantity of ${it.product.name}`} onPress={() => setQty(it.key, it.qty - 1)} disabled={it.qty <= 1} style={[styles.qtyBtn, it.qty <= 1 && { opacity: 0.4 }]}>
                    <Text style={styles.qtyText}>−</Text>
                  </Pressable>
                  <Text testID="qty" style={styles.qty}>{it.qty}</Text>
                  <Pressable accessibilityLabel={`Increase quantity of ${it.product.name}`} onPress={() => setQty(it.key, it.qty + 1)} style={styles.qtyBtn}>
                    <Text style={styles.qtyText}>+</Text>
                  </Pressable>
                  <Pressable accessibilityLabel={`Remove ${it.product.name}`} onPress={() => remove(it.key)} style={{ marginLeft: "auto", padding: 8 }}>
                    <Text style={{ color: c.danger, fontWeight: "700" }}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
        {/* TODO: subtotal, delivery and total need real prices and delivery rules. */}
        <View style={styles.summary}>
          <View style={styles.line}><Text style={styles.meta}>Subtotal</Text><Text style={styles.name}>₹[SUBTOTAL]</Text></View>
          <View style={styles.line}><Text style={styles.meta}>Delivery</Text><Text style={styles.name}>₹[DELIVERY CHARGE]</Text></View>
          <View style={[styles.line, { borderTopWidth: 1, borderTopColor: c.line, paddingTop: 12 }]}><Text style={styles.name}>Total</Text><Text style={[styles.name, { color: c.brand }]}>₹[TOTAL]</Text></View>
        </View>
      </ScrollView>
      <View style={styles.bar}>
        <Pressable onPress={() => nav.navigate("TryOn")} accessibilityLabel="Try on with AI" style={[shared.btn, { backgroundColor: c.plum }]}>
          <Text style={shared.btnText}>✦ Try on with AI</Text>
        </Pressable>
        <Pressable onPress={() => nav.navigate("Checkout")} accessibilityLabel="Proceed to checkout" style={shared.btn}>
          <Text style={shared.btnText}>Proceed to checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ground },
  empty: { alignItems: "center", justifyContent: "center", gap: 16 },
  h: { fontSize: 30, fontWeight: "500", color: c.plum },
  item: { flexDirection: "row", gap: 14, padding: 14, backgroundColor: c.white, borderRadius: 20, borderWidth: 1, borderColor: c.line },
  name: { fontSize: 15, fontWeight: "700", color: c.plum },
  meta: { fontSize: 13, color: c.muted },
  price: { fontSize: 14, fontWeight: "700", color: c.brand },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  qtyBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: c.edge, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 18, fontWeight: "700", color: c.plum },
  qty: { minWidth: 20, textAlign: "center", fontWeight: "700", color: c.plum },
  summary: { padding: 18, gap: 12, backgroundColor: c.white, borderRadius: 20, borderWidth: 1, borderColor: c.line },
  line: { flexDirection: "row", justifyContent: "space-between" },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 12, paddingHorizontal: 16, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.line, flexDirection: "column", gap: 10 },
});
