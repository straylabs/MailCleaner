import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { StorageKey, StorageUtils } from "./Storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
interface AuthState {
  isAuthenticated: boolean;
  accessToken?: string | null;
  idToken?: string | null;
  userName?: string | null;
  userAvatar?: string | null;
}

interface AuthContextType {
  authState: AuthState;
  login: () => void;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  idToken: null,
  userName: null,
  userAvatar: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const storedState = StorageUtils.get<AuthState>(StorageKey.AUTH_STATE);
    return storedState || defaultAuthState;
  });

  // Google Sign-In logic
  const login = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens(); // { accessToken, idToken }
      const accessToken = tokens.accessToken ?? null;
      const idToken = tokens.idToken ?? null;
      // Try userInfo.name and userInfo.photo (based on docs)
      const userName = userInfo?.data.user?.name ?? null;
      const userAvatar = userInfo?.data.user?.photo ?? null;
      StorageUtils.set(StorageKey.GOOGLE_TOKEN, { accessToken, idToken });
      StorageUtils.set(StorageKey.AUTH_STATE, {
        isAuthenticated: true,
        accessToken,
        idToken,
        userName,
        userAvatar,
      });
      setAuthState({
        isAuthenticated: true,
        accessToken,
        idToken,
        userName,
        userAvatar,
      });
    } catch (error) {
      console.error("Google Sign-In error:", error);
    }
  };

  const logout = async () => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      // Ignore if not signed in
    }
    StorageUtils.delete(StorageKey.GOOGLE_TOKEN);
    setAuthState(defaultAuthState);
    StorageUtils.set(StorageKey.AUTH_STATE, defaultAuthState);
  };

  useEffect(() => {
    const storedState = StorageUtils.get<AuthState>(StorageKey.AUTH_STATE);
    if (storedState) {
      setAuthState(storedState);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
