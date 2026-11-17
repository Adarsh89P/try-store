import { Image, StyleSheet, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { c } from "../lib/theme";

export function Swatch({ colors, size = 36 }: { colors: string[]; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", flexDirection: "row", borderWidth: 1, borderColor: c.edge }}>
      {colors.map((col) => (
        <View key={col} style={{ flex: 1, backgroundColor: col }} />
      ))}
    </View>
  );
}

/** Shows a crop of a photo: zoom 1 fills the box (top aligned); larger zoom magnifies. px/py are 0..1. */
export function Crop({ source, aspect: a, w, h, zoom, px, py, radius = 12 }: { source: ImageSourcePropType; aspect: number; w: number; h: number; zoom: number; px: number; py: number; radius?: number }) {
  const base = Math.max(w, h / a); // image width that just covers the box
  const iw = base * zoom;
  const ih = iw * a;
  return (
    <View style={{ width: w, height: h, borderRadius: radius, overflow: "hidden", backgroundColor: c.white }}>
      <Image source={source} style={{ position: "absolute", width: iw, height: ih, left: (w - iw) * px, top: (h - ih) * py }} />
    </View>
  );
}

/** Fills its parent. Needed because bundled images default to their own pixel size, which overrides absoluteFill. */
export const fillImage = { position: "absolute" as const, top: 0, left: 0, width: "100%" as const, height: "100%" as const };

export const shared = StyleSheet.create({
  btn: { minHeight: 52, borderRadius: 26, backgroundColor: c.brand, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  btnText: { color: c.white, fontWeight: "700", fontSize: 15 },
  btnGhost: { minHeight: 52, borderRadius: 26, borderWidth: 1.5, borderColor: c.brand, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  btnGhostText: { color: c.brand, fontWeight: "700", fontSize: 15 },
});

import { Pressable, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { formatPrice } from "../lib/format";
import { getCategory, type Product } from "../lib/products";
import { useWishlist } from "../lib/wishlist";
import { serif } from "../lib/theme";

/** Navigation with loose typing: screens are looked up by name. */
export const useNav = () => useNavigation<{ navigate: (name: string, params?: object) => void }>();

/** Product tile that opens the browser on this product, with its own wishlist heart. */
export function ProductTile({ product: p }: { product: Product }) {
  const nav = useNav();
  const wishlist = useWishlist();
  const wished = wishlist.has(p.slug);
  const col = p.colours[0];
  return (
    <View style={{ flex: 1 }}>
      <Pressable accessibilityLabel={`${p.name}, open`} onPress={() => nav.navigate("Browse", { category: p.category, slug: p.slug })}>
        <View style={{ aspectRatio: 3 / 4, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: c.line, backgroundColor: c.white }}>
          <Image source={col.image} resizeMode={col.fit} style={fillImage} />
        </View>
        <Text style={{ marginTop: 8, fontSize: 11, fontWeight: "700", color: c.muted, textTransform: "uppercase" }}>{getCategory(p.category)?.label}</Text>
        <Text style={[serif, { fontSize: 16, color: c.plum }]} numberOfLines={2}>{p.name}</Text>
        <Text style={{ fontSize: 14, fontWeight: "700", color: c.brand }}>{formatPrice(p.price)}</Text>
      </Pressable>
      <Pressable
        onPress={() => wishlist.toggle(p.slug)}
        accessibilityLabel={wished ? `Remove ${p.name} from wishlist` : `Add ${p.name} to wishlist`}
        style={{ position: "absolute", top: 8, right: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,.95)", alignItems: "center", justifyContent: "center" }}
      >
        <Text style={{ fontSize: 20, color: c.brand }}>{wished ? "♥" : "♡"}</Text>
      </Pressable>
    </View>
  );
}

/** Rows of two tiles. */
export function TileGrid({ products }: { products: Product[] }) {
  const rows: Product[][] = [];
  for (let i = 0; i < products.length; i += 2) rows.push(products.slice(i, i + 2));
  return (
    <View style={{ gap: 18 }}>
      {rows.map((r) => (
        <View key={r[0].slug} style={{ flexDirection: "row", gap: 14 }}>
          {r.map((p) => <ProductTile key={p.slug} product={p} />)}
          {r.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}

export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={label} style={{ minHeight: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: on ? c.brand : c.edge, backgroundColor: on ? c.brand : c.white, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontWeight: "600", fontSize: 14, color: on ? c.white : c.plum }}>{label}</Text>
    </Pressable>
  );
}
