import { useEffect } from "react";

const useRightSidebarShortcut = (setIsRightOpen) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + K
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault(); // prevent default browser search
        setIsRightOpen((prev) => !prev); // toggle right sidebar
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsRightOpen]);
};

export default useRightSidebarShortcut;
