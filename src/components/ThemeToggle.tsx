import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeMode } from "@/hooks/useThemeMode";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeMode();

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
};

export default ThemeToggle;
