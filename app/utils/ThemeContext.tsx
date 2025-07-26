import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { StorageKey, StorageUtils } from "./Storage";

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  divider: string;
  accent: string;
  disabled: string;
  placeholder: string;
  card: string;
  cardHeader: string;
  border: string;
  shadow: string;
  highlight: string;
  link: string;
  notification: string;
  backdrop: string;
  surfaceHover: string;
  surfaceActive: string;
  buttonText: string;
  inputBackground: string;
}

interface ThemeContextType {
  theme: ThemeColors;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const lightTheme: ThemeColors = {
  primary: "#2D9CDB",
  secondary: "#27AE60",
  background: "#F2F2F2",
  surface: "#FFFFFF",
  text: "#333333",
  textSecondary: "#828282",
  error: "#EB5757",
  success: "#27AE60",
  warning: "#F2994A",
  info: "#2D9CDB",
  divider: "#E0E0E0",
  accent: "#27AE60",
  disabled: "#BDBDBD",
  placeholder: "#828282",
  card: "#FFFFFF",
  cardHeader: "#F9F9F9",
  border: "#E0E0E0",
  shadow: "rgba(0, 0, 0, 0.08)",
  highlight: "#56CCF2",
  link: "#2D9CDB",
  notification: "#F2994A",
  backdrop: "rgba(0, 0, 0, 0.05)",
  surfaceHover: "#E0E0E0",
  surfaceActive: "#F2F2F2",
  buttonText: "#FFFFFF",
  inputBackground: "#F2F2F2",
};

const darkTheme: ThemeColors = {
  primary: "#2D9CDB",
  secondary: "#27AE60",
  background: "#121212",
  surface: "#1E1E1E",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  error: "#EB5757",
  success: "#27AE60",
  warning: "#F2994A",
  info: "#2D9CDB",
  divider: "#333333",
  accent: "#27AE60",
  disabled: "#616161",
  placeholder: "#828282",
  card: "#252525",
  cardHeader: "#1E1E1E",
  border: "#333333",
  shadow: "rgba(0, 0, 0, 0.24)",
  highlight: "#1B75BC",
  link: "#56CCF2",
  notification: "#F2994A",
  backdrop: "rgba(0, 0, 0, 0.7)",
  surfaceHover: "#333333",
  surfaceActive: "#252525",
  buttonText: "#FFFFFF",
  inputBackground: "#1E1E1E",
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme from storage or default to light theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return StorageUtils.get(StorageKey.APP_THEME);
  });

  const theme = isDarkMode ? darkTheme : lightTheme;

  // Toggle theme and save preference to storage
  const toggleTheme = (): void => {
    setIsDarkMode((prevMode) => {
      const newMode = !prevMode;
      StorageUtils.set(StorageKey.APP_THEME, newMode);
      return newMode;
    });
  };

  // Effect to handle system theme changes or initial load
  useEffect(() => {
    // You could add system theme detection here if needed
    // For now, we're just ensuring the stored preference is applied
    const savedPreference = StorageUtils.get(StorageKey.APP_THEME);
    if (savedPreference !== isDarkMode) {
      setIsDarkMode(Boolean(savedPreference));
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
