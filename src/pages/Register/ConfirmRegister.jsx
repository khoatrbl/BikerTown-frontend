import { Form, Input, Button, App } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import "./ConfirmationCode.css";
import axios from "axios";
import { useEffect } from "react";
import { confirmSignUp, resendSignUpCode } from "@aws-amplify/auth";

const ConfirmationCode = () => {
  const API_URL = import.meta.env.VITE_BASE_API_URL;
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const signUpResponse = location.state?.signUpResponse || null;
  const userInfo = location.state?.userInfo || null;

  useEffect(() => {
    if (!location.state?.fromRegister) {
      navigate("/register");
      return null;
    }

    // Add some debugging
    console.log("API_URL:", API_URL);

    if (!API_URL) {
      console.error("REACT_APP_BASE_API_URL is not defined");
      return;
    }

    console.log("Sign Up Response:", signUpResponse);
  }, [location.state, navigate]);

  const handleConfirmSubmit = async (values) => {
    try {
      const formData = new FormData();
      formData.append("confirmationCode", values.confirmationCode);

      const confirm = async () => {
        const response = await confirmSignUp({
          username: signUpResponse.userId,
          confirmationCode: values.confirmationCode,
        });
        return response;
      };

      if (signUpResponse.nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        const response = await confirm();

        if (
          response.isSignUpComplete &&
          response.nextStep.signUpStep === "DONE"
        ) {
          const userDataCollection = new FormData();
          userDataCollection.append("uuid", signUpResponse.userId);
          userDataCollection.append("email", userInfo.email);
          userDataCollection.append("display_name", userInfo.display_name);
          userDataCollection.append("gender", userInfo.gender);
          userDataCollection.append("dob", userInfo.dob);
          userDataCollection.append("vehicle", userInfo.vehicle);
          userDataCollection.append("phone", userInfo.phone);
          userDataCollection.append("address", userInfo.address);
          userDataCollection.append("district", userInfo.district);
          userDataCollection.append("city", userInfo.city);

          const response = await axios.post(
            `${API_URL}/register-user-data`,
            userDataCollection,
            {
              headers: {
                "Content-Type": "application/form-data",
              },
            }
          );
        }
      }

      message.success("Code confirmed successfully!");
      form.resetFields();
      navigate("/login");
    } catch (error) {
      message.error("Invalid confirmation code. Please try again.");
      console.error(error);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendSignUpCode({
        username: signUpResponse.userId,
      });
      message.success("Confirmation code resent to your email!");
    } catch (error) {
      message.error("Failed to resend code. Please try again.");
      console.error(error);
    }
  };

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        <h2>Enter Confirmation Code</h2>
        <p className="confirmation-description">
          We've sent a 6-digit confirmation code to your email address. Please
          enter it below to verify your account.
        </p>

        <Form form={form} layout="vertical" onFinish={handleConfirmSubmit}>
          <Form.Item
            name="confirmationCode"
            label="Confirmation Code"
            rules={[
              {
                required: true,
                message: "Please enter the confirmation code!",
              },
              {
                pattern: /^\d{6}$/,
                message: "Please enter a valid 6-digit code!",
              },
            ]}
          >
            <Input
              placeholder="Enter 6-digit code"
              maxLength={6}
              style={{
                textAlign: "center",
                fontSize: "18px",
                letterSpacing: "2px",
                fontWeight: "bold",
              }}
              onKeyPress={(e) => {
                // Only allow numbers
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Confirm Code
            </Button>
          </Form.Item>

          <div className="form-footer">
            <p>Didn't receive the code?</p>
            <Button type="link" onClick={handleResendCode}>
              Resend Code
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ConfirmationCode;
