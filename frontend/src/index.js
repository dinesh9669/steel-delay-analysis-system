// frontend/src/index.js
// Entry point — loads global CSS before rendering React
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";       // Dark industrial theme tokens + animations
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);
