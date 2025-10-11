import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Palette } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useApp } from "@/contexts/AppContext";

const themes = [
  { name: "Blue", colors: { primary: "221 83% 53%", accent: "221 83% 63%" } },
  { name: "Green", colors: { primary: "142 76% 36%", accent: "142 76% 46%" } },
  { name: "Purple", colors: { primary: "271 81% 56%", accent: "271 81% 66%" } },
  { name: "Orange", colors: { primary: "25 95% 53%", accent: "25 95% 63%" } },
  { name: "Pink", colors: { primary: "330 81% 60%", accent: "330 81% 70%" } },
];

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useApp();
  const [selectedTheme, setSelectedTheme] = useState(0);

  useEffect(() => {
    const savedTheme = parseInt(localStorage.getItem("theme-color") || "0");
    setSelectedTheme(savedTheme);
    applyColorTheme(savedTheme);
  }, []);

  const applyColorTheme = (themeIndex: number) => {
    const root = document.documentElement;
    const colorTheme = themes[themeIndex];
    root.style.setProperty("--primary", colorTheme.colors.primary);
    root.style.setProperty("--accent", colorTheme.colors.accent);
  };

  const toggleDarkMode = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    toast.success(t(newTheme === 'dark' ? 'theme.darkActivated' : 'theme.lightActivated'));
  };

  const changeTheme = (index: number) => {
    setSelectedTheme(index);
    localStorage.setItem("theme-color", String(index));
    applyColorTheme(index);
    toast.success(`${themes[index].name} ${t('theme.applied')}`);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          {t('theme.settings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-3">{t('theme.appearance')}</h4>
          <div className="flex gap-3">
            <Button
              variant={theme === 'dark' ? "default" : "outline"}
              onClick={toggleDarkMode}
              className="flex-1"
            >
              <Moon className="h-4 w-4 mr-2" />
              {t('theme.dark')}
            </Button>
            <Button
              variant={theme === 'light' ? "default" : "outline"}
              onClick={toggleDarkMode}
              className="flex-1"
            >
              <Sun className="h-4 w-4 mr-2" />
              {t('theme.light')}
            </Button>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">{t('theme.colorTheme')}</h4>
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
