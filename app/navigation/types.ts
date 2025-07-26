import { RouteProp } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

/** Root Stack Param List */
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Presets: undefined;
};

/**
 * Screen Props (Contains navigation and route)
 */
export type AppScreenProps<RouteName extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, RouteName>;

/**
 * Navigation Props
 */
export type AppNavigationProp<RouteName extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, RouteName>["navigation"];

/**
 * Route Props
 */
export type AppRouteProp<RouteName extends keyof RootStackParamList> =
  RouteProp<RootStackParamList, RouteName>;
