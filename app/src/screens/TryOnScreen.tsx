import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Gallery from "../Gallery";
import { fillImage, shared, useNav } from "../ui";
import { useCart, type CartItem } from "../../lib/cart";
import { c, serif } from "../../lib/theme";
import { sizeText, type Product } from "../../lib/products";
import { apiEnabled, tryOn } from "../../lib/tryon";

type Stage = "photo" | "analysing" | "results";

export default function TryOnScreen() {
  const nav = useNav();
  const { ready, items, remove } = useCart();
  const [stage, setStage] = useState<Stage>("photo");
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [steps, setSteps] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [removed, setRemoved] = useState("");
  const [results, setResults] = useState<Record<string, string>>({});

  // With EXPO_PUBLIC_API_URL set, each item in the bag goes to the API with the photo.
  // Without it the product photo is shown beside the customer's photo as a stand-in.
  const analyse = async (uri: string) => {
    setPhoto(uri);
    setError("");
    setSteps(["Detecting your face and pose", "Matching skin tone and lighting", ...items.map((i) => `Fitting ${i.product.name}`), "Finishing your preview"]);
    setStep(0);
    setStage("analysing");
    const started = Date.now();
    try {
      const out: Record<string, string> = {};
      if (apiEnabled) {
        await Promise.all(items.map(async (it) => {
          const col = it.product.colours.find((x) => x.name === it.colour) ?? it.product.colours[0];
          out[it.key] = await tryOn(uri, it.product.slug, col.name);
        }));
      }
      await new Promise((r) => setTimeout(r, Math.max(0, 700 * (items.length + 3) - (Date.now() - started))));
      setResults(out);
      setActive(0);
      setStage("results");
    } catch {
      setError("We could not use that photo. Try a different one.");
      setStage("photo");
    }
  };

  useEffect(() => {
    if (stage !== "analysing") return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 700);
    return () => clearInterval(id);
  }, [stage, steps.length]);

  const pick = async (from: "camera" | "library") => {
    setError("");
    try {
      if (from === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setError("Camera access is off. Allow it in Settings, or choose a photo instead.");
          return;
        }
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7, allowsEditing: false };
      const res = from === "camera" ? await ImagePicker.launchCameraAsync({ ...opts, cameraType: ImagePicker.CameraType.front }) : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets[0]) return;
      void analyse(res.assets[0].uri);
    } catch {
      setError("We could not use that photo. Try a different one.");
    }
  };

  if (ready && items.length === 0 && stage !== "results") {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={[serif, styles.h]}>Your bag is empty</Text>
        <Text style={styles.sub}>Add something to your bag, then come back to try it on.</Text>
        <Pressable style={shared.btn} onPress={() => nav.navigate("Browse", { category: "sarees" })}><Text style={shared.btnText}>Browse sarees</Text></Pressable>
      </View>
    );
  }

  if (stage === "photo") {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Text style={[serif, styles.h]}>Virtual try-on</Text>
        <Text style={styles.body}>Take a selfie or choose a photo of yourself and we will preview {items.length === 1 ? "the item" : `all ${items.length} items`} in your bag on you.</Text>
        <Text style={styles.sub}>Stand in good light, facing the camera, with your full face and shoulders in the photo.</Text>
        {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
        <Pressable onPress={() => pick("camera")} accessibilityLabel="Take a selfie" style={[shared.btn, { minHeight: 56 }]}><Text style={shared.btnText}>Take a selfie</Text></Pressable>
        <Pressable onPress={() => pick("library")} accessibilityLabel="Choose a photo" style={[shared.btnGhost, { minHeight: 56 }]}><Text style={shared.btnGhostText}>Choose a photo</Text></Pressable>
        {/* TODO: state where the photo is sent and how long it is kept once the backend exists. */}
        <Text style={styles.small}>{apiEnabled ? "Your photo is sent to our server to create the preview and is not saved." : "Your photo stays on this phone and is not uploaded. The preview is simulated until the AI try-on service is connected."}</Text>
      </ScrollView>
    );
  }

  if (stage === "analysing" && photo) return <Analysing photo={photo} steps={steps} step={step} />;

  return (
    <Results
      photo={photo ?? ""}
      results={results}
      items={items}
      active={active}
      setActive={setActive}
      removed={removed}
      onRemove={(it) => {
        remove(it.key);
        setRemoved(`${it.product.name} removed from your bag.`);
      }}
      onRetake={() => setStage("photo")}
    />
  );
}

function Analysing({ photo, steps, step }: { photo: string; steps: string[]; step: number }) {
  const scan = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const [h, setH] = useState(400);

  useEffect(() => {
    const a = Animated.loop(Animated.sequence([Animated.timing(scan, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }), Animated.timing(scan, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true })]));
    const b = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }), Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true })]));
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [scan, pulse]);

  const pct = Math.round(((step + 1) / steps.length) * 100);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 20, gap: 18 }}>
      <View style={styles.frame} onLayout={(e) => setH(e.nativeEvent.layout.height)} accessibilityLabel="Analysing your photo">
        <Image source={{ uri: photo }} style={fillImage} resizeMode="cover" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(214,25,107,.22)" }]} />
        <Animated.View style={[styles.ring, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.95] }) }]} />
        <Animated.View style={[styles.scanLine, { transform: [{ translateY: scan.interpolate({ inputRange: [0, 1], outputRange: [8, h - 12] }) }] }]} />
        {[styles.cTL, styles.cTR, styles.cBL, styles.cBR].map((st, i) => <View key={i} style={[styles.corner, st]} />)}
      </View>
      <Text style={[serif, styles.h]}>Analysing your photo</Text>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }} style={styles.track}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
      <View style={{ gap: 10 }} accessibilityLiveRegion="polite">
        {steps.map((s, i) => (
          <View key={s} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={[styles.dot, i < step && { backgroundColor: c.brand, borderColor: c.brand }, i === step && { borderColor: c.brand }]}>{i < step ? <Text style={{ color: c.white, fontSize: 12 }}>✓</Text> : null}</View>
            <Text style={{ fontSize: 15, color: i > step ? "#a8949d" : c.plum, fontWeight: i === step ? "700" : "400" }}>{s}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Results({ photo, results, items, active, setActive, removed, onRemove, onRetake }: { photo: string; results: Record<string, string>; items: CartItem[]; active: number; setActive: (i: number) => void; removed: string; onRemove: (it: CartItem) => void; onRetake: () => void }) {
  const nav = useNav();
  const cards = useMemo<Product[]>(
    () => items.map((it) => {
      const col = it.product.colours.find((x) => x.name === it.colour) ?? it.product.colours[0];
      return { ...it.product, slug: it.key, colours: [{ ...col, image: { uri: results[it.key] ?? photo }, fit: "cover" as const }] };
    }),
    [items, photo, results],
  );
  const idx = Math.min(active, Math.max(0, items.length - 1));
  const cur = items[idx];

  if (!cur) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={[serif, styles.h]}>Your bag is empty</Text>
        <Text style={styles.sub} accessibilityRole="alert">{removed}</Text>
        <Pressable style={shared.btn} onPress={() => nav.navigate("Browse", { category: "sarees" })}><Text style={shared.btnText}>Browse sarees</Text></Pressable>
      </View>
    );
  }

  const byKey = Object.fromEntries(items.map((it) => [it.key, it]));
  const overlay = (p: Product) => {
    const it = byKey[p.slug];
    const col = it?.product.colours.find((x) => x.name === it.colour) ?? it?.product.colours[0];
    return col ? (
      <View style={styles.inset}><Image source={col.image} resizeMode="cover" style={fillImage} /></View>
    ) : null;
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 170 }}>
        <Text style={styles.crumb}><Text style={{ fontWeight: "700", color: c.plum }}>{idx + 1} of {items.length}</Text> · Swipe to see each item on you. Preview is simulated.</Text>
        <Gallery products={cards} colourIndex={{}} onActiveChange={setActive} overlayFor={overlay} />
        <View style={styles.panel}>
          <Text style={[serif, styles.title]} testID="tryon-title">{cur.product.name}</Text>
          <Text style={styles.sub}>{[cur.colour, sizeText(cur.product, cur.size), `Qty ${cur.qty}`].filter(Boolean).join(" · ")}</Text>
          <Text style={[styles.body, { marginTop: 10 }]}>{cur.product.blurb}</Text>
          <View style={{ gap: 10, marginTop: 16 }}>
            <Pressable onPress={() => onRemove(cur)} accessibilityLabel="Remove from bag" style={[shared.btnGhost, { borderColor: c.danger }]}><Text style={[shared.btnGhostText, { color: c.danger }]}>Remove from bag</Text></Pressable>
            <Pressable onPress={onRetake} accessibilityLabel="Use a different photo" style={shared.btnGhost}><Text style={shared.btnGhostText}>Use a different photo</Text></Pressable>
          </View>
          {removed ? <Text style={[styles.sub, { color: c.brand, fontWeight: "700", marginTop: 10 }]} accessibilityRole="alert">{removed}</Text> : null}
        </View>
      </ScrollView>
      <View style={styles.bar}>
        <Text style={{ fontWeight: "700", color: c.plum }}>{items.length} {items.length === 1 ? "item" : "items"} in your bag</Text>
        <Pressable onPress={() => nav.navigate("Checkout")} accessibilityLabel="Proceed to checkout" style={shared.btn}><Text style={shared.btnText}>Proceed to checkout</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ground },
  center: { alignItems: "center", justifyContent: "center", gap: 14, padding: 24 },
  h: { fontSize: 28, color: c.plum },
  body: { fontSize: 15, lineHeight: 22, color: "#4a3340" },
  sub: { fontSize: 14, color: c.muted },
  small: { fontSize: 12, color: c.muted, marginTop: 6 },
  error: { padding: 12, borderRadius: 12, backgroundColor: "#fdecef", color: "#8c0f2f", fontWeight: "600" },
  crumb: { paddingHorizontal: 20, paddingTop: 12, fontSize: 13, color: c.muted },
  panel: { marginHorizontal: 16, marginTop: 4, padding: 20, backgroundColor: c.white, borderRadius: 24, borderWidth: 1, borderColor: c.line },
  title: { fontSize: 26, color: c.plum },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, gap: 10, padding: 14, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.line },
  inset: { position: "absolute", left: 10, bottom: 10, width: 76, height: 100, borderRadius: 10, overflow: "hidden", borderWidth: 3, borderColor: c.white, backgroundColor: c.white },
  frame: { width: "78%", aspectRatio: 3 / 4, alignSelf: "center", borderRadius: 24, overflow: "hidden", backgroundColor: c.plum },
  ring: { position: "absolute", left: 16, right: 16, top: 16, bottom: 16, borderRadius: 160, borderWidth: 2, borderColor: "rgba(255,255,255,.85)" },
  scanLine: { position: "absolute", left: 0, right: 0, height: 4, backgroundColor: "#ff7ab5", shadowColor: "#ff7ab5", shadowOpacity: 0.9, shadowRadius: 12 },
  corner: { position: "absolute", width: 26, height: 26, borderColor: c.white },
  cTL: { left: 10, top: 10, borderLeftWidth: 4, borderTopWidth: 4 },
  cTR: { right: 10, top: 10, borderRightWidth: 4, borderTopWidth: 4 },
  cBL: { left: 10, bottom: 10, borderLeftWidth: 4, borderBottomWidth: 4 },
  cBR: { right: 10, bottom: 10, borderRightWidth: 4, borderBottomWidth: 4 },
  track: { height: 8, borderRadius: 4, backgroundColor: c.line, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4, backgroundColor: c.brand },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.edge, alignItems: "center", justifyContent: "center" },
});
