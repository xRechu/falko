"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/hooks/useTheme";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

interface ThemeToggleProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ThemeToggle({ 
  variant = "ghost", 
  size = "sm", 
  className = "" 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={`relative overflow-hidden ${className}`}
      aria-label={`Przełącz na ${theme === "light" ? "ciemny" : "jasny"} motyw`}
    >
      <motion.div
        className="flex items-center justify-center"
        initial={false}
        animate={{
          rotate: theme === "dark" ? 180 : 0,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
      >
        {theme === "light" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </motion.div>
      
      {/* Tooltip text for larger screens */}
      <span className="sr-only">
        {theme === "light" ? "Przełącz na ciemny motyw" : "Przełącz na jasny motyw"}
      </span>
    </Button>
  );
}

export default ThemeToggle;