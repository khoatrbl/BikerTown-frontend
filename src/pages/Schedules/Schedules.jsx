"use client"

import { useState } from "react"
import { Typography, Card, Form, Input, Button, Space, Divider, Row, Col, List, Tag, Modal, App } from "antd"
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons"

const { Title, Paragraph } = Typography

const Schedules = () => {
  const [form] = Form.useForm()
  const [checkpoints, setCheckpoints] = useState([])
  const [schedules, setSchedules] = useState([
    {
      id: 1,
      start: "Ho Chi Minh City",
      destination: "Vung Tau",
      checkpoints: ["Long An", "Bò sữa 22", "Petro Bà Rịa"],
      date: "May 25, 2023",
      time: "07:00 AM",
      status: "Upcoming",
    },
    {
      id: 2,
      start: "Ho Chi Minh City",
      destination: "Da Lat",
      checkpoints: ["Dong Nai", "Bao Loc"],
      date: "June 10, 2023",
      time: "06:30 AM",
      status: "In Progress",
    },
  ])
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const { message } = App.useApp()

  const addCheckpoint = () => {
    const checkpoint = form.getFieldValue("checkpoint")
    if (checkpoint) {
      setCheckpoints([...checkpoints, checkpoint])
      form.setFieldsValue({ checkpoint: "" })
    }
  }

  const removeCheckpoint = (index) => {
    const newCheckpoints = [...checkpoints]
    newCheckpoints.splice(index, 1)
    setCheckpoints(newCheckpoints)
  }

  const handleSubmit = (values) => {
    const newSchedule = {
      id: editingSchedule ? editingSchedule.id : Date.now(),
      start: values.start,
      destination: values.destination,
      checkpoints: [...checkpoints],
      date: values.date || new Date().toLocaleDateString(),
      time: values.time || "08:00 AM",
      status: values.status || "Upcoming",
    }

    if (editingSchedule) {
      setSchedules(schedules.map((schedule) => (schedule.id === editingSchedule.id ? newSchedule : schedule)))
      setEditingSchedule(null)
      message.success("Schedule updated successfully!")
    } else {
      setSchedules([...schedules, newSchedule])
      message.success("New schedule created!")
    }

    form.resetFields()
    setCheckpoints([])
    setIsModalVisible(false)
  }

  const editSchedule = (schedule) => {
    setEditingSchedule(schedule)
    setCheckpoints(schedule.checkpoints)
    form.setFieldsValue({
      start: schedule.start,
      destination: schedule.destination,
      date: schedule.date,
      time: schedule.time,
      status: schedule.status,
    })
    setIsModalVisible(true)
  }

  const deleteSchedule = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this schedule?",
      content: "This action cannot be undone.",
      onOk() {
        setSchedules(schedules.filter((schedule) => schedule.id !== id))
        message.success("Schedule deleted successfully!")
      },
    })
  }

  const handleCancel = () => {
    form.resetFields()
    setCheckpoints([])
    setEditingSchedule(null)
    setIsModalVisible(false)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Upcoming":
        return "blue"
      case "In Progress":
        return "green"
      case "Delayed":
        return "orange"
      default:
        return "default"
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={2}>Ongoing Schedules</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Create New Schedule
        </Button>
      </div>

      <Paragraph style={{ marginBottom: 24 }}>
        View and manage your upcoming and ongoing motorcycle trips. Completed trips will be moved to History.
      </Paragraph>

      {/* List of existing schedules */}
      <Row gutter={[24, 24]}>
        {schedules.map((schedule) => (
          <Col xs={24} sm={12} md={8} key={schedule.id}>
            <Card
              title={
                <Space>
                  <EnvironmentOutlined style={{ color: "#f5222d" }} />
                  <span>
                    {schedule.start} to {schedule.destination}
                  </span>
                </Space>
              }
              extra={<Tag color={getStatusColor(schedule.status)}>{schedule.status}</Tag>}
              actions={[
                <Button key="edit" type="text" icon={<EditOutlined />} onClick={() => editSchedule(schedule)}>
                  Edit
                </Button>,
                <Button
                  key="delete"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => deleteSchedule(schedule.id)}
                >
                  Delete
                </Button>,
              ]}
            >
              <div>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Space>
                    <CalendarOutlined />
                    <span>{schedule.date}</span>
                  </Space>
                  <Space>
                    <ClockCircleOutlined />
                    <span>{schedule.time}</span>
                  </Space>

                  <Divider style={{ margin: "8px 0" }} />

                  <Title level={5}>Checkpoints:</Title>
                  {schedule.checkpoints.length > 0 ? (
                    <List
                      size="small"
                      dataSource={schedule.checkpoints}
                      renderItem={(item, index) => (
                        <List.Item>
                          {index + 1}. {item}
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Paragraph>No checkpoints added</Paragraph>
                  )}
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Create/Edit Schedule Modal */}
      <Modal
        title={editingSchedule ? "Edit Trip Schedule" : "Create New Trip Schedule"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start"
                label="Start Location"
                rules={[{ required: true, message: "Please enter start location" }]}
              >
                <Input placeholder="e.g., Ho Chi Minh City" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="destination"
                label="Destination"
                rules={[{ required: true, message: "Please enter destination" }]}
              >
                <Input placeholder="e.g., Vũng Tàu" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="date" label="Date" rules={[{ required: true, message: "Please enter date" }]}>
                <Input placeholder="e.g., June 15, 2023" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="time" label="Time" rules={[{ required: true, message: "Please enter time" }]}>
                <Input placeholder="e.g., 08:00 AM" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Status" rules={[{ required: true, message: "Please select status" }]}>
                <Input.Group compact>
                  <Form.Item name="status" noStyle>
                    <select
                      style={{
                        width: "100%",
                        height: "32px",
                        border: "1px solid #d9d9d9",
                        borderRadius: "2px",
                        padding: "4px 11px",
                      }}
                      defaultValue="Upcoming"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Checkpoints</Divider>

          <Form.Item label="Add Checkpoint">
            <Input.Group compact>
              {/* Nested Form.Item binds the input to the form field "checkpoint" */}
              <Form.Item name="checkpoint" noStyle rules={[{ required: false, message: "Enter checkpoint" }]}>
                <Input style={{ width: "calc(100% - 40px)" }} placeholder="e.g., Bò sữa 22" />
              </Form.Item>
              <Button type="primary" icon={<PlusOutlined />} onClick={addCheckpoint} />
            </Input.Group>
          </Form.Item>

          {/* List of checkpoints */}
          {checkpoints.length > 0 && (
            <Card size="small" title="Checkpoints" style={{ marginBottom: 16 }}>
              <List
                size="small"
                dataSource={checkpoints}
                renderItem={(item, index) => (
                  <List.Item
                    key={index}
                    actions={[
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeCheckpoint(index)} />,
                    ]}
                  >
                    {index + 1}. {item}
                  </List.Item>
                )}
              />
            </Card>
          )}

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingSchedule ? "Update Schedule" : "Create Schedule"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Schedules
