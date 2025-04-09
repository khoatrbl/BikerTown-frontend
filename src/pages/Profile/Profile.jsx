import { useState, useEffect } from "react";
import {
  Typography,
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Divider,
  DatePicker,
  Select,
  Avatar,
  Upload,
  Tabs,
  Space,
  App,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CarOutlined,
  UploadOutlined,
  LockOutlined,
  SaveOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import "./Profile.css";
import vietnamData from "../../Data/VietnamCitiesData.json";

const { Title, Paragraph } = Typography;
const { Option } = Select;

const Profile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState("TP. Hồ Chí Minh");
  const { message } = App.useApp();

  // Simulate fetching user data from API
  useEffect(() => {
    // In a real app, you would fetch this data from your API
    const fetchUserData = async () => {
      try {
        // Simulating API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock user data based on the database schema
        const mockUserData = {
          user_id: 1,
          username: "rider123",
          display_name: "John Rider",
          gender: true, // true for male, false for female
          dob: "1990-05-15",
          vehicle: "Honda CUB 50",
          created_date: "2022-03-10T08:30:00",
          contact: {
            contact_id: 1,
            phone: "+84 123 456 789",
            email: "john.rider@example.com",
            address: "123 Rider Street",
            district: "Quận 1",
            city: "TP. Hồ Chí Minh",
          },
        };

        setUserData(mockUserData);

        // Set form values
        form.setFieldsValue({
          username: mockUserData.username,
          display_name: mockUserData.display_name,
          gender: mockUserData.gender,
          dob: dayjs(mockUserData.dob),
          vehicle: mockUserData.vehicle,
          phone: mockUserData.contact.phone,
          email: mockUserData.contact.email,
          address: mockUserData.contact.address,
          district: mockUserData.contact.district,
          city: mockUserData.contact.city,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        message.error("Failed to load profile data");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [form, message]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    form.setFieldsValue({
      username: userData.username,
      display_name: userData.display_name,
      gender: userData.gender,
      dob: dayjs(userData.dob),
      vehicle: userData.vehicle,
      phone: userData.contact.phone,
      email: userData.contact.email,
      address: userData.contact.address,
      district: userData.contact.district,
      city: userData.city,
    });
    setIsEditing(false);
  };

  const handleSubmit = (values) => {
    // In a real app, you would send this data to your API
    console.log("Updated profile data:", values);

    // Update local state
    const updatedUserData = {
      ...userData,
      username: values.username,
      display_name: values.display_name,
      gender: values.gender,
      dob: values.dob.format("YYYY-MM-DD"),
      vehicle: values.vehicle,
      contact: {
        ...userData.contact,
        phone: values.phone,
        email: values.email,
        address: values.address,
        district: values.district,
        city: values.city,
      },
    };

    setUserData(updatedUserData);
    setIsEditing(false);
    message.success("Profile updated successfully!");
  };

  const handlePasswordChange = (values) => {
    // In a real app, you would send this data to your API
    console.log("Password change data:", values);
    message.success("Password changed successfully!");
    passwordForm.resetFields();
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <div>Loading profile data...</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Title level={2}>My Profile</Title>
      <Paragraph className="profile-description">
        View and manage your personal information and preferences.
      </Paragraph>

      <Tabs
        defaultActiveKey="1"
        className="profile-tabs"
        items={[
          {
            key: "1",
            label: (
              <span>
                <UserOutlined />
                Profile Information
              </span>
            ),
            children: (
              <Card
                title={
                  <div className="profile-card-header">
                    <span>Personal Details</span>
                    {!isEditing ? (
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={handleEdit}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Space>
                        <Button onClick={handleCancel}>Cancel</Button>
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          onClick={form.submit}
                        >
                          Save Changes
                        </Button>
                      </Space>
                    )}
                  </div>
                }
              >
                <Row gutter={[24, 0]}>
                  <Col xs={24} md={6} className="profile-avatar-col">
                    <Avatar
                      size={120}
                      icon={<UserOutlined />}
                      src="https://i.pinimg.com/564x/91/1b/88/911b881dd6f2e2e4a55838bf0072bdc1.jpg"
                      className="profile-avatar"
                    />
                    {isEditing && (
                      <Upload>
                        <Button
                          icon={<UploadOutlined />}
                          className="upload-button"
                        >
                          Change Photo
                        </Button>
                      </Upload>
                    )}
                    <Divider />
                    <Paragraph className="member-info">
                      <strong>Member Since:</strong>
                      <br />
                      {dayjs(userData.created_date).format("MMMM D, YYYY")}
                    </Paragraph>
                  </Col>

                  <Col xs={24} md={18}>
                    <Form
                      form={form}
                      layout="vertical"
                      onFinish={handleSubmit}
                      disabled={!isEditing}
                      initialValues={{
                        username: userData.username,
                        display_name: userData.display_name,
                        gender: userData.gender,
                        dob: dayjs(userData.dob),
                        vehicle: userData.vehicle,
                        phone: userData.contact.phone,
                        email: userData.contact.email,
                        address: userData.contact.address,
                        district: userData.contact.district,
                        city: userData.city,
                      }}
                    >
                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="username"
                            label="Username"
                            rules={[
                              {
                                required: true,
                                message: "Please enter your username",
                              },
                            ]}
                          >
                            <Input
                              prefix={<UserOutlined />}
                              placeholder="Username"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="display_name"
                            label="Display Name"
                            rules={[
                              {
                                required: true,
                                message: "Please enter your display name",
                              },
                            ]}
                          >
                            <Input
                              prefix={<UserOutlined />}
                              placeholder="Display Name"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item name="gender" label="Gender">
                            <Select placeholder="Select gender">
                              <Option value={true}>Male</Option>
                              <Option value={false}>Female</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="dob"
                            label="Date of Birth"
                            rules={[
                              {
                                required: true,
                                message: "Please select your date of birth",
                              },
                            ]}
                          >
                            <DatePicker
                              style={{ width: "100%" }}
                              format="YYYY-MM-DD"
                              placeholder="Select date"
                              suffixIcon={<CalendarOutlined />}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        name="vehicle"
                        label="Motorcycle"
                        rules={[
                          {
                            required: true,
                            message: "Please enter your motorcycle model",
                          },
                        ]}
                      >
                        <Input
                          prefix={<CarOutlined />}
                          placeholder="Motorcycle Model"
                        />
                      </Form.Item>

                      <Divider orientation="left">Contact Information</Divider>

                      <Row gutter={16}>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="email"
                            label="Email"
                            rules={[
                              {
                                required: true,
                                message: "Please enter your email",
                              },
                              {
                                type: "email",
                                message: "Please enter a valid email",
                              },
                            ]}
                          >
                            <Input
                              prefix={<MailOutlined />}
                              placeholder="Email"
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item
                            name="phone"
                            label="Phone Number"
                            rules={[
                              {
                                required: true,
                                message: "Please enter your phone number",
                              },
                            ]}
                          >
                            <Input
                              prefix={<PhoneOutlined />}
                              placeholder="Phone Number"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        name="address"
                        label="Address"
                        rules={[
                          {
                            required: true,
                            message: "Please enter your address",
                          },
                        ]}
                      >
                        <Input
                          prefix={<HomeOutlined />}
                          placeholder="Address"
                        />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col xs={24} md={12}>
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
                              prefix={<EnvironmentOutlined />}
                            >
                              {vietnamData.map((city) => (
                                <Option key={city.name} value={city.name}>
                                  {city.name}
                                </Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
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
                        </Col>
                      </Row>
                    </Form>
                  </Col>
                </Row>
              </Card>
            ),
          },
          {
            key: "2",
            label: (
              <span>
                <LockOutlined />
                Security
              </span>
            ),
            children: (
              <>
                <Card title="Change Password">
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    onFinish={handlePasswordChange}
                    style={{ maxWidth: 500, margin: "0 auto" }}
                  >
                    <Form.Item
                      name="currentPassword"
                      label="Current Password"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your current password",
                        },
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Current Password"
                      />
                    </Form.Item>

                    <Form.Item
                      name="newPassword"
                      label="New Password"
                      rules={[
                        {
                          required: true,
                          message: "Please enter your new password",
                        },
                        {
                          min: 6,
                          message: "Password must be at least 6 characters",
                        },
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="New Password"
                      />
                    </Form.Item>

                    <Form.Item
                      name="confirmPassword"
                      label="Confirm New Password"
                      dependencies={["newPassword"]}
                      rules={[
                        {
                          required: true,
                          message: "Please confirm your new password",
                        },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (
                              !value ||
                              getFieldValue("newPassword") === value
                            ) {
                              return Promise.resolve();
                            }
                            return Promise.reject(
                              new Error("The two passwords do not match")
                            );
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined />}
                        placeholder="Confirm New Password"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button type="primary" htmlType="submit" block>
                        Update Password
                      </Button>
                    </Form.Item>
                  </Form>
                </Card>
              </>
            ),
          },
          {
            key: "3",
            label: (
              <span>
                <CarOutlined />
                Motorcycle Details
              </span>
            ),
            children: (
              <>
                <Card title="My Motorcycle">
                  <Row gutter={[24, 24]}>
                    <Col xs={24} md={8}>
                      <img
                        src="https://i.pinimg.com/736x/5e/1c/ea/5e1ceab1bb1d35b8f723c122be26345a.jpg"
                        alt="Motorcycle"
                        className="motorcycle-image"
                      />
                      {isEditing && (
                        <Upload className="upload-button">
                          <Button icon={<UploadOutlined />} block>
                            Upload Motorcycle Photo
                          </Button>
                        </Upload>
                      )}
                    </Col>
                    <Col xs={24} md={16}>
                      <Form layout="vertical">
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              label="Motorcycle Model"
                              name="model"
                              initialValue={userData.vehicle}
                            >
                              <Input disabled={!isEditing} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              label="Year"
                              name="year"
                              initialValue="2021"
                            >
                              <Input disabled={!isEditing} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col span={12}>
                            <Form.Item
                              label="License Plate"
                              name="licensePlate"
                              initialValue="59-X1 12345"
                            >
                              <Input disabled={!isEditing} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item
                              label="Color"
                              name="color"
                              initialValue="Red"
                            >
                              <Input disabled={!isEditing} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item
                          label="Additional Notes"
                          name="notes"
                          initialValue="Regular maintenance every 3 months. Last service: March 2023"
                        >
                          <Input.TextArea rows={4} disabled={!isEditing} />
                        </Form.Item>
                      </Form>
                    </Col>
                  </Row>
                </Card>
              </>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Profile;
