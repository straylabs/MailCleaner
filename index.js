import { registerRootComponent } from "expo";
import App from "./App";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Creds } from "./Creds";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
GoogleSignin.configure({
  scopes: [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
  ],
  // webClientId: "366498185361-0ip5o0mi3nkmb0t2s049gkr4esodkca6.apps.googleusercontent.com",
  webClientId: Creds.GOOGLE_WEB_CLIENT_ID,
  iosClientId: Creds.GOOGLE_IOS_CLIENT_ID,
  forceCodeForRefreshToken: true,
});

registerRootComponent(App);
