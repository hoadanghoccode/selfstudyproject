import { Steps, Button, Drawer, Result } from "antd";
import { useState } from "react";

export default function WizardPage() {
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Steps
        current={current}
        items={[
          { title: "Chọn gói" },
          { title: "Nhập thông tin" },
          { title: "Xác nhận" },
        ]}
      />
      <div style={{ marginTop: 24 }}>
        <Button onClick={() => setCurrent((c) => Math.max(0, c - 1))}>
          Back
        </Button>
        <Button
          type="primary"
          onClick={() => setCurrent((c) => Math.min(2, c + 1))}
          style={{ marginLeft: 8 }}
        >
          Next
        </Button>
        <Button style={{ marginLeft: 8 }} onClick={() => setOpen(true)}>
          Mở Drawer
        </Button>
      </div>
      <Drawer
        title="Chi tiết đơn hàng"
        open={open}
        onClose={() => setOpen(false)}
      >
        {current === 2 ? (
          <Result status="success" title="Hoàn tất!" />
        ) : (
          "Nội dung bước…"
        )}
      </Drawer>
    </>
  );
}
