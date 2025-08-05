import { Form, Input, Button, App } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import { useEffect, useState } from "react";
import HamsterLoading from "../../components/Loading/HamsterLoading";

import { signIn } from "aws-amplify/auth";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message: antdMessage } = App.useApp();
  const [loading, setLoading] = useState(false);

  const { isLoggedIn } = useAuth();

  // TODO: useEffect() check dieu kien trong  local storage
  useEffect(() => {
    if (isLoggedIn) {
      // If user is already logged in, redirect to home page
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const handleLoginSubmit = async (values) => {
    // const formData = new FormData();
    // formData.append("username", values.username);
    // formData.append("password", values.password);

    try {
      setLoading(true);
      // const response = await axios.post("http://127.0.0.1:8000/login", formData, {
      //   headers: {
      //     "Content-Type": "multipart/form-data",
      //   },
      // });

      const res = await signIn({
        username: values.username,
        password: values.password,
      }); // this returns an object that contains {isSignedIn: boolean, nextStep: {signInStep: string}}
      // const data = response.data;

      console.log("Login successful:", res);

      // Assuming success if no error is thrown
      // localStorage.setItem("user", JSON.stringify(data));
      // console.log(data.username);
      if (res.isSignedIn) {
        // need to set localstorage item for user
        const username = localStorage.getItem(
          "CognitoIdentityServiceProvider.49vvifb12b9vn6danpn4su4f2i.LastAuthUser"
        );

        console.log("Username from localStorage:", username);

        window.dispatchEvent(new Event("user-login"));
        antdMessage.success("Login successful!");
        form.resetFields();
        navigate("/");
      } else {
        antdMessage.error("Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      antdMessage.error(
        "Login failed. Please check your credentials and try again."
      );
      // Optionally, you can reset the form fields
      form.resetFields();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <HamsterLoading />;
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login</h2>
        <Form form={form} layout="vertical" onFinish={handleLoginSubmit}>
          <Form.Item
            name="username"
            label="Email"
            rules={[{ required: true, message: "Please input your email!" }]}
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
    </div>
  );
};

export default Login;
