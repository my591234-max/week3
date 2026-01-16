// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
// 這裡改成引入 css 檔案，而非 scss
import "bootstrap/dist/css/bootstrap.min.css";
import App from "./App.jsx";
import "./App.css"; // 引入一般的 CSS 檔案

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
