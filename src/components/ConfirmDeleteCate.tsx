import { ExclamationCircleFilled } from "@ant-design/icons";
import { Alert, Modal } from "antd";
import React from "react";

type Props = {
  open: boolean;
  onConfirm: () => void;
  /** Đóng modal */
  onCancel: () => void;
  /** Trạng thái đang xoá (hiển thị loading trên nút Xóa) */
  loading?: boolean;
};

const ConfirmDeleteCate: React.FC<Props> = ({
  open,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const title = "Bạn có chắc chắn muốn xóa danh mục này không?";

  return (
    <Modal
      open={open}
      title={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <ExclamationCircleFilled style={{ color: "#faad14" }} />
          {title}
        </span>
      }
      onOk={onConfirm}
      onCancel={onCancel}
      okText="Xóa"
      cancelText="Hủy"
      okButtonProps={{ danger: true, loading }}
      destroyOnClose
      maskClosable={false}
      centered
    >
      {/* <Typography.Paragraph style={{ marginBottom: 12 }}>
        {message}
      </Typography.Paragraph> */}

      <Alert
        type="warning"
        showIcon
        message="Hành động này không thể hoàn tác."
      />
    </Modal>
  );
};

export default ConfirmDeleteCate;
