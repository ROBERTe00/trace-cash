import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Palette } from "lucide-react";
import { toast } from "sonner";

const themes = [
  { name: "Blue", colors: { primary: "221 83% 53%", accent: "221 83% 63%" } },
  { name: "Green", colors: { primary: "142 76% 36%", accent: "142 76% 46%" } },
  { name: "Purple", colors: { primary: "271 81% 56%", accent: "271 81% 66%" } },
  { name: "Orange", colors: { primary: "25 95% 53%", accent: "25 95% 63%" } },
  { name: "Pink", colors: { primary: "330 81% 60%", accent: "330 81% 70%" } },
];

export const ThemeSwitcher = () => {
  const [isDark, setIsDark] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState(0);

  useEffect(() => {
    const savedDark = localStorage.getItem("theme-dark") === "true";
    const savedTheme = parseInt(localStorage.getItem("theme-color") || "0");
    setIsDark(savedDark);
    setSelectedTheme(savedTheme);
    applyTheme(savedDark, savedTheme);
  }, []);

  const applyTheme = (dark: boolean, themeIndex: number) => {
    const root = document.documentElement;
    const theme = themes[themeIndex];

    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    root.style.setProperty("--primary", theme.colors.primary);
    root.style.setProperty("--accent", theme.colors.accent);
  };

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("theme-dark", String(newDark));
    applyTheme(newDark, selectedTheme);
    toast.success(`${newDark ? "Dark" : "Light"} mode activated`);
  };

  const changeTheme = (index: number) => {
    setSelectedTheme(index);
    localStorage.setItem("theme-color", String(index));
    applyTheme(isDark, index);
    toast.success(`${themes[index].name} theme applied`);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-3">Appearance</h4>
          <div className="flex gap-3">
            <Button
              variant={isDark ? "default" : "outline"}
              onClick={toggleDarkMode}
              className="flex-1"
            >
              <Moon className="h-4 w-4 mr-2" />
              Dark
            </Button>
            <Button
              variant={!isDark ? "default" : "outline"}
              onClick={toggleDarkMode}
              className="flex-1"
            >
              <Sun className="h-4 w-4 mr-2" />
              Light
            </Button>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Color Theme</h4>
          <div className="grid grid-cols-5 gap-3">
            {themes.map((theme, index) => (
              <button
                key={theme.name}
                onClick={() => changeTheme(index)}
                className={`h-12 rounded-lg transition-all hover:scale-105 ${
                  selectedTheme === index ? "ring-2 ring-offset-2 ring-primary" : ""
                }`}
                style={{
                  background: `hsl(${theme.colors.primary})`,
                }}
                title={theme.name}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
