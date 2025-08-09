import { Layout, Button, Dropdown, Space, Avatar } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  UserAddOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { Link, replace, useNavigate } from "react-router-dom";
import "./Header.css";
import { useEffect, useState } from "react";

import { getCurrentUser, signOut } from "aws-amplify/auth";
import axios from "axios";

const { Header: AntHeader } = Layout;

const Header = ({ isLoggedIn, onLogout, toggleSidebar, collapsed }) => {
  const API_URL = import.meta.env.VITE_BASE_API_URL;
  const navigate = useNavigate();
  const [user1, setUser1] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoggedIn) {
        setUser1(null);
        return;
      }

      try {
        const userData = await getCurrentUser();

        const response = await axios.get(
          `${API_URL}/user/${userData.username}`
        );

        if (response.status == 200) {
          console.log("API RES:", response);
          console.log("user:", user1);
          setUser1(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUser1(null);
      }
    };

    fetchUserData();
    console.log("Rerendered");
  }, [isLoggedIn]);

  const handleSignout = async () => {
    setUser1(null);
    window.dispatchEvent(new Event("user-logout"));

    await signOut();
    onLogout();
    navigate("/login", { replace: true });
  };

  const userMenuItems = [
    {
      key: "1",
      label: <Link to="/profile">Profile</Link>,
      icon: <ProfileOutlined />,
    },
    {
      key: "2",
      label: <span>Logout</span>,
      icon: <LogoutOutlined />,
      onClick: handleSignout,
    },
  ];

  return (
    <AntHeader className="custom-header">
      <div className="header-left">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          className="toggle-button"
        />
        <Link to="/" className="brand-link">
          <h1 className="brand-title">BikerTown</h1>
        </Link>
      </div>

      <div>
        {isLoggedIn ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space className="avatar-dropdown">
              <Avatar
                style={{ backgroundColor: "#f5222d" }}
                icon={<UserOutlined />}
              />
              <span>{user1?.display_name || "User"}</span>
              {/* <span>{user1}</span> */}
            </Space>
          </Dropdown>
        ) : (
          <Space>
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
            <Button
              icon={<UserAddOutlined />}
              onClick={() => navigate("/register")}
            >
              Register
            </Button>
          </Space>
        )}
      </div>
    </AntHeader>
  );
};

export default Header;
