import { Alert, Button, Modal, Popover, Tooltip, Progress, Skeleton, Spin, Empty, message, notification, Space } from 'antd';
import { useState } from 'react';

export default function FeedbackPage() {
  const [loading, setLoading] = useState(false);
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Alert type="info" message="Thông báo" description="Đây là alert demo." showIcon />
      <Space>
        <Button onClick={() => message.success('Thành công!')}>message</Button>
        <Button onClick={() => notification.open({ message: 'Hello', description: 'Notification demo' })}>notification</Button>
        <Tooltip title="Tooltip nè"><Button>Hover</Button></Tooltip>
        <Popover content="Popover nội dung"><Button>Popover</Button></Popover>
        <Button onClick={() => Modal.info({ title: 'Modal', content: 'Nội dung modal' })}>Modal</Button>
      </Space>
      <Progress percent={66} />
      <Skeleton active />
      <Spin spinning={loading}>
        <Button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1000); }}>Fake loading</Button>
      </Spin>
      <Empty description="Không có dữ liệu" />
    </Space>
  );
}
