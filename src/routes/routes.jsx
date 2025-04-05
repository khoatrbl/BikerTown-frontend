import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../Layout/Layout"; // Adjusted path to match your file name (layout.jsx)
import Home from "../pages/Home";
import Meeting from "../pages/Meeting";
import Planners from "../pages/Planners";
import Todo from "../pages/Todo";
import History from "../pages/History";
import Friends from "../pages/Friends";
import Messages from "../pages/Messages";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="meeting" element={<Meeting />} />
          <Route path="planners" element={<Planners />} />
          <Route path="todo" element={<Todo />} />
          <Route path="history" element={<History />} />
          <Route path="friends" element={<Friends />} />
          <Route path="messages" element={<Messages />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
