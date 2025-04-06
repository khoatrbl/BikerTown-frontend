"use client"

import { useState } from "react"
import { Typography, Card, Form, Input, Button, Space, Divider, Row, Col, List, Tag, Modal } from "antd"
import { PlusOutlined, DeleteOutlined, EditOutlined, EnvironmentOutlined } from "@ant-design/icons"

const { Title, Paragraph } = Typography

const Planners = () => {
  const [form] = Form.useForm()
  const [checkpoints, setCheckpoints] = useState([])
  const [plans, setPlans] = useState([])
  const [editingPlan, setEditingPlan] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)

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
    const newPlan = {
      id: editingPlan ? editingPlan.id : Date.now(),
      start: values.start,
      destination: values.destination,
      checkpoints: [...checkpoints],
      date: new Date().toLocaleDateString(),
    }

    if (editingPlan) {
      setPlans(plans.map((plan) => (plan.id === editingPlan.id ? newPlan : plan)))
      setEditingPlan(null)
    } else {
      setPlans([...plans, newPlan])
    }

    form.resetFields()
    setCheckpoints([])
    setIsModalVisible(false)
  }

  const editPlan = (plan) => {
    setEditingPlan(plan)
    setCheckpoints(plan.checkpoints)
    form.setFieldsValue({
      start: plan.start,
      destination: plan.destination,
    })
    setIsModalVisible(true)
  }

  const deletePlan = (id) => {
    setPlans(plans.filter((plan) => plan.id !== id))
  }

  const handleCancel = () => {
    form.resetFields()
    setCheckpoints([])
    setEditingPlan(null)
    setIsModalVisible(false)
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={2}>Trip Planners</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Create New Plan
        </Button>
      </div>

      <Paragraph style={{ marginBottom: 24 }}>
        Plan your motorcycle trips by setting start points, destinations, and checkpoints along the way.
      </Paragraph>

      {/* List of existing plans */}
      <Row gutter={[24, 24]}>
        {plans.map((plan) => (
          <Col xs={24} sm={12} md={8} key={plan.id}>
            <Card
              title={
                <Space>
                  <EnvironmentOutlined style={{ color: "#f5222d" }} />
                  <span>
                    {plan.start} to {plan.destination}
                  </span>
                </Space>
              }
              extra={<Tag color="blue">{plan.date}</Tag>}
              actions={[
                <Button key="edit" type="text" icon={<EditOutlined />} onClick={() => editPlan(plan)}>
                  Edit
                </Button>,
                <Button key="delete" type="text" danger icon={<DeleteOutlined />} onClick={() => deletePlan(plan.id)}>
                  Delete
                </Button>,
              ]}
            >
              <div>
                <Title level={5}>Checkpoints:</Title>
                {plan.checkpoints.length > 0 ? (
                  <List
                    size="small"
                    dataSource={plan.checkpoints}
                    renderItem={(item, index) => (
                      <List.Item>
                        {index + 1}. {item}
                      </List.Item>
                    )}
                  />
                ) : (
                  <Paragraph>No checkpoints added</Paragraph>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Create/Edit Plan Modal */}
      <Modal
        title={editingPlan ? "Edit Trip Plan" : "Create New Trip Plan"}
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
                label="Start"
                rules={[{ required: true, message: "Please enter start location" }]}
              >
                <Input placeholder="e.g., Long An" />
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

          <Divider>Checkpoints</Divider>

          <Form.Item label="Add Checkpoint">
            <Input.Group compact>
              {/* Nested Form.Item binds the input to the form field "checkpoint" */}
              <Form.Item
                name="checkpoint"
                noStyle
                rules={[{ required: false, message: "Nhập checkpoint" }]}
              >
               <Input
                style={{ width: "calc(100% - 40px)" }}
                 placeholder="e.g., Bò sữa 22"
               />
              </Form.Item>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addCheckpoint} />
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
                {editingPlan ? "Update Plan" : "Create Plan"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Planners

