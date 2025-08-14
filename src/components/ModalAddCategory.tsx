import React from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { Formik, type FormikHelpers } from "formik";
import * as Yup from "yup";

interface CategoryFormValues {
  name: string;
  description: string;
}

interface ModalAddCategoryProps {
  isEdit: boolean;
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: CategoryFormValues) => void;
  loading?: boolean;
}

const validationSchema = Yup.object({
  name: Yup.string()
    .required("Tên danh mục là bắt buộc")
    .min(2, "Tên danh mục phải có ít nhất 2 ký tự")
    .max(50, "Tên danh mục không được quá 50 ký tự"),
  description: Yup.string().max(200, "Mô tả không được quá 200 ký tự"),
});

const ModalAddCategory: React.FC<ModalAddCategoryProps> = ({
  visible,
  onCancel,
  onSubmit,
  isEdit,
  loading = false,
}) => {
  const initialValues: CategoryFormValues = {
    name: "",
    description: "",
  };

  const handleSubmit = async (
    values: CategoryFormValues,
    { setSubmitting, resetForm }: FormikHelpers<CategoryFormValues>
  ) => {
    try {
      await onSubmit(values);
      message.success("Thêm danh mục thành công!");
      resetForm();
      onCancel();
    } catch (error) {
      message.error("Có lỗi xảy ra khi thêm danh mục!");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Thêm danh mục mới"
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
          handleSubmit,
          isSubmitting,
          resetForm,
        }) => (
          <Form layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Tên danh mục"
              validateStatus={errors.name && touched.name ? "error" : ""}
              help={errors.name && touched.name ? errors.name : ""}
            >
              <Input
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập tên danh mục"
                disabled={loading}
              />
            </Form.Item>

            <Form.Item
              label="Mô tả"
              validateStatus={
                errors.description && touched.description ? "error" : ""
              }
              help={
                errors.description && touched.description
                  ? errors.description
                  : ""
              }
            >
              <Input.TextArea
                name="description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập mô tả (không bắt buộc)"
                rows={3}
                disabled={loading}
              />
            </Form.Item>

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
                {isEdit ? "Cập nhật danh mục" : "Thêm danh mục"}
              </Button>
            </Form.Item>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

export default ModalAddCategory;
