import { Platform } from "react-native";
import { api, apiEnabled } from "./api";

/** Sends the customer's photo to the API and returns the generated image (a URL or data URL). */
export async function tryOn(photoUri: string, slug: string, colour: string): Promise<string> {
  const form = new FormData();
  if (Platform.OS === "web") {
    form.append("photo", await (await fetch(photoUri)).blob(), "photo");
  } else {
    // React Native uploads a file by its uri.
    form.append("photo", { uri: photoUri, name: "photo.jpg", type: "image/jpeg" } as unknown as Blob);
  }
  form.append("slug", slug);
  form.append("colour", colour);
  const r = await api<{ imageUrl?: string; imageDataUrl?: string }>("/api/tryon", { form });
  const out = r.imageUrl ?? r.imageDataUrl;
  if (!out) throw new Error("No image came back");
  return out;
}

export { apiEnabled };
