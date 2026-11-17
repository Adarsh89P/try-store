import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Chip, TileGrid } from "../ui";
import { c, serif } from "../../lib/theme";
import { CATEGORIES, products, type CategoryId } from "../../lib/products";

export default function SearchScreen() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [colour, setColour] = useState("");
  const [size, setSize] = useState("");

  const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = useMemo(
    () =>
      tokens.length === 0
        ? []
        : products.filter((p) => {
            const hay = [p.name, p.blurb, CATEGORIES.find((x) => x.id === p.category)?.label, ...p.colours.map((x) => x.name)].join(" ").toLowerCase();
            return tokens.every((t) => hay.includes(t));
          }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q],
  );
  const catIds = new Set(matches.map((p) => p.category));
  const colours = [...new Set(matches.flatMap((p) => p.colours.map((x) => x.name)))];
  const sizes = [...new Set(matches.flatMap((p) => CATEGORIES.find((x) => x.id === p.category)?.sizes ?? []))];
  const shown = matches.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (!colour || p.colours.some((x) => x.name === colour)) &&
      (!size || (CATEGORIES.find((x) => x.id === p.category)?.sizes.includes(size) && !p.unavailableSizes.includes(size))),
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <TextInput value={q} onChangeText={setQ} placeholder="Search sarees, dresses, earrings" placeholderTextColor={c.muted} accessibilityLabel="Search" returnKeyType="search" autoCorrect={false} style={styles.input} />
      {tokens.length === 0 ? (
        <Text style={styles.hint}>Type to find sarees, dresses, earrings and more.</Text>
      ) : (
        <>
          <Text style={styles.hint} accessibilityLiveRegion="polite">{shown.length} {shown.length === 1 ? "product" : "products"}</Text>
          {matches.length > 0 && (
            <View style={{ gap: 10 }}>
              <Row label="Category">
                <Chip label="All" on={category === "all"} onPress={() => setCategory("all")} />
                {CATEGORIES.filter((x) => catIds.has(x.id)).map((x) => <Chip key={x.id} label={x.label} on={category === x.id} onPress={() => setCategory(x.id)} />)}
              </Row>
              <Row label="Colour">
                <Chip label="Any" on={colour === ""} onPress={() => setColour("")} />
                {colours.map((n) => <Chip key={n} label={n} on={colour === n} onPress={() => setColour(n)} />)}
              </Row>
              {sizes.length > 0 && (
                <Row label="Size in stock">
                  <Chip label="Any" on={size === ""} onPress={() => setSize("")} />
                  {sizes.map((n) => <Chip key={n} label={n} on={size === n} onPress={() => setSize(n)} />)}
                </Row>
              )}
            </View>
          )}
          {shown.length === 0 ? <Text style={[serif, styles.empty]}>No products found</Text> : <TileGrid products={shown} />}
        </>
      )}
    </ScrollView>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ground },
  input: { height: 48, borderRadius: 24, backgroundColor: c.blush, paddingHorizontal: 20, fontSize: 15, color: c.plum },
  hint: { color: c.muted, fontSize: 14 },
  rowLabel: { fontSize: 12, fontWeight: "700", color: c.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  empty: { fontSize: 24, color: c.plum, textAlign: "center", marginTop: 24 },
});
