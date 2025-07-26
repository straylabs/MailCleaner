import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import React, { useState } from "react";
import { useTheme } from "@/utils/ThemeContext";
import Button from "@/components/Button";
import Screen from "@/components/Screen";
import { useAuth } from "@/utils/AuthContext";
import { AppScreenProps } from "@/navigation/types";
import Avatar from "@/components/Avatar";
import CustomAlert from "@/components/CustomAlert";
import { Sun, Moon, LogOut } from "lucide-react-native";

type HomeScreenProps = AppScreenProps<"Home">;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { logout, authState } = useAuth();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  // Dummy user name and avatar

  return (
    <Screen useSafeArea>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar uri={authState.userAvatar} size={40} />
          <Text style={[styles.userName, { color: theme.text }]}>
            {authState.userName}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
            {isDarkMode ? (
              <Sun size={28} color={theme.textSecondary} />
            ) : (
              <Moon size={28} color={theme.textSecondary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowLogoutAlert(true)}
            style={styles.iconButton}
          >
            <LogOut size={28} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* CustomAlert for logout */}
      <CustomAlert
        visible={showLogoutAlert}
        title="Logout"
        message="Are you sure you want to logout?"
        onClose={() => setShowLogoutAlert(false)}
        buttons={[
          {
            text: "Cancel",
            onPress: () => {},
            variant: "default",
          },
          {
            text: "Logout",
            onPress: logout,
            variant: "destructive",
          },
        ]}
      />

      {/* Main scrollable area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1 }}
      >
        {/* Debug code removed: Displaying Google token */}
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomSectionRow}>
        <Button
          variant="outline"
          style={styles.bottomButton}
          onPress={() => navigation.navigate("Presets")}
        >
          Manage Presets
        </Button>
        <Button
          variant="primary"
          style={styles.syncButton}
          onPress={() => {
            // Start sync logic here
            console.log("Start sync pressed");
          }}
        >
          Start Sync
        </Button>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 20,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  bottomSectionRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "transparent",
    gap: 12,
  },
  bottomButton: {
    flex: 2,
  },
  syncButton: {
    flex: 1,
  },
});

export default HomeScreen;
