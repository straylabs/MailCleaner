import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "@/utils/AuthContext";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import { useTheme } from "@/utils/ThemeContext";

const LoginScreen = () => {
  const { login } = useAuth();
  const { theme } = useTheme();

  return (
    <Screen useSafeArea>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>MailCleaner</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Clean up your inbox automatically
          </Text>
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            Sign in with your Google account to get started with automated email cleaning and organization.
          </Text>
          
          <Button variant="primary" onPress={login} style={styles.button}>
            Sign in with Google
          </Button>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
  },
  content: {
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    width: "100%",
    maxWidth: 300,
  },
});

export default LoginScreen;
