import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { shared, useNav } from "../ui";
import { useAccount } from "../../lib/account";
import { c, serif } from "../../lib/theme";

export default function AccountScreen() {
  const nav = useNav();
  const { ready, user, login, register, signOut, orders, addresses } = useAccount();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  const errors = {
    name: mode === "up" && name.trim().length < 2 ? "Enter your name" : "",
    email: /^\S+@\S+\.\S+$/.test(email.trim()) ? "" : "Enter a valid email address",
    password: password.length >= 8 ? "" : "Use at least 8 characters",
  };

  const submit = async () => {
    setTried(true);
    setServerError("");
    if (Object.values(errors).some(Boolean) || busy) return;
    setBusy(true);
    const e = email.trim();
    const err = mode === "up" ? await register(name.trim(), e, password) : await login(e, password);
    setBusy(false);
    if (err) setServerError(err);
    else setPassword("");
  };

  if (!ready) return <View style={styles.screen} />;

  if (user) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={styles.card}>
          <Text style={[serif, styles.h]}>Hello, {user.name}</Text>
          <Text style={styles.sub}>{user.email}</Text>
        </View>
        <Pressable style={styles.link} onPress={() => nav.navigate("Orders")} accessibilityLabel="Your orders"><Text style={styles.linkText}>Your orders ({orders.length})</Text><Text style={styles.chev}>›</Text></Pressable>
        <Pressable style={styles.link} onPress={() => nav.navigate("Addresses")} accessibilityLabel="Saved addresses"><Text style={styles.linkText}>Saved addresses ({addresses.length})</Text><Text style={styles.chev}>›</Text></Pressable>
        <Pressable style={[shared.btnGhost, { marginTop: 8 }]} onPress={signOut} accessibilityLabel="Sign out"><Text style={shared.btnGhostText}>Sign out</Text></Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
          {(["in", "up"] as const).map((m) => (
            <Pressable key={m} onPress={() => { setMode(m); setTried(false); }} accessibilityRole="tab" accessibilityState={{ selected: mode === m }} accessibilityLabel={m === "in" ? "Sign in tab" : "Create account tab"} style={[styles.tab, mode === m && styles.tabOn]}>
              <Text style={[styles.tabText, mode === m && { color: c.white }]}>{m === "in" ? "Sign in" : "Create account"}</Text>
            </Pressable>
          ))}
        </View>
        {mode === "up" && <Field label="Full name" value={name} onChange={setName} error={tried ? errors.name : ""} />}
        <Field label="Email" value={email} onChange={setEmail} error={tried ? errors.email : ""} keyboard="email-address" />
        <Field label="Password" value={password} onChange={setPassword} error={tried ? errors.password : ""} secure />
        {serverError ? <Text style={styles.err} accessibilityRole="alert">{serverError}</Text> : null}
        <Pressable onPress={submit} disabled={busy} accessibilityLabel={mode === "in" ? "Sign in" : "Create account"} style={[shared.btn, { marginTop: 18, minHeight: 56 }, busy && { opacity: 0.6 }]}>
          <Text style={shared.btnText}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Field({ label, value, onChange, error, keyboard, secure }: { label: string; value: string; onChange: (v: string) => void; error: string; keyboard?: "email-address"; secure?: boolean }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} accessibilityLabel={label} keyboardType={keyboard} secureTextEntry={secure} autoCapitalize="none" style={[styles.input, !!error && { borderColor: c.danger }]} />
      {error ? <Text style={styles.err} accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ground },
  card: { padding: 20, backgroundColor: c.white, borderRadius: 24, borderWidth: 1, borderColor: c.line },
  h: { fontSize: 26, color: c.plum },
  sub: { color: c.muted, marginTop: 4 },
  link: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 56, paddingHorizontal: 20, backgroundColor: c.white, borderRadius: 18, borderWidth: 1, borderColor: c.line },
  linkText: { fontSize: 15, fontWeight: "700", color: c.plum },
  chev: { fontSize: 24, color: c.muted },
  tab: { flex: 1, minHeight: 44, borderRadius: 22, borderWidth: 1.5, borderColor: c.edge, alignItems: "center", justifyContent: "center" },
  tabOn: { backgroundColor: c.brand, borderColor: c.brand },
  tabText: { fontWeight: "700", fontSize: 14, color: c.plum },
  label: { fontSize: 14, fontWeight: "600", color: c.plum, marginBottom: 6 },
  input: { height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: c.edge, paddingHorizontal: 14, fontSize: 15, color: c.plum },
  err: { marginTop: 6, fontSize: 13, fontWeight: "600", color: c.danger },
});
