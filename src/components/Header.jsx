import { useState } from "react"
import {
  Layout,
  Button,
  Modal,
  Form,
  Input,
  Dropdown,
  Space,
  Avatar,
  message,
} from "antd"
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  LoginOutlined,
  UserAddOutlined,
  ProfileOutlined
} from "@ant-design/icons"
import { Link } from "react-router-dom"

const { Header: AntHeader } = Layout

const Header = ({ isLoggedIn, onLogin, onLogout, toggleSidebar, collapsed }) => {
  const [loginModalVisible, setLoginModalVisible] = useState(false)
  const [registerModalVisible, setRegisterModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [registerForm] = Form.useForm()

  const showLoginModal = () => setLoginModalVisible(true)
  const showRegisterModal = () => setRegisterModalVisible(true)
  const handleLoginCancel = () => {
    setLoginModalVisible(false)
    form.resetFields()
  }
  const handleRegisterCancel = () => {
    setRegisterModalVisible(false)
    registerForm.resetFields()
  }

  const handleLoginSubmit = (values) => {
    if (values.email === "user@gmail.com" && values.password === "123") {
      message.success("Login successful!")
      onLogin({ email: values.email, name: "Rider User" })
      setLoginModalVisible(false)
      form.resetFields()
    } else {
      message.error("Invalid credentials. Try user@gmail.com/123")
    }
  }

  const handleRegisterSubmit = (values) => {
    message.success("Registration successful! Please login.")
    setRegisterModalVisible(false)
    setLoginModalVisible(true)
    registerForm.resetFields()
  }

  const userMenuItems = [
    {
      key: "1",
      label: <Link to="/settings">Profile</Link>,
      icon: <ProfileOutlined />,
    },
    {
      key: "2",
      label: <a onClick={onLogout}>Logout</a>,
      icon: <LogoutOutlined />,
    },
  ]

  return (
    <AntHeader
      style={{
        padding: "0 16px",
        background: "",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
        color: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          style={{ fontSize: "16px", width: 64, height: 64, color: "white" }}
        />
        <Link to="/" style={{ display: "flex", alignItems: "center" }}>
          {/* <img
            src={logo}
            alt="Motorbike Riders Logo"
            style={{
              marginRight: 10,
              height: 40,
              width: 40,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          /> */}
          <h1 style={{ margin: 0, fontSize: "1.2rem", color: "white" }}>
            BikerTown 
          </h1>
        </Link>
      </div>

      <div>
        {isLoggedIn ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: "pointer" }}>
              <Avatar style={{ backgroundColor: "#f5222d" }} icon={<UserOutlined />} />
              <span>Rider User</span>
            </Space>
          </Dropdown>
        ) : (
          <Space>
            <Button type="primary" icon={<LoginOutlined />} onClick={showLoginModal}>
              Login
            </Button>
            <Button icon={<UserAddOutlined />} onClick={showRegisterModal}>
              Register
            </Button>
          </Space>
        )}
      </div>

      {/* Login Modal */}
      <Modal
        title="Login"
        open={loginModalVisible}
        onCancel={handleLoginCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleLoginSubmit}>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please input your email!" }]}
          >
            <Input placeholder="user@gmail.com" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="123" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Login
            </Button>
          </Form.Item>
          <div style={{ textAlign: "center" }}>
            Don't have an account?{" "}
            <a
              onClick={() => {
                handleLoginCancel()
                showRegisterModal()
              }}
            >
              Register now
            </a>
          </div>
        </Form>
      </Modal>

      {/* Register Modal */}
      <Modal
        title="Register"
        open={registerModalVisible}
        onCancel={handleRegisterCancel}
        footer={null}
      >
        <Form form={registerForm} layout="vertical" onFinish={handleRegisterSubmit}>
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: "Please input your name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please input your email!" },
              { type: "email", message: "Please enter a valid email!" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(
                    new Error("The two passwords do not match!")
                  )
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Register
            </Button>
          </Form.Item>
          <div style={{ textAlign: "center" }}>
            Already have an account?{" "}
            <a
              onClick={() => {
                handleRegisterCancel()
                showLoginModal()
              }}
            >
              Login
            </a>
          </div>
        </Form>
      </Modal>
    </AntHeader>
  )
}

export default Header
