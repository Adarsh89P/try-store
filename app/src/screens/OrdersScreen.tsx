import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { shared, useNav } from "../ui";
import { useAccount } from "../../lib/account";
import { c, serif } from "../../lib/theme";

export default function OrdersScreen() {
  const nav = useNav();
  const { ready, orders } = useAccount();
  if (ready && orders.length === 0) {
    return (
      <View style={[styles.screen, { alignItems: "center", justifyContent: "center", gap: 14 }]}>
        <Text style={[serif, styles.h]}>No orders yet</Text>
        <Pressable style={shared.btn} onPress={() => nav.navigate("Browse", { category: "sarees" })}><Text style={shared.btnText}>Browse sarees</Text></Pressable>
      </View>
    );
  }
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 14 }}>
      {orders.map((o) => (
        <View key={o.id} style={styles.card}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={styles.strong}>Order {o.id}</Text>
            <Text style={styles.badge}>{o.status}</Text>
          </View>
          <Text style={styles.sub}>{new Date(o.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</Text>
          {o.items.map((it, i) => (
            <Text key={i} style={styles.body}>{it.name} · {it.colour} · {it.size} · Qty {it.qty}</Text>
          ))}
          <Text style={styles.sub}>Deliver to {o.name}, {o.address} · {o.payment}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ground },
  h: { fontSize: 28, color: c.plum },
  card: { padding: 18, gap: 6, backgroundColor: c.white, borderRadius: 20, borderWidth: 1, borderColor: c.line },
  strong: { fontSize: 15, fontWeight: "700", color: c.plum },
  badge: { fontSize: 12, fontWeight: "700", color: c.brandDark, backgroundColor: c.blush, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, overflow: "hidden" },
  sub: { fontSize: 13, color: c.muted },
  body: { fontSize: 14, color: "#4a3340" },
});
