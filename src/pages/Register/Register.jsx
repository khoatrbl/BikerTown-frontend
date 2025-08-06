import { Form, Input, Button, Select, DatePicker, App } from "antd";
import { useNavigate } from "react-router-dom";
import "./Register.css";
import { useEffect, useState } from "react";
import vietnamData from "../../Data/VietnamCitiesData.json";
import { useAuth } from "../../contexts/AuthContext";
import { signUp } from "@aws-amplify/auth";

const { Option } = Select;

const Register = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState(null);
  const { message } = App.useApp();

  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const handleRegisterSubmit = async (values) => {
    // setLoading(true);
    try {
      const formData = new FormData();

      formData.append("email", values.email);
      formData.append("display_name", values.display_name);
      formData.append("gender", values.gender);
      formData.append("dob", values.dob.format("YYYY-MM-DD"));
      formData.append("vehicle", values.vehicle);
      formData.append("phone", values.phone);
      formData.append("address", values.address);
      formData.append("district", values.district);
      formData.append("city", values.city);

      const register = async () => {
        const response = await signUp({
          username: values.email,
          password: values.password,
          attributes: {
            email: values.email,
          },
        });

        return response;
      };

      const response = await register();

      console.log("res:", response);

      const userInfo = {};

      formData.forEach((value, key) => {
        userInfo[key] = value;
      });

      // Submit to your backend
      // await axios.post("http://localhost:8000/register", formData); // replace URL as needed

      form.resetFields();
      navigate("/confirm-register", {
        state: {
          fromRegister: true,
          signUpResponse: response,
          userInfo,
        },
      });

      message.success("Registration successful!");
    } catch (error) {
      message.error("Registration failed. User already exists.");
      console.error(error);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h2>Register</h2>
        <Form form={form} layout="vertical" onFinish={handleRegisterSubmit}>
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

          <Form.Item
            name="display_name"
            label="Display Name"
            rules={[
              { required: true, message: "Please input your display name!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="gender"
            label="Gender"
            rules={[{ required: true, message: "Please select your gender!" }]}
          >
            <Select placeholder="Select gender">
              <Option value={true}>Male</Option>
              <Option value={false}>Female</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dob"
            label="Date of Birth"
            rules={[
              { required: true, message: "Please select your date of birth!" },
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="vehicle"
            label="Vehicle"
            rules={[{ required: true, message: "Please input your vehicle!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[
              { required: true, message: "Please input your phone number!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ required: true, message: "Please input your address!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="city"
            label="City"
            rules={[
              {
                required: true,
                message: "Please select your city",
              },
            ]}
          >
            <Select
              placeholder="Select a city"
              onChange={(value) => setSelectedCity(value)}
            >
              {vietnamData.map((city) => (
                <Option key={city.name} value={city.name}>
                  {city.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="district"
            label="District"
            rules={[
              {
                required: true,
                message: "Please select your district",
              },
            ]}
          >
            <Select placeholder="Select a district">
              {selectedCity &&
                vietnamData
                  .find((city) => city.name === selectedCity)
                  ?.districts.map((district) => (
                    <Option key={district} value={district}>
                      {district}
                    </Option>
                  ))}
            </Select>
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
    </div>
  );
};

export default Register;
