import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useTheme } from "@/utils/ThemeContext";
import Screen from "@/components/Screen";
import { StorageUtils, StorageKey } from "@/utils/Storage";
import { Preset } from "@/screens/PresetsScreen";
import { PresetUtils } from "@/utils/PresetUtils";
import { useAuth } from "@/utils/AuthContext";
import Avatar from "@/components/Avatar";
import CustomAlert from "@/components/CustomAlert";
import { Sun, Moon, LogOut, Trash2 } from "lucide-react-native";
import { AppScreenProps } from "@/navigation/types";
import Button from "@/components/Button";

type HomeScreenProps = AppScreenProps<"Home">;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [deletedMailLog, setDeletedMailLog] = useState<string[]>([]);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [isAtEnd, setIsAtEnd] = useState(true);
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null);

  // Load current preset when component mounts or when navigation focuses
  const loadCurrentPreset = React.useCallback(() => {
    const preset = PresetUtils.getCurrentPreset();
    setCurrentPreset(preset);
  }, []);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadCurrentPreset();
    });
    return unsubscribe;
  }, [navigation, loadCurrentPreset]);

  // Load preset on initial mount
  React.useEffect(() => {
    loadCurrentPreset();
  }, [loadCurrentPreset]);
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { logout, authState } = useAuth();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const cancelSyncRef = React.useRef(false);

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

  async function parseGmailMessage(msg, token, preset: Preset | null) {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch Gmail message details");
    const data = await res.json();
    let subject = "";
    let body = "";
    let sender = "";
    
    if (data.payload && data.payload.headers) {
      const subjectHeader = data.payload.headers.find(
        (h) => h.name.toLowerCase() === "subject"
      );
      if (subjectHeader) subject = subjectHeader.value;
      
      // Extract sender information (From header)
      const fromHeader = data.payload.headers.find(
        (h) => h.name.toLowerCase() === "from"
      );
      if (fromHeader) sender = fromHeader.value;
    }
    
    if (data.payload && data.payload.parts) {
      for (const part of data.payload.parts) {
        if (part.mimeType === "text/plain" && part.body && part.body.data) {
          body += decodeURIComponent(
            escape(
              window.atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"))
            )
          );
        }
      }
    } else if (data.payload && data.payload.body && data.payload.body.data) {
      body += decodeURIComponent(
        escape(
          window.atob(
            data.payload.body.data.replace(/-/g, "+").replace(/_/g, "/")
          )
        )
      );
    }

    let shouldDelete = false;
    if (preset) {
      // Use PresetUtils to check if email matches preset criteria (including sender)
      shouldDelete = PresetUtils.doesEmailMatchPreset(subject, body, sender, preset);
    }
    if (shouldDelete) {
      await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/trash`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setDeletedMailLog((prev) => {
        // If user is at end, scroll after update
        if (isAtEnd && scrollViewRef.current) {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
        // Include sender info in the log entry
        const logEntry = sender ? `${subject} (from: ${sender})` : subject;
        return [...prev, logEntry];
      });
      console.log(`Deleted mail: ${subject} (from: ${sender})`);
    } else {
      console.log("Email subject:", subject, "from:", sender);
    }
    // await new Promise((r) => setTimeout(r, 50));
    return data;
  }

  const COOLDOWN_MS = 10;

  async function syncGmailMessages(token) {
    let nextPageToken = undefined;
    let totalParsed = 0;
    setSyncing(true);
    setSyncProgress(0);
    cancelSyncRef.current = false;
    let cancelled = false;

    // Use the current preset from state
    if (!currentPreset) {
      setSyncing(false);
      return;
    }
    try {
      let shouldBreak = false;
      do {
        if (cancelSyncRef.current) {
          cancelled = true;
          shouldBreak = true;
          break;
        }
        const { messages, nextPageToken: newToken } = await getGmailMessages(
          token,
          nextPageToken
        );
        for (const msg of messages) {
          if (cancelSyncRef.current) {
            cancelled = true;
            shouldBreak = true;
            break;
          }
          await parseGmailMessage(msg, token, currentPreset);
          totalParsed++;
          setSyncProgress(totalParsed);
          if (cancelSyncRef.current) {
            cancelled = true;
            shouldBreak = true;
            break;
          }
          // await new Promise((r) => setTimeout(r, COOLDOWN_MS));
        }
        if (shouldBreak) break;
        nextPageToken = newToken;
        if (cancelSyncRef.current) {
          cancelled = true;
          break;
        }
        // await new Promise((r) => setTimeout(r, COOLDOWN_MS));
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
    console.log("Starting Gmail sync with token:", token);
    await syncGmailMessages(token);
  };

  const handleCancelSync = () => {
    cancelSyncRef.current = true;
    setSyncing(false);
  };

  // selectedPreset is now just currentPreset
  const selectedPreset = currentPreset;

  return (
    <Screen useSafeArea>
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

      <View style={styles.presetInfoContainer}>
        {selectedPreset ? (
          <>
            <Text style={[styles.presetTitle, { color: theme.text }]}>
              Preset: {selectedPreset.name}
            </Text>
            <Text style={[styles.presetDesc, { color: theme.textSecondary }]}>
              {selectedPreset.description}
            </Text>
            <Text
              style={[styles.presetSummary, { color: theme.textSecondary }]}
            >
              {PresetUtils.getPresetSummary(selectedPreset)}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.presetTitle, { color: theme.textSecondary }]}>
              No preset selected
            </Text>
            <Text style={[styles.presetDesc, { color: theme.textSecondary }]}>
              Please select a preset to start cleaning emails
            </Text>
          </>
        )}
      </View>

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
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1 }}
        onScroll={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } =
            e.nativeEvent;
          // If user is within 30px of the end, consider at end
          setIsAtEnd(
            layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 30
          );
        }}
        scrollEventThrottle={32}
      >
        {/* Deleted mail log */}
        {deletedMailLog.length > 0 && (
          <View style={styles.deletedLogContainer}>
            <Text style={[styles.deletedLogTitle, { color: theme.text }]}>
              Deleted Mails ({deletedMailLog.length})
            </Text>
            {deletedMailLog.map((subject, idx) => (
              <View key={idx} style={styles.deletedLogItemRow}>
                <Trash2
                  size={18}
                  color={theme.error || "#d32f2f"}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.deletedLogItemSubject,
                    { color: theme.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {subject}
                </Text>
              </View>
            ))}
          </View>
        )}
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
          disabled={syncing || !currentPreset}
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
  deletedLogContainer: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: "rgba(220,38,38,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(220,38,38,0.18)",
    shadowColor: "#d32f2f",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  deletedLogTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  deletedLogItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(220,38,38,0.12)",
  },
  deletedLogItemSubject: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  presetInfoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  presetDesc: {
    fontSize: 14,
    marginBottom: 2,
  },
  presetSummary: {
    fontSize: 12,
    fontStyle: "italic",
    opacity: 0.8,
  },
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
