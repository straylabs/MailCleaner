import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "./types";
import HomeScreen from "@/screens/HomeScreen";
import PresetsScreen from "@/screens/PresetsScreen";
import LoginScreen from "@/screens/LoginScreen";
import { useTheme } from "@/utils/ThemeContext";
import { useAuth } from "@/utils/AuthContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { authState } = useAuth();
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        id={undefined}
        screenOptions={{
          headerShown: false,
        }}
      >
        {authState.isAuthenticated ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Presets" component={PresetsScreen} />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
