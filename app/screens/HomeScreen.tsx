import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useTheme } from "@/utils/ThemeContext";
import Screen from "@/components/Screen";
import { Preset } from "@/screens/PresetsScreen";
import { PresetUtils } from "@/utils/PresetUtils";
import { useAuth } from "@/utils/AuthContext";
import Avatar from "@/components/Avatar";
import CustomAlert from "@/components/CustomAlert";
import {
  Sun,
  Moon,
  LogOut,
  Trash2,
  Bell,
  BellOff,
  Play,
  Square,
  RotateCcw,
} from "lucide-react-native";
import { AppScreenProps } from "@/navigation/types";
import Button from "@/components/Button";
import { useSyncManager } from "@/utils/useSyncManager";

type HomeScreenProps = AppScreenProps<"Home">;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [isAtEnd, setIsAtEnd] = useState(true);
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null);

  // Use the sync manager hook
  const {
    syncState,
    startSync,
    stopSync,
    clearDeletedMessages,
    refreshState,
    requestNotificationPermissions,
  } = useSyncManager();

  // Load current preset when component mounts or when navigation focuses
  const loadCurrentPreset = React.useCallback(() => {
    const preset = PresetUtils.getCurrentPreset();
    setCurrentPreset(preset);
  }, []);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadCurrentPreset();
      refreshState();
    });
    return unsubscribe;
  }, [navigation, loadCurrentPreset, refreshState]);

  // Load preset on initial mount
  React.useEffect(() => {
    loadCurrentPreset();
  }, [loadCurrentPreset]);

  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { logout, authState } = useAuth();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  // Auto-scroll to end when new messages are deleted
  React.useEffect(() => {
    if (
      isAtEnd &&
      scrollViewRef.current &&
      syncState.deletedMessages.length > 0
    ) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [syncState.deletedMessages.length, isAtEnd]);

  const handleStartSync = async (runInBackground: boolean = false) => {
    if (!currentPreset) {
      Alert.alert("Error", "Please select a preset first");
      return;
    }

    try {
      await startSync(runInBackground);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to start sync");
    }
  };

  const handleStopSync = async () => {
    try {
      await stopSync();
    } catch (error) {
      Alert.alert("Error", "Failed to stop sync");
    }
  };

  const handleClearLog = () => {
    Alert.alert(
      "Clear Log",
      "Are you sure you want to clear the deleted messages log?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: clearDeletedMessages,
        },
      ]
    );
  };

  const showSyncOptions = () => {
    if (!syncState.canRunInBackground) {
      // No notification permission, just start foreground sync
      handleStartSync(false);
      return;
    }

    Alert.alert(
      "Start Email Cleaning",
      "Choose how you want to run the email cleaning process:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Foreground Only",
          onPress: () => handleStartSync(false),
        },
        {
          text: "Background + Notifications",
          onPress: () => handleStartSync(true),
        },
      ]
    );
  };

  const formatDeletedMessagesForDisplay = () => {
    return syncState.deletedMessages.map(
      (msg) => `${msg.subject}${msg.sender ? ` (from: ${msg.sender})` : ""}`
    );
  };

  const isAnySyncRunning =
    syncState.isRunning || syncState.backgroundTaskState.isRunning;
  const totalProgress = Math.max(
    syncState.progress.processed,
    syncState.backgroundTaskState.totalProcessed
  );
  const totalDeleted = Math.max(
    syncState.progress.deleted,
    syncState.backgroundTaskState.totalDeleted
  );

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
          <TouchableOpacity
            onPress={requestNotificationPermissions}
            style={styles.iconButton}
          >
            {syncState.canRunInBackground ? (
              <Bell size={24} color={theme.primary} />
            ) : (
              <BellOff size={24} color={theme.textSecondary} />
            )}
          </TouchableOpacity>
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

      {/* Sync Status Section */}
      {(isAnySyncRunning || syncState.backgroundTaskState.lastError) && (
        <View
          style={[
            styles.syncStatusContainer,
            { backgroundColor: theme.surface },
          ]}
        >
          {isAnySyncRunning ? (
            <>
              <View style={styles.syncStatusHeader}>
                <Text
                  style={[styles.syncStatusTitle, { color: theme.primary }]}
                >
                  📧 Email Cleaning in Progress
                </Text>
                <TouchableOpacity onPress={refreshState}>
                  <RotateCcw size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Progress Statistics */}
              <Text style={[styles.syncStatusText, { color: theme.text }]}>
                Processed: {totalProgress} | Deleted: {totalDeleted}
              </Text>

              {/* Current Phase and Action */}
              {syncState.backgroundTaskState.currentPhase && (
                <Text
                  style={[
                    styles.syncStatusText,
                    { color: theme.textSecondary, fontSize: 13 },
                  ]}
                >
                  Phase: {syncState.backgroundTaskState.currentPhase}
                </Text>
              )}

              {syncState.progress.currentAction && (
                <Text
                  style={[
                    styles.syncStatusSubtext,
                    { color: theme.textSecondary },
                  ]}
                >
                  {syncState.progress.currentAction}
                </Text>
              )}

              {/* Progress Bar */}
              {syncState.progress.percentage !== undefined && (
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: theme.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          backgroundColor: theme.primary,
                          width: `${Math.min(
                            syncState.progress.percentage,
                            100
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.progressText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {Math.round(syncState.progress.percentage)}%
                  </Text>
                </View>
              )}

              {/* Estimated Time Remaining */}
              {syncState.backgroundTaskState.estimatedTimeRemaining &&
                syncState.backgroundTaskState.estimatedTimeRemaining > 0 && (
                  <Text
                    style={[
                      styles.syncStatusSubtext,
                      { color: theme.textSecondary },
                    ]}
                  >
                    ⏱️ Est.{" "}
                    {Math.round(
                      syncState.backgroundTaskState.estimatedTimeRemaining / 60
                    )}
                    m remaining
                  </Text>
                )}

              {/* Background/Foreground indicator */}
              {syncState.backgroundTaskState.isRunning ? (
                <Text
                  style={[styles.syncStatusSubtext, { color: theme.accent }]}
                >
                  🔔 Running in background with notifications
                </Text>
              ) : (
                <Text
                  style={[styles.syncStatusSubtext, { color: theme.primary }]}
                >
                  📱 Running in foreground
                </Text>
              )}
            </>
          ) : syncState.backgroundTaskState.lastError ? (
            <>
              <Text style={[styles.syncStatusTitle, { color: theme.error }]}>
                ❌ Last Sync Error
              </Text>
              <Text
                style={[styles.syncStatusText, { color: theme.textSecondary }]}
              >
                {syncState.backgroundTaskState.lastError}
              </Text>
            </>
          ) : null}
        </View>
      )}

      <View style={styles.presetInfoContainer}>
        {currentPreset ? (
          <>
            <Text style={[styles.presetTitle, { color: theme.text }]}>
              Preset: {currentPreset.name}
            </Text>
            <Text style={[styles.presetDesc, { color: theme.textSecondary }]}>
              {currentPreset.description}
            </Text>
            <Text
              style={[styles.presetSummary, { color: theme.textSecondary }]}
            >
              {PresetUtils.getPresetSummary(currentPreset)}
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
          setIsAtEnd(
            layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 30
          );
        }}
        scrollEventThrottle={32}
      >
        {/* Deleted mail log */}
        {syncState.deletedMessages.length > 0 && (
          <View style={styles.deletedLogContainer}>
            <View style={styles.deletedLogHeader}>
              <Text style={[styles.deletedLogTitle, { color: theme.text }]}>
                Deleted Mails ({syncState.deletedMessages.length})
              </Text>
              <TouchableOpacity onPress={handleClearLog}>
                <Trash2 size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            {formatDeletedMessagesForDisplay().map((subject, idx) => (
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
        {isAnySyncRunning ? (
          <Button
            variant="destructive"
            style={styles.syncButton}
            onPress={handleStopSync}
            leftIcon={<Square size={16} color="#fff" />}
          >
            Stop
          </Button>
        ) : (
          <Button
            variant="primary"
            style={styles.syncButton}
            onPress={showSyncOptions}
            disabled={!currentPreset}
            leftIcon={<Play size={16} color="#fff" />}
          >
            Start Clean
          </Button>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  syncStatusContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(45, 156, 219, 0.2)",
  },
  syncStatusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  syncStatusTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  syncStatusText: {
    fontSize: 14,
    marginBottom: 2,
  },
  syncStatusSubtext: {
    fontSize: 12,
    fontStyle: "italic",
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    minWidth: 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "600",
    minWidth: 35,
    textAlign: "right",
  },
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
  deletedLogHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  deletedLogTitle: {
    fontSize: 17,
    fontWeight: "700",
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
