import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ConfigProvider, App as AntdApp } from "antd";
import { Authenticator } from "@aws-amplify/ui-react";
// import ErrorBoundary from "./ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Authenticator>
      <ConfigProvider>
        <AntdApp>
          <App />
        </AntdApp>
      </ConfigProvider>
    </Authenticator>
  </React.StrictMode>
);
