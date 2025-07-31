import { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "CleanMyMails",
  slug: "cleanmymails",
  version: "1.0.0",
  icon: "./branding/icon.png",
  newArchEnabled: true,
  userInterfaceStyle: "automatic",
  android: {
    package: "com.straylabs.cleanmymails",
    versionCode: 1,
    edgeToEdgeEnabled: true,
  },
  ios: {
    bundleIdentifier: "com.straylabs.cleanmymails",
    buildNumber: "1",
    icon: "./branding/icon.png",
  },
  web: {
    bundler: "metro",
  },
  plugins: [
    "expo-font",
    [
      "expo-notifications",
      {
        icon: "./branding/icon.png",
        color: "#2D9CDB",
        defaultChannel: "email-cleaning",
        sounds: ["./assets/notification.wav"],
      },
    ],
    [
      "expo-task-manager",
      {
        enabledServices: ["background-sync"],
      },
    ],
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme:
          "com.googleusercontent.apps.366498185361-8pf5q4lglcn0j4mdn234iuhk7qu28siv",
      },
    ],
  ],
};

export default config;
