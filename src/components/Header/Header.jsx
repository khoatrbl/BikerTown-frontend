import {
  Layout,
  Button,
  Dropdown,
  Space,
  Avatar,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  UserAddOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";

const { Header: AntHeader } = Layout;

const Header = ({ isLoggedIn, onLogout, toggleSidebar, collapsed, user }) => {
  const navigate = useNavigate();

  const userMenuItems = [
    {
      key: "1",
      label: <Link to="/settings">Profile</Link>,
      icon: <ProfileOutlined />,
    },
    {
      key: "2",
      label: <span onClick={onLogout}>Logout</span>,
      icon: <LogoutOutlined />,
      onClick: onLogout,
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
              <Avatar style={{ backgroundColor: "#f5222d" }} icon={<UserOutlined />} />
              <span>{user?.name || "User"}</span>
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
