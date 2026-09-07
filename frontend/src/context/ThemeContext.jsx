import { createContext, useContext, useEffect, useState } from "react";
const ThemeContext = createContext();
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); document.body.classList.toggle("dark-mode", theme === "dark"); localStorage.setItem("theme", theme); }, [theme]);
  const toggleTheme = () => setTheme(t => t === "light" ? "dark" : "light");
  return <ThemeContext.Provider value={{theme,toggleTheme}}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
