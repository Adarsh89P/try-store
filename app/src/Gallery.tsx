import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { GestureResponderEvent, LayoutChangeEvent } from "react-native";
import { c, serif } from "../lib/theme";
import { formatPrice } from "../lib/format";
import type { Product } from "../lib/products";
import { fillImage } from "./ui";

type Props = {
  products: Product[];
  colourIndex: Record<string, number>;
  onActiveChange: (index: number) => void;
  /** Open on this product without animation (used when arriving from search or the wishlist). */
  startIndex?: number;
  /** Optional extra content drawn on top of a card's photo (used by the try-on preview). */
  overlayFor?: (product: Product) => ReactNode;
};

// Same motion tables as the website. Index k = distance in front of the main slot (0 = main).
const DX = [0, 288, 410, 480, 520];
const SCALE = [1, 0.6, 0.42, 0.3, 0.25];
const BLUR = [0, 1, 1, 1, 1];
const OPACITY = [1, 0.88, 0.6, 0.3, 0];
const lerp = (k: number, table: number[]) => {
  const a = Math.max(0, Math.min(table.length - 1, k));
  const lo = Math.floor(a);
  const hi = Math.min(lo + 1, table.length - 1);
  return table[lo] + (table[hi] - table[lo]) * (a - lo);
};

const TOP = 16;
const META_H = 64;
const CONTROLS_H = 64;

/**
 * Swipe gallery. A paging horizontal scroller (one product per screen width) sits transparently on
 * top of the cards and drives `scrollX`. Upcoming sarees wait small and blurred on the left and slide
 * right into the main slot; the one you leave slides out to the right.
 */
export default function Gallery({ products, colourIndex, onActiveChange, startIndex = 0, overlayFor }: Props) {
  const N = products.length;
  const [width, setWidth] = useState(390);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scroller = useRef<{ scrollTo: (o: { x: number; animated: boolean }) => void } | null>(null);
  const tRef = useRef(0);
  const lastIndex = useRef(0);
  const [index, setIndex] = useState(0);

  const cardW = Math.max(200, Math.min(width * 0.6, 300));
  const f = cardW / 340;
  const artH = Math.round((cardW * 520) / 340);
  const stageH = TOP + artH + META_H + CONTROLS_H;
  const mainCx = width * 0.6;

  useEffect(() => {
    if (startIndex <= 0) return;
    const id = setTimeout(() => scroller.current?.scrollTo({ x: startIndex * width, animated: false }), 50);
    return () => clearTimeout(id);
  }, [startIndex, width]);

  const goTo = (i: number) => scroller.current?.scrollTo({ x: Math.max(0, Math.min(N - 1, i)) * width, animated: true });

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width || 390);

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: true,
    listener: (e: unknown) => {
      const x = (e as { nativeEvent: { contentOffset: { x: number } } }).nativeEvent.contentOffset.x;
      tRef.current = x / width;
      const i = Math.max(0, Math.min(N - 1, Math.round(tRef.current)));
      if (i !== lastIndex.current) {
        lastIndex.current = i;
        setIndex(i);
        onActiveChange(i);
      }
    },
  });

  // Tapping a small saree on the left brings it to the main slot.
  const onTap = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    const t = tRef.current;
    let hit = -1;
    for (let i = 0; i < N; i++) {
      const k = i - t;
      if (k < 0.5) continue;
      const cx = mainCx - lerp(k, DX) * f;
      const half = (cardW * lerp(k, SCALE)) / 2;
      if (x >= cx - half && x <= cx + half && (hit === -1 || i < hit)) hit = i;
    }
    if (hit >= 0) goTo(hit);
  };

  const cards = useMemo(
    () =>
      products.map((p, i) => {
        // scrollX positions at which this card is at k = 4 .. -1 (ascending scroll order).
        const ks = [4, 3, 2, 1, 0, -1];
        const input = ks.map((k) => (i - k) * width);
        const pick = (table: number[], at: number) => (k: number) => (k >= 0 ? lerp(k, table) : at);
        const map = (table: number[], at: number) => ks.map(pick(table, at));
        return {
          translateX: scrollX.interpolate({ inputRange: input, outputRange: ks.map((k) => (k >= 0 ? -lerp(k, DX) * f : 260 * f)), extrapolate: "clamp" }),
          scale: scrollX.interpolate({ inputRange: input, outputRange: map(SCALE, 0.9), extrapolate: "clamp" }),
          opacity: scrollX.interpolate({ inputRange: input, outputRange: map(OPACITY, 0), extrapolate: "clamp" }),
          blurOpacity: scrollX.interpolate({ inputRange: input, outputRange: map(BLUR, 0.6), extrapolate: "clamp" }),
          metaOpacity: scrollX.interpolate({ inputRange: [(i - 0.5) * width, i * width, (i + 0.5) * width], outputRange: [0, 1, 0], extrapolate: "clamp" }),
        };
      }),
    [products, width, f, scrollX],
  );

  return (
    <View style={{ height: stageH, overflow: "hidden" }} onLayout={onLayout}>
      {products.map((p, i) => {
        const colour = p.colours[colourIndex[p.slug] ?? 0];
        const a = cards[i];
        // Cards later in the list sit further back, so earlier ones overlap them.
        return (
          <Animated.View
            key={p.slug}
            pointerEvents="none"
            style={[
              styles.card,
              { top: TOP, width: cardW, left: mainCx - cardW / 2, zIndex: N - i, opacity: a.opacity, transform: [{ translateX: a.translateX }, { scale: a.scale }] },
            ]}
          >
            <View style={[styles.art, { height: artH }]}>
              <Image source={colour.image} accessibilityLabel={`${p.name}, worn by a model`} resizeMode={colour.fit} style={fillImage} />
              {overlayFor?.(p)}
              {/* Blurred copy fades in as the saree moves away from the main slot. */}
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: a.blurOpacity, backgroundColor: c.white }]}>
                <Image source={colour.image} blurRadius={9} resizeMode={colour.fit} style={fillImage} />
              </Animated.View>
            </View>
            <Animated.View style={{ opacity: a.metaOpacity, paddingTop: 12, paddingHorizontal: 4 }}>
              <Text style={[serif, styles.name]} numberOfLines={1}>{p.name}</Text>
              <Text style={styles.price}>{formatPrice(p.price)}</Text>
            </Animated.View>
          </Animated.View>
        );
      })}

      <Animated.ScrollView
        ref={(r: unknown) => {
          scroller.current = r as typeof scroller.current;
        }}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        style={[StyleSheet.absoluteFill, { zIndex: 200 }]}
        accessibilityLabel="Saree gallery. Swipe or use the arrow buttons."
        testID="gallery-scroller"
      >
        {products.map((p) => (
          <Pressable key={p.slug} onPress={onTap} style={{ width, height: stageH - CONTROLS_H }} />
        ))}
      </Animated.ScrollView>

      <View style={styles.controls}>
        <Pressable onPress={() => goTo(index - 1)} disabled={index === 0} accessibilityLabel="Previous saree" style={[styles.arrow, styles.arrowLight, index === 0 && styles.off]}>
          <Text style={[styles.arrowText, { color: c.plum }]}>‹</Text>
        </Pressable>
        <Pressable onPress={() => goTo(index + 1)} disabled={index === N - 1} accessibilityLabel="Next saree" style={[styles.arrow, styles.arrowBrand, index === N - 1 && styles.off]}>
          <Text style={[styles.arrowText, { color: c.white }]}>›</Text>
        </Pressable>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { transform: [{ translateX: scrollX.interpolate({ inputRange: [0, Math.max(1, N - 1) * width], outputRange: [-120, 0], extrapolate: "clamp" }) }] }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { position: "absolute" },
  art: { borderRadius: 20, overflow: "hidden", backgroundColor: c.white, shadowColor: c.plum, shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  name: { fontSize: 18, color: c.plum, fontWeight: "500" },
  price: { marginTop: 2, fontSize: 14, fontWeight: "700", color: c.brand },
  controls: { position: "absolute", left: 16, bottom: 8, zIndex: 300, flexDirection: "row", alignItems: "center", gap: 12 },
  arrow: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  arrowLight: { backgroundColor: c.white, borderWidth: 1, borderColor: c.line },
  arrowBrand: { backgroundColor: c.brand },
  arrowText: { fontSize: 28, lineHeight: 32, fontWeight: "600" },
  off: { opacity: 0.4 },
  track: { marginLeft: 8, width: 120, height: 4, borderRadius: 2, backgroundColor: c.line, overflow: "hidden" },
  fill: { height: 4, width: 120, borderRadius: 2, backgroundColor: c.brand },
});
