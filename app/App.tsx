import { Fraunces_500Medium, useFonts } from "@expo-google-fonts/fraunces";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AccountProvider } from "./lib/account";
import { CartProvider, useCart } from "./lib/cart";
import { c } from "./lib/theme";
import { WishlistProvider, useWishlist } from "./lib/wishlist";
import AccountScreen from "./src/screens/AccountScreen";
import AddressesScreen from "./src/screens/AddressesScreen";
import BagScreen from "./src/screens/BagScreen";
import BrowseScreen from "./src/screens/BrowseScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import HomeScreen from "./src/screens/HomeScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import TryOnScreen from "./src/screens/TryOnScreen";
import SearchScreen from "./src/screens/SearchScreen";
import WishlistScreen from "./src/screens/WishlistScreen";

const Tabs = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const icon = (glyph: string) => ({ color }: { color: string }) => <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
const header = { headerStyle: { backgroundColor: c.white }, headerTitleStyle: { color: c.plum, fontWeight: "700" as const }, headerTintColor: c.brand };

function TabsScreen() {
  const { count } = useCart();
  const wishlist = useWishlist();
  return (
    <Tabs.Navigator
      initialRouteName="Home"
      screenOptions={{ ...header, headerTitleStyle: { color: c.brand, fontWeight: "700" }, tabBarActiveTintColor: c.brand, tabBarInactiveTintColor: c.muted, tabBarLabelStyle: { fontSize: 11 } }}
    >
      {/* TODO: replace [YOUR STORE] with the store name. */}
      <Tabs.Screen name="Home" component={HomeScreen} options={{ title: "[YOUR STORE]", tabBarLabel: "Home", tabBarIcon: icon("⌂") }} />
      <Tabs.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: icon("⌕") }} />
      <Tabs.Screen name="Wishlist" component={WishlistScreen} options={{ tabBarIcon: icon("♡"), tabBarBadge: wishlist.count > 0 ? wishlist.count : undefined, tabBarBadgeStyle: { backgroundColor: c.brand } }} />
      <Tabs.Screen name="Bag" component={BagScreen} options={{ tabBarIcon: icon("👜"), tabBarBadge: count > 0 ? count : undefined, tabBarBadgeStyle: { backgroundColor: c.brand }, tabBarAccessibilityLabel: `Bag, ${count} items` }} />
      <Tabs.Screen name="Account" component={AccountScreen} options={{ tabBarIcon: icon("☺") }} />
    </Tabs.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Fraunces_500Medium });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <AccountProvider>
        <WishlistProvider>
          <CartProvider>
            <NavigationContainer>
              <Stack.Navigator screenOptions={header}>
                <Stack.Screen name="Tabs" component={TabsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Browse" component={BrowseScreen} getId={({ params }) => `${(params as { category?: string; slug?: string } | undefined)?.category ?? "sarees"}:${(params as { slug?: string } | undefined)?.slug ?? ""}`} options={({ route }) => ({ title: (route.params as { category?: string } | undefined)?.category ? labelFor((route.params as { category: string }).category) : "Sarees" })} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Secure checkout" }} />
                <Stack.Screen name="TryOn" component={TryOnScreen} options={{ title: "Virtual try-on" }} />
                <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: "Your orders" }} />
                <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: "Saved addresses" }} />
              </Stack.Navigator>
            </NavigationContainer>
            <StatusBar style="dark" />
          </CartProvider>
        </WishlistProvider>
      </AccountProvider>
    </SafeAreaProvider>
  );
}

import { getCategory } from "./lib/products";
const labelFor = (id: string) => getCategory(id)?.label ?? "Shop";
