import { Form, Input, Button, App } from "antd";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message: antdMessage } = App.useApp();

  const handleLoginSubmit = (values) => {
    if (values.email === "user@gmail.com" && values.password === "123") {
      const userData = { email: values.email, name: "Rider User" };
      localStorage.setItem("user", JSON.stringify(userData)); 
      window.dispatchEvent(new Event("user-login")); 
      antdMessage.success("Login successful!");
      form.resetFields();
      navigate("/"); 
    } else {
        antdMessage.error("Invalid credentials. Try user@gmail.com/123");
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
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
        <div className="form-footer">
          Don't have an account? <a href="/register">Register now</a>
        </div>
      </Form>
    </div>
  );
};

export default Login;
