import { Form, Input, Button, App } from "antd";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message: antdMessage } = App.useApp();

  const handleLoginSubmit = async (values) => {
    // Create FormData instance and append the username and password fields
    const formData = new FormData();
    formData.append("username", values.username);
    formData.append("password", values.password);

    try {
      // Submit the formData to the backend API
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Assuming the backend returns user data on successful login
        localStorage.setItem("user", JSON.stringify(data));
        console.log(data)
        window.dispatchEvent(new Event("user-login"));
        antdMessage.success("Login successful!");
        form.resetFields();
        navigate("/");
      } else {
        // If response is not ok, display an error message
        antdMessage.error(data.message || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      antdMessage.error("Login error: " + error.message);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <Form form={form} layout="vertical" onFinish={handleLoginSubmit}>
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: "Please input your email!" }]}
        >
          <Input/>
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password/>
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
