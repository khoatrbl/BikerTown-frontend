import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ConfigProvider, App as AntdApp } from "antd";
import ErrorBoundary from './ErrorBoundary';

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AntdApp>
        <App />
      </AntdApp>
    </ErrorBoundary>
  </React.StrictMode>
);
