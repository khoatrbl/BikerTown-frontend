import { useState, useEffect } from "react";
import axios from "axios";
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Space,
  Row,
  Radio,
  Col,
  Tag,
  Modal,
  App,
  Select,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import "./Trips.css";
import { Link } from "react-router-dom";

const { Title } = Typography;
const { Option } = Select;

const Trips = () => {
  const [form] = Form.useForm();
  const [trips, setTrips] = useState([]);
  const [displayTrips, setDisplayTrips] = useState([]);
  const [tripBeingEdited, setTripBeingEdited] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showAllTrips, setShowAllTrips] = useState(false);
  const { message, modal } = App.useApp();

  useEffect(() => {
    // Load initial trips from API
    fetchTrips();
  }, [showAllTrips]);

  const fetchTrips = async () => {
    const currentUser = localStorage.getItem("user");
    const token = JSON.parse(currentUser).token;

    try {
      const response = await axios.get("http://localhost:8000/trips", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const tripsData = response.data;

      if (!showAllTrips) {
        // Filter trips to only show Upcoming, In Progress, or Delayed
        const filteredTrips = tripsData.filter(
          (trip) =>
            trip.trip_status === "Upcoming" ||
            trip.trip_status === "In Progress" ||
            trip.trip_status === "Delayed"
        );
        setDisplayTrips(filteredTrips);
      } else {
        setDisplayTrips(tripsData);
      }

      setTrips(tripsData);
    } catch (error) {
      console.error("Error fetching trips:", error);
      message.error("Failed to load trips.");

      if (error.response && error.response.status == 401) {
        console.log("Token is invalid.");
        message.error("Session expired");
        navigate("/login");
      }

      setTimeout(() => {
        message.error("Failed to load trips data");
      });
    }
  };

  function isValidTimeFormat(time) {
    // Matches 00:00:00 to 23:59:59
    return /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(time);
  }

  function isValidDateFormat(date) {
    // Matches 0000-01-01 to 9999-12-31 (basic check)
    return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date);
  }

  const handleSubmit = async (values) => {
    const local = localStorage.getItem("user");
    const token = JSON.parse(local).token;

    const newTrip = {
      start: values.start,
      destination: values.destination,
      start_date: values.start_date,
      end_date: values.end_date,
      time: values.time || "08:00:00",
      trip_status: values.trip_status || "Upcoming",
    };

    if (tripBeingEdited) {
      // Update on server
      try {
        const response = await axios.put(
          `http://localhost:8000/update-trip/${tripBeingEdited.trip_id}`,
          JSON.stringify(newTrip),
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status == 200) {
          setTripBeingEdited(null);
          message.success("Trip updated successfully!");

          fetchTrips(); // Refresh the trips list
        }
      } catch (error) {
        console.error("Error updating trip:", error);
        message.error("Failed to update trip.");
        return;
      }
    } else {
      try {
        const response = await axios.post(
          "http://localhost:8000/add-trip",
          JSON.stringify(newTrip),
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          fetchTrips(); // Refresh the trip list
          message.success("Trip created successfully!");
        }
      } catch (error) {
        console.error("Error creating trip:", error);
        message.error("Failed to create trip.");
        return;
      }
    }

    form.resetFields();
    setIsModalVisible(false);
  };

  const editTrip = (trip) => {
    setTripBeingEdited({ ...trip }); // Store the trip being edited
    // Populate the form with the trip data
    form.setFieldsValue({
      trip_id: trip.trip_id,
      start: trip.start,
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
      time: trip.time,
      trip_status: trip.trip_status,
    });

    setIsModalVisible(true);
  };

  const deleteTripHelper = async (trip_id) => {
    const local = localStorage.getItem("user");
    const token = JSON.parse(local).token;
    try {
      const response = await axios.delete(
        `http://localhost:8000/delete-trip/${trip_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error deleting trip:", error);
      message.error("Failed to delete trip.");
    }
    await fetchTrips(); // Refresh the trip list
    message.success("Trip deleted successfully!");
  };

  const deleteTrip = async (trip_id) => {
    modal.confirm({
      title: "Are you sure you want to delete this trip?",
      content: "This action cannot be undone.",
      onOk() {
        deleteTripHelper(trip_id);
      },
    });
  };

  const handleCancel = () => {
    form.resetFields();
    setTripBeingEdited(null);
    setIsModalVisible(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Upcoming":
        return "blue";
      case "In Progress":
        return "green";
      case "Delayed":
        return "orange";
      case "Cancelled":
        return "red";
      default:
        return "default";
    }
  };

  const onShowAllTripsChange = (e) => {
    setShowAllTrips(e.target.value);
  };

  return (
    <div>
      <div className="schedules-header">
        <Title level={2}>Ongoing Trips</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Create New Trip
        </Button>
      </div>

      <div className="schedules-description">
        <Radio.Group onChange={onShowAllTripsChange} value={showAllTrips}>
          <Radio value={false}>Show Filtered Trips</Radio>
          <Radio value={true}>Show All Trips</Radio>
        </Radio.Group>
      </div>

      <Row gutter={[24, 24]}>
        {trips.length === 0 ? (
          <div>
            {/* TODO: Edit the frontend for this section*/}
            <h2>No trip found. Create one?</h2>{" "}
          </div>
        ) : (
          displayTrips.map((trip) => (
            <Col xs={24} sm={12} md={8} key={trip.trip_id}>
              <Card
                title={
                  <Link to={`/trips/${trip.trip_id}`}>
                    <div className="schedule-card-title">
                      <EnvironmentOutlined style={{ color: "#f5222d" }} />
                      <span>
                        {trip.start} to {trip.destination}
                      </span>
                    </div>
                  </Link>
                }
                extra={
                  <Tag color={getStatusColor(trip.trip_status)}>
                    {trip.trip_status}
                  </Tag>
                }
                actions={[
                  <Button
                    key="edit"
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => editTrip(trip)}
                    disabled={
                      trip.trip_status === "Finished" ||
                      trip.trip_status === "Cancelled"
                    }
                  >
                    Edit
                  </Button>,
                  <Button
                    key="delete"
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteTrip(trip.trip_id)}
                  >
                    Delete
                  </Button>,
                ]}
              >
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Space>
                    <CalendarOutlined />
                    <span>
                      <b>Start:</b> {trip.start_date}
                    </span>
                  </Space>
                  <Space>
                    <CalendarOutlined />
                    <span>
                      <b>End:</b> {trip.end_date}
                    </span>
                  </Space>
                  <Space>
                    <ClockCircleOutlined />
                    <span>{trip.time}</span>
                  </Space>
                </Space>
              </Card>
            </Col>
          ))
        )}
      </Row>

      <Modal
        title={tripBeingEdited ? "Edit Trip" : "Create New Trip"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: "Upcoming",
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start"
                label="Start Location"
                rules={[
                  { required: true, message: "Please enter start location" },
                ]}
              >
                <Input placeholder="TP. Hồ Chí Minh" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="destination"
                label="Destination"
                rules={[
                  { required: true, message: "Please enter destination" },
                ]}
              >
                <Input placeholder="Vũng Tàu" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item
                name="start_date"
                label="Start Date"
                rules={[
                  { required: true, message: "Please enter date" },
                  {
                    validator: (_, value) => {
                      if (!value || isValidDateFormat(value)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Invalid date format"));
                    },
                  },
                ]}
              >
                <Input placeholder="YYYY-mm-dd" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="end_date"
                label="End Date"
                rules={[
                  { required: true, message: "Please enter date" },
                  {
                    validator: (_, value) => {
                      if (!value || isValidDateFormat(value)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Invalid date format"));
                    },
                  },
                ]}
              >
                <Input placeholder="YYYY-mm-dd" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="time"
                label="Time"
                rules={[
                  { required: true, message: "Please enter time" },
                  {
                    validator: (_, value) => {
                      if (!value || isValidTimeFormat(value)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Invalid time format"));
                    },
                  },
                ]}
              >
                <Input placeholder="08:00:00" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="trip_status"
                label="Status"
                rules={[{ required: true, message: "Please select status" }]}
              >
                <Select>
                  <Option value="Upcoming">Upcoming</Option>
                  <Option value="In Progress">In Progress</Option>
                  <Option value="Delayed">Delayed</Option>
                  <Option value="Cancelled">Cancelled</Option>
                  <Option value="Finished">Finished</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {tripBeingEdited ? "Update Trip" : "Create Trip"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Trips;
