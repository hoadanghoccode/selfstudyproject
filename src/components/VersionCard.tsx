import { Card, Typography, Space } from "antd";
import { UpOutlined, DesktopOutlined } from "@ant-design/icons";
import "../App.css";

export default function VersionCard() {
  return (
    <div className="version-card-wrap">
      <div className="version-card-handle">
        <UpOutlined />
      </div>

      <Card className="version-card" size="small" hoverable>
        <Space direction="vertical" align="center" size={6}>
          <Space align="center" size={8}>
            <DesktopOutlined style={{ opacity: 0.8 }} />
            <Typography.Text type="secondary">
              Phiên bản cài đặt
            </Typography.Text>
          </Space>
          <Typography.Text strong>5.3.7</Typography.Text>
        </Space>
      </Card>
    </div>
  );
}
