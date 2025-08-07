import AppRoutes from "./routes/routes";
import "antd/dist/reset.css"; // Add this line for Ant Design styles
import "./App.css";

import { useEffect } from "react";
import { Amplify } from "aws-amplify";

function App() {
  useEffect(() => {
    const config = Amplify.getConfig();
    console.log("Loaded config:", config);
  }, []);

  return (
    <>
      <AppRoutes />
    </>
  );
}

export default App;
