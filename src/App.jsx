import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Applayout from "./components/navbar/Applayout";
import Home from "./pages/Home";
import Hadith from "./pages/Hadith";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Quran from "./pages/Quran";
import Surah from "./pages/Surah";


const router = createBrowserRouter([
  {
    path: "/",
    element: <Applayout/>,   // Main wrapper with Navbar + Footer
    children: [
      { path: "", element: <Home /> },   // default route
      { path: "quran", element: <Quran /> },
      { path: "quran/:index", element: <Surah /> },
      { path: "hadith", element: <Hadith /> },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
