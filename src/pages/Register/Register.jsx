import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const Register = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleRegisterSubmit = (values) => {
    message.success("Registration successful! Please login.");
    form.resetFields();
    navigate("/login");
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <Form form={form} layout="vertical" onFinish={handleRegisterSubmit}>
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
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("The two passwords do not match!")
                );
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
        <div className="form-footer">
          Already have an account? <a href="/login">Login</a>
        </div>
      </Form>
    </div>
  );
};

export default Register;
