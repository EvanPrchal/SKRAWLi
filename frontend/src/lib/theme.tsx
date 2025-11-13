import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useApi } from "./api";
import { useAuth0 } from "@auth0/auth0-react";

type ThemeType = "default" | "coffee" | "cotton-candy" | "rose";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  ownedThemes: ThemeType[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize theme from localStorage immediately to prevent flash
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const savedTheme = localStorage.getItem("theme") as ThemeType | null;
    const initialTheme = savedTheme || "default";
    // Set DOM attribute immediately on initial render
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", initialTheme);
    }
    return initialTheme;
  });
  const [ownedThemes, setOwnedThemes] = useState<ThemeType[]>(["default"]);
  const api = useApi();
  const { isLoading } = useAuth0();

  useEffect(() => {
    if (!isLoading) {
      api
        .getOwnedItems()
        .then((items) => {
          const themes: ThemeType[] = ["default"];
          if (items.some((item) => item.item_id === "coffee-theme")) {
            themes.push("coffee");
          }
          if (items.some((item) => item.item_id === "cotton-candy-theme")) {
            themes.push("cotton-candy");
          }
          if (items.some((item) => item.item_id === "rose-theme")) {
            themes.push("rose");
          }
          setOwnedThemes(themes);

          const savedTheme = localStorage.getItem("theme") as ThemeType;
          // Only update if the saved theme is valid and different from current
          if (savedTheme && themes.includes(savedTheme) && savedTheme !== theme) {
            setThemeState(savedTheme);
          } else if (savedTheme && !themes.includes(savedTheme)) {
            // If user has a theme saved that they don't own, reset to default
            setThemeState("default");
            localStorage.setItem("theme", "default");
            document.documentElement.setAttribute("data-theme", "default");
          }
        })
        .catch((err) => console.error("Failed to load theme:", err));
    }
  }, [isLoading]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme, ownedThemes }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
