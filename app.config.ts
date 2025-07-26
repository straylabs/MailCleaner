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
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme:
          "com.googleusercontent.apps.366498185361-8pf5q4lglcn0j4mdn234iuhk7qu28siv",
      },
    ],
  ],
};

export default config;
