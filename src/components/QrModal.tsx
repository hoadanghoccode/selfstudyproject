import { DownloadOutlined } from "@ant-design/icons";
import { Button, Divider, Modal, Space, Typography, message } from "antd";
import React, { useEffect, useRef, useState } from "react";
// AntD v5 có QRCode; nếu dự án bạn dùng v4 thì hãy dùng ảnh (qrImage) thay thế.
import { QRCode } from "antd";

// Ảnh mặc định nếu bạn muốn hiển thị QR tĩnh (vd: QR Zalo)
import QrFallbackImage from "../assets/images/flag/qr.png";

const { Title, Text } = Typography;

export interface QrModalProps {
  open: boolean;
  onClose: () => void;

  /** Nội dung QR để render bằng AntD <QRCode /> (ví dụ url đăng nhập) */
  qrText?: string;

  /** Ảnh QR tĩnh (nếu không dùng qrText) */
  qrImage?: string;

  /** Mã hết hạn sau N giây (mặc định 120s) */
  expiresIn?: number;

  /** Nút làm mới (gọi API lấy QR mới) */
  onRefresh?: () => Promise<void> | void;

  /** Gọi khi xác thực đăng nhập xong (tuỳ logic bên ngoài) */
  onSuccess?: () => void;

  /** Hiển thị thông tin proxy đang dùng (nếu có) */
  proxyHint?: string;

  /** Loading để disable nút khi call API */
  loading?: boolean;

  /** Tiêu đề modal */
  title?: string;
}

// const formatMMSS = (s: number) => {
//   const mm = String(Math.floor(s / 60)).padStart(2, "0");
//   const ss = String(s % 60).padStart(2, "0");
//   return `${mm}:${ss}`;
// };

const QrModal: React.FC<QrModalProps> = ({
  open,
  onClose,
  qrText,
  qrImage = QrFallbackImage,
  expiresIn = 120,
  // onRefresh,
  onSuccess,
  proxyHint,
  loading = false,
  title = "Đăng nhập bằng QR",
}) => {
  const [remain, setRemain] = useState<number>(expiresIn);
  const expired = remain <= 0;

  // Reset bộ đếm khi mở modal hoặc thay QR
  useEffect(() => {
    if (!open) return;
    setRemain(expiresIn);
  }, [open, expiresIn, qrText, qrImage]);

  // Đếm ngược
  useEffect(() => {
    if (!open) return;
    if (expired) return;

    const t = setInterval(() => {
      setRemain((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [open, expired]);

  // Tải QR (nếu render bằng <QRCode/>)
  const qrCanvasRef = useRef<HTMLDivElement>(null);
  const handleDownload = async () => {
    try {
      if (qrText && qrCanvasRef.current) {
        const canvas = qrCanvasRef.current.querySelector("canvas");
        if (canvas) {
          const dataUrl = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = "qr-login.png";
          document.body.appendChild(link);
          link.click();
          link.remove();
          return;
        }
      }
      // Fallback: tải ảnh tĩnh
      const link = document.createElement("a");
      link.href = qrImage;
      link.download = "qr-login.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      message.error("Không thể tải ảnh QR");
    }
  };

  // const canCopy = useMemo(() => Boolean(qrText), [qrText]);

  // const handleCopy = async () => {
  //   if (!qrText) return;
  //   try {
  //     await navigator.clipboard.writeText(qrText);
  //     message.success("Đã sao chép nội dung QR");
  //   } catch {
  //     message.error("Không thể sao chép");
  //   }
  // };

  // const handleRefresh = async () => {
  //   if (!onRefresh) {
  //     // Không có API làm mới, chỉ reset đếm ngược để demo
  //     setRemain(expiresIn);
  //     message.info("Đã làm mới bộ đếm (demo)");
  //     return;
  //   }
  //   await onRefresh();
  //   setRemain(expiresIn);
  // };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={420}
      destroyOnClose
      title={
        <Title level={4} style={{ margin: 0 }}>
          {title}
        </Title>
      }
    >
      <Space
        direction="vertical"
        style={{ width: "100%" }}
        size={12}
        align="center"
      >
        {/* Trạng thái + đếm ngược */}
        {/* <Space>
          <Tag color={expired ? "error" : "success"}>
            {expired ? "Đã hết hạn" : "Hoạt động"}
          </Tag>
          <Text type={expired ? "danger" : "secondary"}>
            {expired ? "Vui lòng làm mới mã" : `Còn lại: ${formatMMSS(remain)}`}
          </Text>
        </Space> */}

        {/* Khối QR */}
        <div
          ref={qrCanvasRef}
          style={{
            width: 260,
            height: 260,
            border: "1px solid #eee",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
          }}
        >
          {qrText ? (
            <QRCode value={qrText} size={230} />
          ) : (
            <img
              src={qrImage}
              alt="QR đăng nhập"
              style={{
                width: 230,
                height: 230,
                objectFit: "cover",
                borderRadius: 4,
              }}
            />
          )}
        </div>

        {/* Proxy hint (nếu có) */}
        {proxyHint && (
          <Text type="secondary" style={{ textAlign: "center" }}>
            Đang dùng proxy: <code>{proxyHint}</code>
          </Text>
        )}

        {/* Các nút thao tác */}
        <Space>
          {/* <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Làm mới mã
          </Button> */}
          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownload}
            disabled={loading}
          >
            Tải ảnh
          </Button>
          {/* <Button
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={!canCopy || loading}
          >
            Sao chép
          </Button> */}
        </Space>

        <Divider style={{ margin: "8px 0" }} />

        <div style={{ textAlign: "left", width: "100%" }}>
          <Text strong>Hướng dẫn:</Text>
          <ol style={{ margin: "6px 0 0 18px", padding: 0 }}>
            <li>Vui lòng dùng điện thoại quét mã QR</li>
            <li>
              Chọn chức năng <b>Quét QR</b>
            </li>
            <li>Quét mã trên màn hình và xác nhận</li>
          </ol>
        </div>

        {/* Nút hoàn tất (tuỳ theo luồng của bạn) */}
        {onSuccess && (
          <Button type="primary" block onClick={onSuccess} disabled={loading}>
            Tôi đã quét xong
          </Button>
        )}
      </Space>
    </Modal>
  );
};

export default QrModal;
