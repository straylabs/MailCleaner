import { useState, useEffect, useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import * as Notifications from "expo-notifications";
import {
  BackgroundTaskManager,
  BackgroundTaskState,
  DeletedMessage,
  TaskProgress,
} from "./BackgroundTaskManager";
import { useAuth } from "./AuthContext";
import { PresetUtils } from "./PresetUtils";
import { Preset } from "@/screens/PresetsScreen";

export interface SyncState {
  isRunning: boolean;
  progress: TaskProgress;
  backgroundTaskState: BackgroundTaskState;
  deletedMessages: DeletedMessage[];
  canRunInBackground: boolean;
}

export const useSyncManager = () => {
  const { authState } = useAuth();
  const [syncState, setSyncState] = useState<SyncState>({
    isRunning: false,
    progress: { processed: 0, deleted: 0 },
    backgroundTaskState: BackgroundTaskManager.getBackgroundTaskState(),
    deletedMessages: BackgroundTaskManager.getDeletedMessages(),
    canRunInBackground: false,
  });

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Load initial state
  useEffect(() => {
    loadSyncState();
    requestNotificationPermissions();
  }, []);

  // Listen for app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, []);

  // Set up notification listener
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );
    return () => subscription.remove();
  }, []);

  // Poll for updates when sync is running
  useEffect(() => {
    if (syncState.isRunning || syncState.backgroundTaskState.isRunning) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [syncState.isRunning, syncState.backgroundTaskState.isRunning]);

  const loadSyncState = useCallback(() => {
    const backgroundTaskState = BackgroundTaskManager.getBackgroundTaskState();
    const progress = BackgroundTaskManager.getSyncProgress();
    const deletedMessages = BackgroundTaskManager.getDeletedMessages();

    setSyncState((prev) => ({
      ...prev,
      backgroundTaskState,
      progress,
      deletedMessages,
    }));
  }, []);

  const requestNotificationPermissions = useCallback(async () => {
    const hasPermission =
      await BackgroundTaskManager.requestNotificationPermissions();
    setSyncState((prev) => ({
      ...prev,
      canRunInBackground: hasPermission,
    }));
  }, []);

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      if (appStateRef.current === "active" && nextAppState === "background") {
        // App went to background
        console.log("App went to background");

        // If sync is running in foreground only, try to transition to background
        if (
          syncState.isRunning &&
          !syncState.backgroundTaskState.isRunning &&
          syncState.canRunInBackground
        ) {
          console.log("Transitioning sync to background mode");
          transitionToBackgroundSync();
        }
      } else if (
        appStateRef.current === "background" &&
        nextAppState === "active"
      ) {
        // App came to foreground
        console.log("App came to foreground");
        loadSyncState(); // Refresh state when app becomes active
      }
      appStateRef.current = nextAppState;
    },
    [
      loadSyncState,
      syncState.isRunning,
      syncState.backgroundTaskState.isRunning,
      syncState.canRunInBackground,
    ]
  );

  const handleNotificationReceived = useCallback(
    (notification: Notifications.Notification) => {
      console.log("Notification received:", notification);
      // Refresh state when notification is received
      loadSyncState();
    },
    [loadSyncState]
  );

  const startPolling = useCallback(() => {
    if (syncIntervalRef.current) return;

    syncIntervalRef.current = setInterval(() => {
      loadSyncState();
    }, 2000); // Poll every 2 seconds
  }, [loadSyncState]);

  const stopPolling = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  const transitionToBackgroundSync = useCallback(async () => {
    if (!authState.accessToken || !syncState.canRunInBackground) {
      return;
    }

    const currentPreset = PresetUtils.getCurrentPreset();
    if (!currentPreset) {
      return;
    }

    try {
      console.log("Transitioning to background sync...");

      // Send notification about transition
      await BackgroundTaskManager.sendNotification(
        "Email Cleaning Continues",
        "Moving to background mode with notifications",
        { type: "background_transition" },
        { priority: "default" }
      );

      // Start background task with current progress
      await BackgroundTaskManager.startBackgroundTask(
        authState.accessToken,
        currentPreset
      );

      // Update state to reflect background mode
      setSyncState((prev) => ({
        ...prev,
        isRunning: false, // No longer running in foreground
      }));
    } catch (error) {
      console.error("Failed to transition to background:", error);
    }
  }, [authState.accessToken, syncState.canRunInBackground]);

  const startSync = useCallback(
    async (runInBackground: boolean = false) => {
      if (!authState.accessToken) {
        throw new Error("No access token available");
      }

      const currentPreset = PresetUtils.getCurrentPreset();
      if (!currentPreset) {
        throw new Error("No preset selected");
      }

      setSyncState((prev) => ({
        ...prev,
        isRunning: true,
      }));

      try {
        if (runInBackground && syncState.canRunInBackground) {
          // Start background task with continuation enabled
          BackgroundTaskManager.setShouldContinueInBackground(true);
          await BackgroundTaskManager.startBackgroundTask(
            authState.accessToken,
            currentPreset
          );
        } else {
          // Run in foreground but allow background continuation if permissions exist
          BackgroundTaskManager.setShouldContinueInBackground(
            syncState.canRunInBackground
          );
          await runForegroundSync(authState.accessToken, currentPreset);
        }
      } catch (error) {
        console.error("Error starting sync:", error);
        setSyncState((prev) => ({
          ...prev,
          isRunning: false,
        }));
        throw error;
      }
    },
    [authState.accessToken, syncState.canRunInBackground]
  );

  const runForegroundSync = useCallback(
    async (token: string, preset: Preset) => {
      try {
        // Use the background-aware sync task which handles both foreground and background
        await BackgroundTaskManager.runSyncTask(token, preset);

        // Update local state when completed
        setSyncState((prev) => ({
          ...prev,
          isRunning: false,
          progress: BackgroundTaskManager.getSyncProgress(),
          backgroundTaskState: BackgroundTaskManager.getBackgroundTaskState(),
          deletedMessages: BackgroundTaskManager.getDeletedMessages(),
        }));
      } catch (error) {
        console.error("Foreground sync error:", error);

        setSyncState((prev) => ({
          ...prev,
          isRunning: false,
          backgroundTaskState: BackgroundTaskManager.getBackgroundTaskState(),
        }));

        throw error;
      }
    },
    []
  );

  const stopSync = useCallback(async () => {
    setSyncState((prev) => ({
      ...prev,
      isRunning: false,
    }));

    await BackgroundTaskManager.stopBackgroundTask();
    loadSyncState();
  }, [loadSyncState]);

  const clearDeletedMessages = useCallback(() => {
    BackgroundTaskManager.clearDeletedMessages();
    setSyncState((prev) => ({
      ...prev,
      deletedMessages: [],
    }));
  }, []);

  const refreshState = useCallback(() => {
    loadSyncState();
  }, [loadSyncState]);

  return {
    syncState,
    startSync,
    stopSync,
    clearDeletedMessages,
    refreshState,
    requestNotificationPermissions,
  };
};
