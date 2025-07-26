import { View, Text, StyleSheet, Alert } from "react-native";
import React, { useState, useEffect } from "react";
import { useTheme } from "@/utils/ThemeContext";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import { useAuth } from "@/utils/AuthContext";
import { AppScreenProps } from "@/navigation/types";

type HomeScreenProps = AppScreenProps<"Home">;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { logout } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Simulated syncing logic
  const performSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate API call to sync emails
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastSyncTime(new Date());
      Alert.alert("Sync Complete", "Your emails have been synchronized successfully.");
    } catch (error) {
      Alert.alert("Sync Failed", "Failed to synchronize emails. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync on component mount
  useEffect(() => {
    performSync();
  }, []);

  return (
    <Screen useSafeArea>
      <View className="flex-1 justify-center p-4">
        <View style={styles.welcomeSection}>
          <Text style={[styles.title, { color: theme.text }]}>
            Welcome to MailCleaner
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Keep your inbox clean and organized
          </Text>
        </View>

        <View style={styles.syncSection}>
          <Text style={[styles.syncTitle, { color: theme.text }]}>
            Email Synchronization
          </Text>
          {lastSyncTime && (
            <Text style={[styles.syncTime, { color: theme.textSecondary }]}>
              Last synced: {lastSyncTime.toLocaleTimeString()}
            </Text>
          )}
          <Button 
            variant="primary" 
            style={styles.button} 
            onPress={performSync}
            disabled={isSyncing}
          >
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>
        </View>

        <View style={styles.actionsSection}>
          <Button 
            variant="outline" 
            style={styles.button} 
            onPress={() => navigation.navigate("Presets")}
          >
            Manage Presets
          </Button>
          
          <Button variant="outline" style={styles.button} onPress={toggleTheme}>
            {isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </Button>
          
          <Button variant="secondary" style={styles.button} onPress={logout}>
            Logout
          </Button>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  welcomeSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
  },
  syncSection: {
    marginBottom: 32,
    alignItems: "center",
  },
  syncTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  syncTime: {
    fontSize: 14,
    marginBottom: 16,
  },
  actionsSection: {
    gap: 12,
  },
  button: {
    marginTop: 8,
  },
});

export default HomeScreen;
