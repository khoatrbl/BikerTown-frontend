import { useState, useEffect } from "react"
import { Layout, ConfigProvider, theme } from "antd"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import Header from "../components/Header"
import Footer from "../components/Footer"
import Sidebar from "../components/Sidebar"

const { Content } = Layout

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem("user")
    if (user) {
      setIsLoggedIn(true)
    } else {
      // Redirect to home if trying to access protected routes
      const protectedRoutes = ["/planners", "/todo", "/history", "/friends", "/messages"]
      if (protectedRoutes.includes(location.pathname)) {
        navigate("/")
      }
    }
  }, [location.pathname, navigate])

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  const handleLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData))
    setIsLoggedIn(true)
    navigate("/")
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    setIsLoggedIn(false)
    navigate("/")
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#f5222d",
          borderRadius: 6,
        },
      }}
    >
      <Layout style={{ minHeight: "100vh" }}>
        <Sidebar collapsed={collapsed} isLoggedIn={isLoggedIn} />
        <Layout>
          <Header
            isLoggedIn={isLoggedIn}
            onLogin={handleLogin}
            onLogout={handleLogout}
            toggleSidebar={toggleSidebar}
            collapsed={collapsed}
          />
            <Layout style={{ minHeight: "80vh"}}>
            <Content style={{ margin: "24px 16px", padding: 24, background: "rgb(241, 239, 236)", minHeight: 280, borderRadius: 20  }}>
              <Outlet />
            </Content>
            </Layout>
          <Footer />
        </Layout>
      </Layout>
    </ConfigProvider>
  )
}

export default AppLayout

