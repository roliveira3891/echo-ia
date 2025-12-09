"use client";

import { Button } from "@workspace/ui/components/button";
import { useSidebar } from "@workspace/ui/components/sidebar";
import { MenuIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export const DashboardHeader = () => {
  const { toggleSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background px-4">
      {/* Botão Toggle Sidebar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSidebar}
        className="h-9 w-9 p-0"
      >
        <MenuIcon className="size-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      {/* Espaçador */}
      <div className="flex-1" />

      {/* Botão Dark/Light Mode */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        className="h-9 w-9 p-0"
      >
        <SunIcon className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <MoonIcon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </header>
  );
};
