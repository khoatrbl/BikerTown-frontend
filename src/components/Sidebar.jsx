"use client";

import { useState, useEffect } from "react";
import { Layout, Menu } from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  HistoryOutlined,
  MessageOutlined,
  EnvironmentOutlined,
  CheckSquareOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/img/helmetlogo.jpg";

const { Sider } = Layout;

const Sidebar = ({ collapsed, isLoggedIn }) => {
  const location = useLocation();
  const [selectedKey, setSelectedKey] = useState("home");

  useEffect(() => {
    const path = location.pathname.split("/")[1] || "home";
    setSelectedKey(path);
  }, [location]);

  const menuItems = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: <Link to="/">Home</Link>,
      disabled: false,
    },
    {
      key: "meeting",
      icon: <VideoCameraOutlined />,
      label: <Link to="/meeting">Meeting</Link>,
      disabled: !isLoggedIn,
    },
    {
      key: "planners",
      icon: <EnvironmentOutlined />,
      label: <Link to="/planners">Planners</Link>,
      disabled: !isLoggedIn,
    },
    {
      key: "todo",
      icon: <CheckSquareOutlined />,
      label: <Link to="/todo">To Do</Link>,
      disabled: !isLoggedIn,
    },
    {
      key: "history",
      icon: <HistoryOutlined />,
      label: <Link to="/history">History</Link>,
      disabled: !isLoggedIn,
    },
    {
      key: "friends",
      icon: <TeamOutlined />,
      label: <Link to="/friends">Friends</Link>,
      disabled: !isLoggedIn,
    },
    {
      key: "messages",
      icon: <MessageOutlined />,
      label: <Link to="/messages">Messages</Link>,
      disabled: !isLoggedIn,
    },
  ];

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      theme="light"
      style={{
        overflow: "auto",
        height: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        className="logo"
        style={{
          height: "64px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "16px 0",
        }}
      >
        <img
          src={logo}
          alt="Motorbike Riders Logo"
          style={{
            marginRight: 10,
            height: 40,
            width: 40,
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      </div>
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        style={{ borderRight: 0 }}
      />
      {isLoggedIn && (
        <div
          style={{
            padding: "16px",
            textAlign: "center",
            color: "#f5222d",
            display: collapsed ? "none" : "block",
            position: "absolute",
            bottom: "20px",
            width: "100%",
          }}
        >
          <p>Next: Sunday 10:00 AM</p>
          <p>Ngã Tư Hàng Xanh</p>
        </div>
      )}
    </Sider>
  );
};

export default Sidebar;
