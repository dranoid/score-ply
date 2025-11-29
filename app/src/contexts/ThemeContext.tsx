import React, { createContext, useContext, useEffect } from "react";
import { useStore } from "../store/useStore";

interface ThemeContextValue {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
}

const ThemeContext = createContext<ThemeContextValue>({
    primaryColor: "#1db954",
    secondaryColor: "#121212",
    textColor: "#ffffff",
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const metadata = useStore((state) => state.audio.metadata);

    const primaryColor = metadata?.primaryColor || "#1db954";
    const secondaryColor = metadata?.secondaryColor || "#121212";
    const textColor = "#ffffff";

    useEffect(() => {
        // Apply theme colors as CSS variables
        document.documentElement.style.setProperty(
            "--primary-theme-color",
            primaryColor
        );
        document.documentElement.style.setProperty(
            "--secondary-theme-color",
            secondaryColor
        );
        document.documentElement.style.setProperty("--text-color", textColor);
    }, [primaryColor, secondaryColor, textColor]);

    return (
        <ThemeContext.Provider value={{ primaryColor, secondaryColor, textColor }}>
            {children}
        </ThemeContext.Provider>
    );
};
