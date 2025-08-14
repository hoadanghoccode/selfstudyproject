import { useMemo, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  Space,
  Tag,
} from "antd";
import { message } from "antd";

type User = {
  id: number;
  name: string;
  email: string;
  role: "dev" | "designer" | "pm";
};

const seed: User[] = [
  { id: 1, name: "Nguyễn Văn A", email: "a@mail.com", role: "dev" },
  { id: 2, name: "Trần Thị B", email: "b@mail.com", role: "designer" },
];

export default function TableCrudPage() {
  const [data, setData] = useState<User[]>(seed);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form] = Form.useForm<User>();

  const columns = useMemo(
    () => [
      { title: "ID", dataIndex: "id", width: 80 },
      { title: "Tên", dataIndex: "name" },
      { title: "Email", dataIndex: "email" },
      {
        title: "Vai trò",
        dataIndex: "role",
        render: (r: User["role"]) => <Tag>{r}</Tag>,
      },
      {
        title: "Hành động",
        render: (_: any, record: User) => (
          <Space>
            <Button type="link" onClick={() => onEdit(record)}>
              Sửa
            </Button>
            <Popconfirm
              title="Xoá người dùng này?"
              onConfirm={() => onDelete(record.id)}
            >
              <Button type="link" danger>
                Xoá
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [data]
  );

  const onEdit = (u: User) => {
    setEditing(u);
    form.setFieldsValue(u);
    setOpen(true);
  };

  const onAdd = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const onDelete = (id: number) => {
    setData((prev) => prev.filter((x) => x.id !== id));
    message.success("Đã xoá");
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      setData((prev) =>
        prev.map((x) => (x.id === editing.id ? { ...editing, ...values } : x))
      );
      message.success("Đã cập nhật");
    } else {
      const newId = Math.max(0, ...data.map((d) => d.id)) + 1;
      setData((prev) => [{ id: newId, ...values }, ...prev]);
      message.success("Đã thêm mới");
    }
    setOpen(false);
  };

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={onAdd}>
          Thêm người dùng
        </Button>
      </Space>
      <Table
        rowKey="id"
        dataSource={data}
        columns={columns}
        pagination={{ pageSize: 5, showSizeChanger: true }}
      />

      <Modal
        title={editing ? "Sửa người dùng" : "Thêm người dùng"}
        open={open}
        onOk={onSubmit}
        onCancel={() => setOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Input placeholder="dev / designer / pm" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
