import React, { useState, useEffect } from "react";
import { Moon } from "lucide-react";

function ThemeSettings() {
  const [theme, setTheme] = useState("light");
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Local state to replace useSidebar

  useEffect(() => {
    // Retrieve the saved theme from localStorage or default to 'light'
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.className = savedTheme;
  }, []);

  const toggleTheme = (selectedTheme) => {
    // Update the class on the root element
    document.documentElement.className = selectedTheme;
    // Update state and save the theme in localStorage
    setTheme(selectedTheme);
    localStorage.setItem("theme", selectedTheme);
  };

  return (
    <div>
      <main className="relative">
        <div className="flex justify-center">
          <div className={isSidebarExpanded ? "w-[280px]" : "hidden"}>
            {isSidebarExpanded ? (
              <select
                value={theme}
                onChange={(e) => toggleTheme(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="" disabled>
                  Select a theme
                </option>
                <option value="light">Peppermint Light</option>
                <option value="dark">Peppermint Dark</option>
                <option value="solarized-light">Solarized Light</option>
                <option value="forest">Forest</option>
                <option value="material-light">Material Light</option>
                <option value="github-light">GitHub Light</option>
              </select>
            ) : (
              <Moon className="size-4" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ThemeSettings;