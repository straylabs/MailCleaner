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
          headerStyle: {
            backgroundColor: theme.surface,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      >
        {authState.isAuthenticated ? (
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ 
                title: "MailCleaner",
                headerShown: true,
              }}
            />
            <Stack.Screen 
              name="Presets" 
              component={PresetsScreen}
              options={{ 
                title: "Presets",
                headerShown: true,
              }}
            />
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
