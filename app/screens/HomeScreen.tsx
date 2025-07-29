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
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const cancelSyncRef = React.useRef(false);

  // --- Gmail API helpers ---
  // Get a batch of Gmail messages
  async function getGmailMessages(token, pageToken) {
    const baseUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages";
    let url = baseUrl + `?maxResults=10`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Gmail fetch error:", res.status, errorText);
      console.error("Token used:", token);
      throw new Error("Failed to fetch Gmail messages");
    }
    const data = await res.json();
    return {
      messages: data.messages || [],
      nextPageToken: data.nextPageToken,
    };
  }

  // Parse a Gmail message (fetch full details)
  async function parseGmailMessage(msg, token) {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch Gmail message details");
    const data = await res.json();
    // Extract subject from headers
    let subject = "";
    if (data.payload && data.payload.headers) {
      const subjectHeader = data.payload.headers.find(
        (h) => h.name.toLowerCase() === "subject"
      );
      if (subjectHeader) subject = subjectHeader.value;
    }
    console.log("Email subject:", subject);
    await new Promise((r) => setTimeout(r, 200)); // Simulate processing
    return data;
  }

  const COOLDOWN_MS = 30;

  async function syncGmailMessages(token) {
    let nextPageToken = undefined;
    let totalParsed = 0;
    setSyncing(true);
    setSyncProgress(0);
    cancelSyncRef.current = false;
    let cancelled = false;
    try {
      do {
        if (cancelSyncRef.current) {
          cancelled = true;
          break;
        }
        const { messages, nextPageToken: newToken } = await getGmailMessages(
          token,
          nextPageToken
        );
        for (const msg of messages) {
          if (cancelSyncRef.current) {
            cancelled = true;
            break;
          }
          await parseGmailMessage(msg, token);
          totalParsed++;
          setSyncProgress(totalParsed);
          await new Promise((r) => setTimeout(r, COOLDOWN_MS));
        }
        nextPageToken = newToken;
        // Optional: cooldown between batches
        await new Promise((r) => setTimeout(r, COOLDOWN_MS));
      } while (nextPageToken && !cancelSyncRef.current);
    } catch (err) {
      console.error("Sync error:", err);
    }
    setSyncing(false);
    if (cancelled) {
      console.log("Sync cancelled by user.");
    }
  }

  const handleStartSync = async () => {
    if (syncing) return;
    cancelSyncRef.current = false;
    const token = authState.accessToken;
    await syncGmailMessages(token);
  };

  const handleCancelSync = () => {
    cancelSyncRef.current = true;
    setSyncing(false);
  };

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
          onPress={handleStartSync}
          disabled={syncing}
        >
          {syncing ? `Syncing... (${syncProgress})` : "Start Sync"}
        </Button>
        {syncing && (
          <Button
            variant="destructive"
            style={styles.syncButton}
            onPress={handleCancelSync}
          >
            Cancel
          </Button>
        )}
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
