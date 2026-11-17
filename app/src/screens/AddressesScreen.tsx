import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { shared } from "../ui";
import { useAccount } from "../../lib/account";
import { c, serif } from "../../lib/theme";

const FIELDS = [
  { key: "name", label: "Full name", error: "Enter the full name", valid: (v: string) => v.trim().length > 1 },
  { key: "phone", label: "Mobile number", error: "Enter a 10-digit mobile number", valid: (v: string) => /^\d{10}$/.test(v.trim()), numeric: true },
  { key: "addr", label: "House number and street", error: "Enter the house number and street", valid: (v: string) => v.trim().length > 4 },
  { key: "city", label: "City", error: "Enter the city", valid: (v: string) => v.trim().length > 1 },
  { key: "state", label: "State", error: "Enter the state", valid: (v: string) => v.trim().length > 1 },
  { key: "pin", label: "Pincode", error: "Enter a 6-digit pincode", valid: (v: string) => /^\d{6}$/.test(v.trim()), numeric: true },
] as const;
type K = (typeof FIELDS)[number]["key"];
const BLANK: Record<K, string> = { name: "", phone: "", addr: "", city: "", state: "", pin: "" };

export default function AddressesScreen() {
  const { addresses, saveAddress, removeAddress } = useAccount();
  const [v, setV] = useState(BLANK);
  const [tried, setTried] = useState(false);

  const submit = () => {
    setTried(true);
    if (FIELDS.some((f) => !f.valid(v[f.key]))) return;
    saveAddress({ name: v.name.trim(), phone: v.phone.trim(), addr: v.addr.trim(), city: v.city.trim(), state: v.state.trim(), pin: v.pin.trim() });
    setV(BLANK);
    setTried(false);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      {addresses.length === 0 ? <Text style={styles.sub}>No saved addresses yet. Add one below.</Text> : null}
      {addresses.map((a) => (
        <View key={a.id} style={[styles.card, { flexDirection: "row", gap: 10, alignItems: "flex-start" }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.strong}>{a.name} · {a.phone}</Text>
            <Text style={styles.body}>{a.addr}, {a.city}, {a.state}, {a.pin}</Text>
          </View>
          <Pressable onPress={() => removeAddress(a.id)} accessibilityLabel={`Remove address ${a.addr}`} style={{ padding: 8 }}><Text style={{ color: c.danger, fontWeight: "700" }}>Remove</Text></Pressable>
        </View>
      ))}
      <View style={styles.card}>
        <Text style={[serif, styles.h]}>Add an address</Text>
        {FIELDS.map((f) => {
          const bad = tried && !f.valid(v[f.key]);
          return (
            <View key={f.key} style={{ marginTop: 14 }}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput value={v[f.key]} onChangeText={(t) => setV((p) => ({ ...p, [f.key]: t }))} accessibilityLabel={`Address ${f.label}`} keyboardType={"numeric" in f ? "number-pad" : undefined} style={[styles.input, bad && { borderColor: c.danger }]} />
              {bad ? <Text style={styles.err}>{f.error}</Text> : null}
            </View>
          );
        })}
        <Pressable onPress={submit} accessibilityLabel="Save address" style={[shared.btn, { marginTop: 18 }]}><Text style={shared.btnText}>Save address</Text></Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ground },
  card: { padding: 18, backgroundColor: c.white, borderRadius: 20, borderWidth: 1, borderColor: c.line },
  h: { fontSize: 22, color: c.plum },
  strong: { fontSize: 15, fontWeight: "700", color: c.plum },
  body: { fontSize: 14, color: "#4a3340", marginTop: 2 },
  sub: { color: c.muted },
  label: { fontSize: 14, fontWeight: "600", color: c.plum, marginBottom: 6 },
  input: { height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: c.edge, paddingHorizontal: 14, fontSize: 15, color: c.plum },
  err: { marginTop: 6, fontSize: 13, fontWeight: "600", color: c.danger },
});
