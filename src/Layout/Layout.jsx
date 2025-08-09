import { useState, useEffect } from "react";
import { Layout, ConfigProvider, theme } from "antd";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import Sidebar from "../components/Sidebar/Sidebar";
import "./Layout.css";
import { AuthContext } from "../contexts/AuthContext";
import { fetchAuthSession } from "aws-amplify/auth";

const { Content } = Layout;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // const [user, setUser] = useState(null);
  // const [user, setUser] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Check login state on location changes
  useEffect(() => {
    const checkLoginState = async () => {
      const authSession = await fetchAuthSession();
      const storedUser = authSession.tokens.accessToken.toString();

      if (storedUser) {
        try {
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Error fetching user data:", error);

          if (error.response && error.response.status == 401) {
            console.log("Token is invalid.");
            message.error("Session expired");
            navigate("/login");
          }
        }
      } else {
        setIsLoggedIn(false);

        const protectedRoutes = [
          "/schedules",
          "/todo",
          "/history",
          "/friends",
          "/messages",
          "/profile",
          "/meeting",
          "/room",
          "/home",
        ];

        if (protectedRoutes.includes(location.pathname)) {
          navigate("/", { replace: true });
        }
      }
    };

    checkLoginState();

    if (/^\/trips\/\d+/.test(location.pathname)) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [location.pathname, navigate]);

  // Listen for custom login/logout events to update state immediately
  useEffect(() => {
    const handleUserChange = async () => {
      const authSession = await fetchAuthSession();
      const storedUser = authSession.tokens.accessToken.toString();

      if (storedUser) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    };

    window.addEventListener("user-login", handleUserChange);
    window.addEventListener("user-logout", handleUserChange);

    return () => {
      window.removeEventListener("user-login", handleUserChange);
      window.removeEventListener("user-logout", handleUserChange);
    };
  }, [location.pathname, navigate]);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);

    window.dispatchEvent(new Event("user-logout")); // Notify layout immediately
    navigate("/", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn }}>
      <ConfigProvider
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: "#f5222d",
            borderRadius: 6,
          },
        }}
      >
        <Layout className="full-height-layout">
          {isLoggedIn && (
            <Sidebar collapsed={collapsed} isLoggedIn={isLoggedIn} />
          )}
          <Layout>
            <Header
              isLoggedIn={isLoggedIn}
              toggleSidebar={toggleSidebar}
              onLogout={handleLogout}
              collapsed={collapsed}
              // user={user}
            />
            <Layout className="inner-layout">
              <Content className="content-style">
                <Outlet />
              </Content>
            </Layout>
            <Footer />
          </Layout>
        </Layout>
      </ConfigProvider>
    </AuthContext.Provider>
  );
};

export default AppLayout;
