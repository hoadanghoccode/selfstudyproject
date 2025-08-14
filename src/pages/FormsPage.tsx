import {
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  Slider,
  Rate,
  Radio,
  Checkbox,
  Cascader,
  TreeSelect,
  Upload,
  Button,
  Space,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { message } from "antd";

const options = [
  { value: "dev", label: "Developer" },
  { value: "designer", label: "Designer" },
  { value: "pm", label: "Product Manager" },
];

const cascaderOptions = [
  {
    value: "vn",
    label: "Việt Nam",
    children: [
      { value: "hn", label: "Hà Nội" },
      { value: "hcm", label: "HCM" },
    ],
  },
];

const treeData = [
  {
    title: "Frontend",
    value: "fe",
    children: [{ title: "React", value: "react" }],
  },
  {
    title: "Backend",
    value: "be",
    children: [{ title: "Node", value: "node" }],
  },
];

export default function FormsPage() {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    // Convert Dayjs
    values.birthday = values.birthday?.format("YYYY-MM-DD");
    message.success("Submit thành công! Xem console để kiểm tra.");
    console.log("FORM VALUES:", values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ active: true, level: 3, rating: 4, createdAt: dayjs() }}
    >
      <Form.Item
        label="Họ tên"
        name="fullName"
        rules={[{ required: true, message: "Nhập họ tên" }]}
      >
        <Input placeholder="Nguyễn Văn A" />
      </Form.Item>

      <Form.Item
        label="Email"
        name="email"
        rules={[{ type: "email", required: true }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Tuổi"
        name="age"
        rules={[{ type: "number", min: 1, max: 120 }]}
      >
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item label="Vai trò" name="role" rules={[{ required: true }]}>
        <Select options={options} placeholder="Chọn vai trò" showSearch />
      </Form.Item>

      <Form.Item label="Ngày sinh" name="birthday" rules={[{ required: true }]}>
        <DatePicker style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item label="Kích hoạt" name="active" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item label="Mức độ kinh nghiệm" name="level" initialValue={1.0}>
        <Slider
          min={1}
          max={5}
          step={0.1} // ← mỗi nấc 0.1: 1.0, 1.1, 1.2, ...
          dots // hiện chấm tại mỗi step (tuỳ thích)
          tooltip={{
            formatter: (v) => v?.toFixed(1).replace(".", ","), // hiển thị 1,1 thay vì 1.1
          }}
        />
      </Form.Item>

      <Form.Item label="Đánh giá bản thân" name="rating">
        <Rate />
      </Form.Item>

      <Form.Item label="Giới tính" name="gender">
        <Radio.Group>
          <Radio value="male">Nam</Radio>
          <Radio value="female">Nữ</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item label="Kỹ năng" name="skills">
        <Checkbox.Group options={["React", "Node", "UI/UX"]} />
      </Form.Item>

      <Form.Item label="Địa điểm (Cascader)" name="location">
        <Cascader options={cascaderOptions} />
      </Form.Item>

      <Form.Item label="Nhóm (TreeSelect)" name="team">
        <TreeSelect treeData={treeData} allowClear showSearch />
      </Form.Item>

      <Form.Item
        label="Avatar (Upload)"
        name="avatar"
        valuePropName="fileList"
        getValueFromEvent={(e) => e?.fileList}
      >
        <Upload.Dragger name="files" beforeUpload={() => false} multiple>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p>Thả file vào đây hoặc bấm để chọn</p>
        </Upload.Dragger>
      </Form.Item>

      <Space>
        <Button type="primary" htmlType="submit">
          Lưu
        </Button>
        <Button htmlType="button" onClick={() => form.resetFields()}>
          Reset
        </Button>
      </Space>
    </Form>
  );
}
