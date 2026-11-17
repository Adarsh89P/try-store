import { useRoute } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Gallery from "../Gallery";
import { Crop, Swatch, shared, useNav } from "../ui";
import { useCart } from "../../lib/cart";
import { formatPrice } from "../../lib/format";
import { c, serif } from "../../lib/theme";
import { useWishlist } from "../../lib/wishlist";
import { THUMB_VIEWS, firstAvailableSize, getCategory, productsIn, type CategoryId, type Size } from "../../lib/products";

export default function BrowseScreen() {
  const nav = useNav();
  const route = useRoute();
  const { category: categoryId = "sarees", slug } = (route.params ?? {}) as { category?: CategoryId; slug?: string };
  const category = getCategory(categoryId)!;
  const products = useMemo(() => productsIn(category.id), [category.id]);
  const startIndex = Math.max(0, products.findIndex((x) => x.slug === slug));
  const { add } = useCart();
  const wishlist = useWishlist();
  const [active, setActive] = useState(startIndex);
  const [colourIndex, setColourIndex] = useState<Record<string, number>>({});
  const [sizeBy, setSizeBy] = useState<Record<string, Size>>({});
  const [added, setAdded] = useState(false);

  const p = products[active];
  const colour = p.colours[colourIndex[p.slug] ?? 0];
  const size = sizeBy[p.slug] ?? firstAvailableSize(p);

  // The "Added" state belongs to one saree and size; reset it when either changes.
  useEffect(() => setAdded(false), [active, size]);

  const addToBag = () => {
    add({ slug: p.slug, colour: colour.name, size });
    setAdded(true);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.crumb}>
          {category.label} · <Text style={{ fontWeight: "700", color: c.plum }}>{active + 1} of {products.length}</Text>
        </Text>

        <Gallery products={products} colourIndex={colourIndex} onActiveChange={setActive} startIndex={startIndex} />

        <View style={styles.panel} accessibilityLiveRegion="polite">
          <Text style={[serif, styles.title]} accessibilityRole="header" testID="product-title">{p.name}</Text>
          <Text style={styles.price}>{formatPrice(p.price)}</Text>

          <Text style={styles.label}>Colour: <Text style={styles.value}>{colour.name}</Text></Text>
          <View style={styles.row}>
            {p.colours.map((col, i) => (
              <Pressable key={col.name} onPress={() => setColourIndex((s) => ({ ...s, [p.slug]: i }))} accessibilityLabel={`Colour ${col.name}`} style={[styles.swatchWrap, i === (colourIndex[p.slug] ?? 0) && styles.swatchOn]}>
                <Swatch colors={col.swatch} />
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Photos of this {category.noun}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {THUMB_VIEWS.map((v) => (
              <View key={v.label} style={{ alignItems: "center", gap: 4 }}>
                <Crop source={colour.image} aspect={colour.aspect} w={72} h={92} zoom={v.zoom} px={v.px} py={v.py} />
                <Text style={styles.thumbLabel}>{v.label}</Text>
              </View>
            ))}
          </ScrollView>

          {category.sizeLabel ? (
            <>
          <Text style={styles.label}>{category.sizeLabel}</Text>
          <View style={[styles.row, { flexWrap: "wrap" }]}>
            {category.sizes.map((s) => {
              const out = p.unavailableSizes.includes(s);
              const on = s === size;
              return (
                <Pressable key={s} disabled={out} onPress={() => setSizeBy((m) => ({ ...m, [p.slug]: s }))} accessibilityLabel={out ? `Size ${s}, out of stock` : `Size ${s}`} style={[styles.size, on && styles.sizeOn, out && styles.sizeOut]}>
                  <Text style={[styles.sizeText, on && { color: c.white }, out && { textDecorationLine: "line-through" }]}>{s}</Text>
                </Pressable>
              );
            })}
          </View>
            </>
          ) : null}

          <Text style={styles.label}>Description</Text>
          <Text style={styles.desc}>{p.blurb}</Text>
        </View>
      </ScrollView>

      <View style={styles.bar}>
        <Pressable onPress={() => wishlist.toggle(p.slug)} accessibilityLabel={wishlist.has(p.slug) ? "Remove from wishlist" : "Add to wishlist"} style={styles.heart}>
          <Text style={{ fontSize: 22, color: c.brand }}>{wishlist.has(p.slug) ? "♥" : "♡"}</Text>
        </Pressable>
        {added ? (
          <Pressable onPress={() => nav.navigate("Tabs", { screen: "Bag" })} accessibilityLabel="View bag" style={[shared.btn, { flex: 1, backgroundColor: c.plum }]}>
            <Text style={shared.btnText}>✓ Added · View bag</Text>
          </Pressable>
        ) : (
          <Pressable onPress={addToBag} accessibilityLabel="Add to bag" style={[shared.btn, { flex: 1 }]}>
            <Text style={shared.btnText}>Add to bag</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ground },
  crumb: { paddingHorizontal: 20, paddingTop: 12, fontSize: 13, color: c.muted },
  panel: { marginHorizontal: 16, marginTop: 4, padding: 20, backgroundColor: c.white, borderRadius: 24, borderWidth: 1, borderColor: c.line },
  title: { fontSize: 28, fontWeight: "500", color: c.plum },
  price: { marginTop: 4, fontSize: 20, fontWeight: "700", color: c.brand },
  label: { marginTop: 18, marginBottom: 8, fontSize: 13, fontWeight: "700", color: c.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  value: { color: c.plum, textTransform: "none", letterSpacing: 0 },
  row: { flexDirection: "row", gap: 10 },
  swatchWrap: { padding: 3, borderRadius: 24, borderWidth: 2, borderColor: "transparent" },
  swatchOn: { borderColor: c.brand },
  thumbLabel: { fontSize: 11, color: c.muted, maxWidth: 76, textAlign: "center" },
  size: { minWidth: 52, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: c.edge, alignItems: "center", justifyContent: "center", backgroundColor: c.white },
  sizeOn: { backgroundColor: c.brand, borderColor: c.brand },
  sizeOut: { opacity: 0.4 },
  sizeText: { fontSize: 15, fontWeight: "700", color: c.plum },
  desc: { fontSize: 15, lineHeight: 23, color: "#4a3340" },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 12, padding: 12, paddingHorizontal: 16, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.line },
  heart: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: c.edge, alignItems: "center", justifyContent: "center" },
});
