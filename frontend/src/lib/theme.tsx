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

const normalizeThemeKey = (value: string | null): ThemeType => {
  if (value === "pastel") return "cotton-candy";
  if (value === "cotton-candy") return "cotton-candy";
  if (value === "coffee") return "coffee";
  if (value === "rose") return "rose";
  return "default";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Initialize theme from localStorage immediately to prevent flash
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const savedTheme = localStorage.getItem("theme");
    const initialTheme = normalizeThemeKey(savedTheme);
    // Set DOM attribute immediately on initial render
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", initialTheme);
    }
    return initialTheme;
  });
  const [ownedThemes, setOwnedThemes] = useState<ThemeType[]>(["default"]);
  const api = useApi();
  const { isLoading, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (typeof window === "undefined" || isLoading) {
      return;
    }

    if (!isAuthenticated) {
      setOwnedThemes(["default"]);
      const savedTheme = localStorage.getItem("theme");
      const normalized = normalizeThemeKey(savedTheme);
      if (normalized !== "default") {
        localStorage.setItem("theme", "default");
        setThemeState("default");
      }
      return;
    }

    let cancelled = false;
    api
      .getOwnedItems()
      .then((items) => {
        if (cancelled) return;
        const themes: ThemeType[] = ["default"];
        if (items.some((item) => item.item_id === "coffee-theme")) {
          themes.push("coffee");
        }
        if (items.some((item) => item.item_id === "cotton-candy-theme" || item.item_id === "pastel-theme")) {
          themes.push("cotton-candy");
        }
        if (items.some((item) => item.item_id === "rose-theme")) {
          themes.push("rose");
        }
        setOwnedThemes(themes);

        const savedTheme = normalizeThemeKey(localStorage.getItem("theme"));
        if (themes.includes(savedTheme)) {
          setThemeState((current) => (current === savedTheme ? current : savedTheme));
        } else {
          localStorage.setItem("theme", "default");
          setThemeState("default");
        }
      })
      .catch((err) => console.error("Failed to load theme:", err));

    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated]);

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
