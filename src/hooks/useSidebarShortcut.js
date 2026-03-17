import { useEffect } from "react";

const useSidebarShortcut = (setIsSidebarOpen) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + K
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault(); // default browser search disable
        setIsSidebarOpen((prev) => !prev); // toggle sidebar
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsSidebarOpen]);
};

export default useSidebarShortcut;
