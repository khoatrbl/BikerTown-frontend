import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../Layout/Layout";
import Home from "../pages/Home/Home";
import Meeting from "../pages/Meeting/Meeting";
import Todo from "../pages/Todo/Todo";
import History from "../pages/History/History";
import Friends from "../pages/Friends/Friends";
import Messages from "../pages/Messages/Messages";
import Trips from "../pages/Trips/Trips";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Profile from "../pages/Profile/Profile";
import Room from "../pages/Room/Room";
import ConfirmRegister from "../pages/Register/ConfirmRegister";
import TripDetail from "../pages/TripDetail/TripDetail";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

function ProtectedRoute({ children }) {
  return (
    <Authenticator>{({ user }) => (user ? children : null)}</Authenticator>
  );
}

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Home />} />
          {/* <Route path="slider" element={<Slider />} /> */}

          {/* <Route index element={<Slider />} />
          <Route path="home" element= {<Home />}/> */}

          {/* Public Routes */}

          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="confirm-register" element={<ConfirmRegister />} />

          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="meeting"
            element={
              <ProtectedRoute>
                <Meeting />
              </ProtectedRoute>
            }
          />
          <Route
            path="room"
            element={
              <ProtectedRoute>
                <Room />
              </ProtectedRoute>
            }
          />
          <Route
            path="trips"
            element={
              <ProtectedRoute>
                <Trips />
              </ProtectedRoute>
            }
          />
          <Route
            path="todo"
            element={
              <ProtectedRoute>
                <Todo />
              </ProtectedRoute>
            }
          />
          <Route
            path="history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="friends"
            element={
              <ProtectedRoute>
                <Friends />
              </ProtectedRoute>
            }
          />
          <Route
            path="messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:trip_id"
            element={
              <ProtectedRoute>
                <TripDetail />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
