import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { shared, useNav } from "../ui";
import { useAccount } from "../../lib/account";
import { apiEnabled } from "../../lib/api";
import { useCart } from "../../lib/cart";
import { sizeText } from "../../lib/products";
import { c, serif } from "../../lib/theme";

type Key = "name" | "phone" | "addr" | "city" | "state" | "pin";
type Field = { key: Key; label: string; placeholder: string; error: string; keyboard?: "number-pad"; valid: (v: string) => boolean };

const FIELDS: Field[] = [
  { key: "name", label: "Full name", placeholder: "As on your ID", error: "Enter your full name", valid: (v) => v.trim().length > 1 },
  { key: "phone", label: "Mobile number", placeholder: "10-digit number", keyboard: "number-pad", error: "Enter a 10-digit mobile number", valid: (v) => /^\d{10}$/.test(v.trim()) },
  { key: "addr", label: "House number and street", placeholder: "Flat, building, street", error: "Enter your house number and street", valid: (v) => v.trim().length > 4 },
  { key: "city", label: "City", placeholder: "", error: "Enter your city", valid: (v) => v.trim().length > 1 },
  { key: "state", label: "State", placeholder: "", error: "Enter your state", valid: (v) => v.trim().length > 1 },
  { key: "pin", label: "Pincode", placeholder: "6-digit pincode", keyboard: "number-pad", error: "Enter a 6-digit pincode", valid: (v) => /^\d{6}$/.test(v.trim()) },
];

// TODO: connect a real payment gateway. These three options are assumptions.
const PAYMENTS = [
  { id: "upi", title: "UPI", sub: "Pay with any UPI app" },
  { id: "card", title: "Credit or debit card", sub: "Visa, Mastercard, RuPay" },
  { id: "cod", title: "Cash on delivery", sub: "Pay when your order arrives" },
] as const;

type Order = { id: string; name: string; phone: string; address: string; payment: string };

export default function CheckoutScreen() {
  const nav = useNav();
  const { ready, items, clear } = useCart();
  const account = useAccount();
  const [saveIt, setSaveIt] = useState(true);
  const [v, setV] = useState<Record<Key, string>>({ name: "", phone: "", addr: "", city: "", state: "", pin: "" });
  const [tried, setTried] = useState(false);
  const [pay, setPay] = useState<(typeof PAYMENTS)[number]["id"]>("upi");
  const [order, setOrder] = useState<Order | null>(null);

  const anyInvalid = FIELDS.some((f) => !f.valid(v[f.key]));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const needEmail = apiEnabled && !account.user;
  const emailBad = needEmail && !/^\S+@\S+\.\S+$/.test(email.trim());

  const submit = async () => {
    setTried(true);
    setError("");
    if (anyInvalid || emailBad || items.length === 0 || busy) return;
    const t = (k: Key) => v[k].trim();
    const address = { name: t("name"), phone: t("phone"), addr: t("addr"), city: t("city"), state: t("state"), pin: t("pin") };
    const payment = PAYMENTS.find((p) => p.id === pay)?.title ?? "";
    setBusy(true);
    const result = await account.placeOrder({
      items: items.map((it) => ({ slug: it.product.slug, colour: it.colour, size: it.size, qty: it.qty, name: it.product.name })),
      address,
      email: needEmail ? email.trim() : undefined,
      method: pay === "cod" ? "cod" : "online",
      paymentLabel: payment,
    });
    setBusy(false);
    if (result.error !== undefined) {
      setError(result.error);
      return;
    }
    if (account.user && saveIt) account.saveAddress(address);
    setOrder({ id: result.id, name: address.name, phone: address.phone, address: [address.addr, address.city, address.state, address.pin].join(", "), payment });
    clear();
  };

  if (order) {
    return (
      <View style={[styles.screen, { alignItems: "center", justifyContent: "center", padding: 24, gap: 14 }]}>
        <View style={styles.tick}><Text style={{ color: c.white, fontSize: 36 }}>✓</Text></View>
        <Text style={[serif, styles.h]} accessibilityRole="header">Order placed</Text>
        <Text style={styles.body}>Thank you, {order.name.split(/\s+/)[0]}. Your sarees are on the way to the address below.</Text>
        <View style={styles.receipt}>
          <Text style={styles.strong}>Order number: {order.id}</Text>
          <Text style={styles.body}>{order.name}, {order.phone}</Text>
          <Text style={styles.body}>{order.address}</Text>
          <Text style={styles.body}>Payment: {order.payment}</Text>
        </View>
        <Pressable style={shared.btn} onPress={() => nav.navigate("Orders")}><Text style={shared.btnText}>View my orders</Text></Pressable>
      </View>
    );
  }

  if (ready && items.length === 0) {
    return (
      <View style={[styles.screen, { alignItems: "center", justifyContent: "center", gap: 16 }]}>
        <Text style={[serif, styles.h]}>Your bag is empty</Text>
        <Pressable style={shared.btn} onPress={() => nav.navigate("Browse", { category: "sarees" })}><Text style={shared.btnText}>Browse sarees</Text></Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={[serif, styles.h2]}>Delivery address</Text>
          {account.addresses.length > 0 && (
            <View style={{ marginTop: 12, gap: 8 }}>
              <Text style={styles.label}>Use a saved address</Text>
              {account.addresses.map((a) => (
                <Pressable key={a.id} accessibilityLabel={`Use saved address ${a.addr}`} onPress={() => setV({ name: a.name, phone: a.phone, addr: a.addr, city: a.city, state: a.state, pin: a.pin })} style={styles.saved}>
                  <Text style={styles.strong}>{a.name}</Text>
                  <Text style={styles.sub}>{a.addr}, {a.city} {a.pin}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {FIELDS.map((f) => {
            const bad = tried && !f.valid(v[f.key]);
            return (
              <View key={f.key} style={{ marginTop: 14 }}>
                <Text style={styles.label}>{f.label}</Text>
                <TextInput
                  value={v[f.key]}
                  onChangeText={(t) => setV((p) => ({ ...p, [f.key]: t }))}
                  placeholder={f.placeholder}
                  placeholderTextColor="#a8949d"
                  keyboardType={f.keyboard}
                  accessibilityLabel={f.label}
                  style={[styles.input, bad && { borderColor: c.danger }]}
                />
                {bad ? <Text style={styles.err} accessibilityRole="alert">{f.error}</Text> : null}
              </View>
            );
          })}
          {account.user && (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <Text style={styles.label}>Save this address to my account</Text>
              <Switch value={saveIt} onValueChange={setSaveIt} accessibilityLabel="Save this address to my account" trackColor={{ true: c.brand }} />
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={[serif, styles.h2]}>Payment</Text>
          <View style={{ gap: 10, marginTop: 12 }}>
            {PAYMENTS.map((o) => (
              <Pressable key={o.id} onPress={() => setPay(o.id)} accessibilityRole="radio" accessibilityState={{ selected: pay === o.id }} accessibilityLabel={`${o.title}. ${o.sub}`} style={[styles.pay, pay === o.id && styles.payOn]}>
                <View style={[styles.radio, pay === o.id && { borderColor: c.brand }]}>{pay === o.id ? <View style={styles.dot} /> : null}</View>
                <View>
                  <Text style={styles.strong}>{o.title}</Text>
                  <Text style={styles.sub}>{o.sub}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[serif, styles.h2]}>Order summary</Text>
          {items.map((it) => (
            <View key={it.key} style={styles.row}>
              <Text style={[styles.body, { flex: 1 }]}>{[it.product.name, sizeText(it.product, it.size), `Qty ${it.qty}`].filter(Boolean).join(" · ")}</Text>
              <Text style={styles.strong}>₹[PRICE]</Text>
            </View>
          ))}
          {/* TODO: subtotal, delivery and total need real prices and delivery rules. */}
          <View style={styles.row}><Text style={styles.sub}>Subtotal</Text><Text style={styles.strong}>₹[SUBTOTAL]</Text></View>
          <View style={styles.row}><Text style={styles.sub}>Delivery</Text><Text style={styles.strong}>₹[DELIVERY CHARGE]</Text></View>
          <View style={styles.row}><Text style={styles.strong}>Total</Text><Text style={[styles.strong, { color: c.brand }]}>₹[TOTAL]</Text></View>
        </View>

        {needEmail ? (
          <View style={styles.card}>
            <Text style={styles.strong}>Email for your order updates</Text>
            <TextInput value={email} onChangeText={setEmail} accessibilityLabel="Email for your order updates" keyboardType="email-address" autoCapitalize="none" style={[styles.input, tried && emailBad && { borderColor: c.danger }]} />
            {tried && emailBad ? <Text style={{ color: c.danger, fontSize: 13, fontWeight: "600" }} accessibilityRole="alert">Enter a valid email address</Text> : null}
          </View>
        ) : null}
        {tried && anyInvalid ? <Text style={styles.banner} accessibilityRole="alert">Please fix the fields marked above.</Text> : null}
        {error ? <Text style={styles.banner} accessibilityRole="alert">{error}</Text> : null}
        <Pressable onPress={submit} disabled={busy} accessibilityLabel="Place order" style={[shared.btn, { minHeight: 56 }, busy && { opacity: 0.6 }]}>
          <Text style={shared.btnText}>{busy ? "Placing your order…" : "Place order"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ground },
  card: { padding: 20, backgroundColor: c.white, borderRadius: 24, borderWidth: 1, borderColor: c.line },
  h: { fontSize: 32, fontWeight: "500", color: c.plum },
  h2: { fontSize: 22, fontWeight: "500", color: c.plum },
  label: { fontSize: 14, fontWeight: "600", color: c.plum, marginBottom: 6 },
  input: { height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: c.edge, paddingHorizontal: 14, fontSize: 15, color: c.plum, backgroundColor: c.white },
  err: { marginTop: 6, fontSize: 13, fontWeight: "600", color: c.danger },
  pay: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, minHeight: 64, borderRadius: 16, borderWidth: 1.5, borderColor: c.edge },
  payOn: { borderColor: c.brand, backgroundColor: c.blush },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.edge, alignItems: "center", justifyContent: "center" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.brand },
  strong: { fontSize: 15, fontWeight: "700", color: c.plum },
  sub: { fontSize: 13, color: c.muted },
  body: { fontSize: 15, lineHeight: 22, color: "#4a3340" },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, gap: 8 },
  banner: { padding: 12, borderRadius: 12, backgroundColor: "#fdecef", color: "#8c0f2f", fontWeight: "600" },
  tick: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.brand, alignItems: "center", justifyContent: "center" },
  saved: { padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: c.edge },
  receipt: { width: "100%", padding: 18, gap: 4, backgroundColor: c.white, borderRadius: 18, borderWidth: 1, borderColor: c.line },
});
