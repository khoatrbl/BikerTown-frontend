"use client"

import { useState } from "react"
import { Typography, Card, Button, Input, List, Checkbox, Row, Col, Space, Modal, Form } from "antd"
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons"

const { Title, Paragraph } = Typography
const { TextArea } = Input

const Todo = () => {
  const [todoLists, setTodoLists] = useState([
    {
      id: 1,
      location: "Long An",
      items: [
        { id: 1, text: "Ăn sáng", completed: false },
        { id: 2, text: "Mua nước", completed: true },
        { id: 3, text: "Soạn đồ", completed: false },
      ],
    },
    {
      id: 2,
      location: "Bò sữa 22",
      items: [
        { id: 1, text: "Mua sữa", completed: false },
        { id: 2, text: "Đi vệ sinh", completed: false },
      ],
    },
    {
      id: 3,
      location: "Petro Bà Rịa",
      items: [{ id: 1, text: "Đổ xăng", completed: true }],
    },
    {
      id: 4,
      location: "Vũng Tàu",
      items: [
        { id: 1, text: "Tắm biển", completed: false },
        { id: 2, text: "Gửi xe", completed: false },
        { id: 3, text: "Uống cafe", completed: false },
        { id: 4, text: "Dạo đêm", completed: false },
      ],
    },
  ])

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingTodoList, setEditingTodoList] = useState(null)
  const [form] = Form.useForm()
  const [newItemText, setNewItemText] = useState("")

  const showModal = (todoList = null) => {
    setEditingTodoList(todoList)
    if (todoList) {
      form.setFieldsValue({
        location: todoList.location,
      })
    } else {
      form.resetFields()
    }
    setIsModalVisible(true)
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingTodoList(null)
    form.resetFields()
  }

  const handleSubmit = (values) => {
    if (editingTodoList) {
      // Update existing todo list
      setTodoLists(
        todoLists.map((list) => (list.id === editingTodoList.id ? { ...list, location: values.location } : list)),
      )
    } else {
      // Create new todo list
      const newTodoList = {
        id: Date.now(),
        location: values.location,
        items: [],
      }
      setTodoLists([...todoLists, newTodoList])
    }
    setIsModalVisible(false)
    form.resetFields()
  }

  const deleteTodoList = (id) => {
    setTodoLists(todoLists.filter((list) => list.id !== id))
  }

  const toggleItemCompletion = (listId, itemId) => {
    setTodoLists(
      todoLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) => (item.id === itemId ? { ...item, completed: !item.completed } : item)),
            }
          : list,
      ),
    )
  }

  const addItemToList = (listId) => {
    if (!newItemText.trim()) return

    setTodoLists(
      todoLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: [...list.items, { id: Date.now(), text: newItemText, completed: false }],
            }
          : list,
      ),
    )

    setNewItemText("")
  }

  const deleteItem = (listId, itemId) => {
    setTodoLists(
      todoLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.filter((item) => item.id !== itemId),
            }
          : list,
      ),
    )
  }

  return (
    <div style={{ backgroundColor: "rgb(241, 239, 236)"}}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <Title level={2}>To Do Lists</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
          Add Location
        </Button>
      </div>

      <Paragraph style={{ marginBottom: 24 }}>
        Create to-do lists for each location on your trip to stay organized and make sure you don't miss anything
        important.
      </Paragraph>

      <Row gutter={[24, 24]}>
        {todoLists.map((todoList) => (
          <Col xs={24} sm={12} md={6} key={todoList.id}>
            <Card 
              title={todoList.location}
              extra={
                <Space>
                  <Button type="text" icon={<EditOutlined />} onClick={() => showModal(todoList)} />
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteTodoList(todoList.id)} />
                </Space>
              }
              style={{ height: "100%", borderRadius: "25px", padding: "0.7rem" }}
            >
              <List 
                size="small"
                dataSource={todoList.items}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    actions={[
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => deleteItem(todoList.id, item.id)}
                      />,
                    ]}
                  >
                    <Checkbox
                      checked={item.completed}
                      onChange={() => toggleItemCompletion(todoList.id, item.id)}
                      style={{ textDecoration: item.completed ? "line-through" : "none" }}
                    >
                      {item.text}
                    </Checkbox>
                  </List.Item>
                )}
                footer={
                  <div style={{ display: "flex" }}>
                    <Input
                      placeholder="Add new item"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onPressEnter={() => addItemToList(todoList.id)}
                      style={{ marginRight: 8 }}
                    />
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => addItemToList(todoList.id)} />
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={editingTodoList ? "Edit Location" : "Add New Location"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="location"
            label="Location Name"
            rules={[{ required: true, message: "Please enter a location name" }]}
          >
            <Input placeholder="e.g., Vũng Tàu" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingTodoList ? "Update" : "Add"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Todo

