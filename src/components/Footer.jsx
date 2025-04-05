import { Layout, Row, Col, Typography, Space, Divider, Button } from "antd";
import {
  FacebookOutlined,
  InstagramOutlined,
  YoutubeOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons";
import logo from "../assets/img/helmetlogo.jpg";

const { Footer: AntFooter } = Layout;
const { Title, Text, Link } = Typography;

const Footer = () => {
  return (
    <AntFooter style={{ padding: 0, background: "#001529", color: "#fff" }}>
      <div style={{ padding: "40px 50px 12px 50px" }}>
        <Row gutter={[32, 32]}>
          <Col xs={24} sm={24} md={8} lg={8}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <img
                src={logo}
                alt="Riders Club Logo"
                style={{
                  marginRight: 10,
                  height: 40,
                  width: 40,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
              <Title level={3} style={{ margin: 0, color: "#fff" }}>
                BikerTown 
              </Title>
            </div>
            <Text style={{ color: "#ffffffaa" }}>
              Join our community of passionate motorcycle enthusiasts. Explore
              new routes, make friends, and create unforgettable memories on the
              road.
            </Text>
            <div style={{ marginTop: 20 }}>
              <Space size="large">
                <Button
                  type="text"
                  icon={
                    <FacebookOutlined style={{ fontSize: 24, color: "#fff" }} />
                  }
                />
                <Button
                  type="text"
                  icon={
                    <InstagramOutlined
                      style={{ fontSize: 24, color: "#fff" }}
                    />
                  }
                />
                <Button
                  type="text"
                  icon={
                    <YoutubeOutlined style={{ fontSize: 24, color: "#fff" }} />
                  }
                />
              </Space>
            </div>
          </Col>

          <Col xs={24} sm={12} md={8} lg={8}>
            <Title level={4} style={{ color: "#fff", marginBottom: 20 }}>
              Quick Links
            </Title>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Link href="/" style={{ color: "#ffffffaa", display: "block" }}>
                  Home
                </Link>
                <Link
                  href="/meeting"
                  style={{
                    color: "#ffffffaa",
                    display: "block",
                    marginTop: 10,
                  }}
                >
                  Meetings
                </Link>
                <Link
                  href="/planners"
                  style={{
                    color: "#ffffffaa",
                    display: "block",
                    marginTop: 10,
                  }}
                >
                  Planners
                </Link>
                <Link
                  href="/todo"
                  style={{
                    color: "#ffffffaa",
                    display: "block",
                    marginTop: 10,
                  }}
                >
                  To Do
                </Link>
              </Col>
              <Col span={12}>
                <Link
                  href="/history"
                  style={{ color: "#ffffffaa", display: "block" }}
                >
                  History
                </Link>
                <Link
                  href="/friends"
                  style={{
                    color: "#ffffffaa",
                    display: "block",
                    marginTop: 10,
                  }}
                >
                  Friends
                </Link>
                <Link
                  href="/messages"
                  style={{
                    color: "#ffffffaa",
                    display: "block",
                    marginTop: 10,
                  }}
                >
                  Messages
                </Link>
                <Link
                  href="#"
                  style={{
                    color: "#ffffffaa",
                    display: "block",
                    marginTop: 10,
                  }}
                >
                  About Us
                </Link>
              </Col>
            </Row>
          </Col>

          <Col xs={24} sm={12} md={8} lg={8}>
            <Title level={4} style={{ color: "#fff", marginBottom: 20 }}>
              Contact Us
            </Title>
            <Space direction="vertical" size="middle" style={{marginRight: "90px"}}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <EnvironmentOutlined
                  style={{ marginRight: 10, color: "#f5222d" }}
                />
                <Text style={{ color: "#ffffffaa" }}>
                  123 Rider Street, Bike City
                </Text>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <PhoneOutlined style={{ marginRight: 10, color: "#f5222d" }} />
                <Text style={{ color: "#ffffffaa" }}>+84 6969696969</Text>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <MailOutlined style={{ marginRight: 10, color: "#f5222d" }} />
                <Text style={{ color: "#ffffffaa" }}>info@ridersclub.com</Text>
              </div>
            </Space>
            <Button type="primary" style={{ marginTop: 20 }}>
              Join Our Club
            </Button>
          </Col>
        </Row>

        <Divider style={{ borderColor: "#ffffff33", margin: "30px 0 20px" }} />

        <Row justify="space-between" align="middle">
          <Col>
            <Text style={{ color: "#ffffffaa" }}>
              © 2025 BikerTown Club. All rights reserved.
            </Text>
          </Col>
          <Col>
            <Space
              split={
                <Divider type="vertical" style={{ borderColor: "#ffffff33" }} />
              }
            >
              <Link href="#" style={{ color: "#ffffffaa" }}>
                Privacy Policy
              </Link>
              <Link href="#" style={{ color: "#ffffffaa" }}>
                Terms of Service
              </Link>
              <Link href="#" style={{ color: "#ffffffaa" }}>
                Cookie Policy
              </Link>
            </Space>
          </Col>
        </Row>
      </div>
    </AntFooter>
  );
};

export default Footer;
