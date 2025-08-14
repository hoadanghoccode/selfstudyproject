import React from "react";
import { Modal, Form, Input, Button, Select, DatePicker } from "antd";
import { Formik, type FormikHelpers } from "formik";
import * as Yup from "yup";
import dayjs from "dayjs";

interface CustomerFormValues {
  name: string;
  email: string;
  gender: string;
  birthDate: string | null;
  categoryId: string;
}

interface CategoryOption {
  value: string;
  label: string;
}

interface ModalAddCustomerProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: CustomerFormValues) => void;
  categories: CategoryOption[];
  loading?: boolean;
}

const validationSchema = Yup.object({
  name: Yup.string()
    .required("Tên khách hàng là bắt buộc")
    .min(2, "Tên phải có ít nhất 2 ký tự"),
  email: Yup.string().email("Email không hợp lệ").required("Email là bắt buộc"),
  gender: Yup.string().required("Vui lòng chọn giới tính"),
  birthDate: Yup.string().nullable().required("Vui lòng chọn ngày sinh"),
  categoryId: Yup.string().required("Vui lòng chọn danh mục"),
});

const ModalAddCustomer: React.FC<ModalAddCustomerProps> = ({
  visible,
  onCancel,
  onSubmit,
  categories,
  loading = false,
}) => {
  const initialValues: CustomerFormValues = {
    name: "",
    email: "",
    gender: "",
    birthDate: null,
    categoryId: "",
  };

  const handleSubmit = async (
    values: CustomerFormValues,
    { setSubmitting, resetForm }: FormikHelpers<CustomerFormValues>
  ) => {
    try {
      await onSubmit(values);
      resetForm();
      onCancel();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Thêm khách hàng mới"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={500}
      destroyOnClose
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          setFieldValue,
          handleSubmit,
          isSubmitting,
          resetForm,
        }) => (
          <Form layout="vertical" onFinish={handleSubmit}>
            {/* Name */}
            <Form.Item
              label="Tên khách hàng"
              validateStatus={errors.name && touched.name ? "error" : ""}
              help={errors.name && touched.name ? errors.name : ""}
            >
              <Input
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập tên khách hàng"
                disabled={loading}
              />
            </Form.Item>

            {/* Email */}
            <Form.Item
              label="Email"
              validateStatus={errors.email && touched.email ? "error" : ""}
              help={errors.email && touched.email ? errors.email : ""}
            >
              <Input
                name="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập email"
                disabled={loading}
              />
            </Form.Item>

            {/* Gender */}
            <Form.Item
              label="Giới tính"
              validateStatus={errors.gender && touched.gender ? "error" : ""}
              help={errors.gender && touched.gender ? errors.gender : ""}
            >
              <Select
                placeholder="Chọn giới tính"
                value={values.gender || undefined}
                onChange={(val) => setFieldValue("gender", val)}
                disabled={loading}
              >
                <Select.Option value="male">Nam</Select.Option>
                <Select.Option value="female">Nữ</Select.Option>
                <Select.Option value="other">Khác</Select.Option>
              </Select>
            </Form.Item>

            {/* Category */}
            <Form.Item
              label="Danh mục"
              validateStatus={
                errors.categoryId && touched.categoryId ? "error" : ""
              }
              help={
                errors.categoryId && touched.categoryId ? errors.categoryId : ""
              }
            >
              <Select
                placeholder="Chọn danh mục"
                value={values.categoryId || undefined}
                onChange={(val) => setFieldValue("categoryId", val)}
                disabled={loading}
              >
                {categories.map((cat) => (
                  <Select.Option key={cat.value} value={cat.value}>
                    {cat.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Birth date */}
            <Form.Item
              label="Ngày sinh"
              validateStatus={
                errors.birthDate && touched.birthDate ? "error" : ""
              }
              help={
                errors.birthDate && touched.birthDate ? errors.birthDate : ""
              }
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Chọn ngày sinh"
                format="YYYY-MM-DD"
                value={values.birthDate ? dayjs(values.birthDate) : null}
                onChange={(date) =>
                  setFieldValue(
                    "birthDate",
                    date ? date.format("YYYY-MM-DD") : null
                  )
                }
                disabled={loading}
              />
            </Form.Item>

            {/* Actions */}
            <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
              <Button
                onClick={() => {
                  resetForm();
                  onCancel();
                }}
                style={{ marginRight: 8 }}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting || loading}
                disabled={isSubmitting || loading}
              >
                Thêm khách hàng
              </Button>
            </Form.Item>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

export default ModalAddCustomer;
