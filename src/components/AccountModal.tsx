import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Input,
  Button,
  Table,
  Space,
  Typography,
  Checkbox,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

export interface AccountRow {
  id: string | number;
  phone: string;
  proxy?: string;
}

interface AccountModalProps {
  open: boolean;
  onClose: () => void;
  /** Callback nhận danh sách đã chọn. Nếu không nhập proxy -> proxy sẽ là "" */
  onSave?: (rows: AccountRow[]) => void | Promise<void>;
  /** API mặc định (khớp ảnh): http://localhost:1010 */
  defaultApiUrl?: string;
  /** Tuỳ chọn: hàm fetch thay thế (nếu bạn tự lấy từ backend khác) */
  fetchAccountsFn?: (apiUrl: string) => Promise<AccountRow[]>;
}

const AccountModal: React.FC<AccountModalProps> = ({
  open,
  onClose,
  onSave,
  defaultApiUrl = "http://localhost:1010",
  fetchAccountsFn,
}) => {
  const [apiUrl, setApiUrl] = useState(defaultApiUrl);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [ignoreProxy, setIgnoreProxy] = useState(false);

  useEffect(() => {
    if (!open) return;
    // reset khi mở lại modal
    setSelectedRowKeys([]);
    setSearch("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.phone.toLowerCase().includes(q) ||
        (r.proxy ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const counts = {
    filtered: filtered.length, // "Bôi đen" theo ảnh: coi như số dòng đang được lọc/hiển thị
    selected: selectedRowKeys.length,
    total: rows.length,
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);
      let data: AccountRow[] = [];
      if (fetchAccountsFn) {
        data = await fetchAccountsFn(apiUrl);
      } else {
        // Mặc định GET {apiUrl}/accounts
        // Response kỳ vọng: [{ id, phone, proxy }]
        const res = await fetch(`${apiUrl.replace(/\/$/, "")}/accounts`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      }
      // chuẩn hóa: sort theo phone nếu có
      data = (data ?? []).map((d, i) => ({
        id: d.id ?? i,
        phone: String(d.phone ?? ""),
        proxy: d.proxy ?? "",
      }));
      setRows(data);
      setSelectedRowKeys([]);
      message.success(`Đã tải ${data.length} tài khoản`);
    } catch (err: any) {
      console.error(err);
      message.error("Không thể tải tài khoản. Kiểm tra API URL hoặc server.");
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<AccountRow> = [
    {
      title: "STT",
      dataIndex: "index",
      width: 70,
      align: "center",
      render: (_: any, __: AccountRow, idx: number) => <span>{idx + 1}</span>,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      ellipsis: true,
      render: (text: string) => {
        if (!search) return text;
        const q = search.trim();
        const i = text.toLowerCase().indexOf(q.toLowerCase());
        if (i < 0) return text;
        return (
          <>
            {text.slice(0, i)}
            <mark>{text.slice(i, i + q.length)}</mark>
            {text.slice(i + q.length)}
          </>
        );
      },
    },
    {
      title: "Proxy",
      dataIndex: "proxy",
      ellipsis: true,
      render: (text: string) => {
        if (!text) return <Text type="secondary">—</Text>;
        if (!search) return text;
        const q = search.trim();
        const i = text.toLowerCase().indexOf(q.toLowerCase());
        if (i < 0) return text;
        return (
          <>
            {text.slice(0, i)}
            <mark>{text.slice(i, i + q.length)}</mark>
            {text.slice(i + q.length)}
          </>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  const handleSave = async () => {
    if (!onSave) return onClose();
    const selected = rows.filter((r) => selectedRowKeys.includes(r.id));
    const payload = ignoreProxy
      ? selected.map((r) => ({ ...r, proxy: "" }))
      : selected;
    try {
      setSaving(true);
      await onSave(payload);
      message.success(`Đã lưu ${payload.length} tài khoản`);
      onClose();
    } catch (e) {
      message.error("Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
      title={
        <div style={{ textAlign: "center", fontWeight: 600 }}>
          Chọn tài khoản
        </div>
      }
    >
      {/* Dòng API URL + Load */}
      <Space.Compact style={{ width: "100%", marginBottom: 8 }}>
        <span
          style={{
            width: 80,
            display: "inline-flex",
            alignItems: "center",
            paddingLeft: 4,
            background: "#fafafa",
            border: "1px solid #d9d9d9",
            borderRight: "none",
            borderRadius: "6px 0 0 6px",
          }}
        >
          API URL:
        </span>
        <Input
          value={apiUrl}
          onChange={(e) => setApiUrl(e.target.value)}
          placeholder="http://localhost:1010"
          allowClear
        />
        <Button type="default" onClick={loadAccounts} loading={loading}>
          Load tài khoản
        </Button>
      </Space.Compact>

      {/* Danh sách + Tìm kiếm */}
      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 6,
          padding: 8,
          marginBottom: 8,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          Danh sách tài khoản
        </div>
        <Space size="small" align="center" style={{ marginBottom: 6 }}>
          <span style={{ width: 70 }}>Tìm kiếm:</span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
            placeholder="Số điện thoại hoặc Proxy"
            allowClear
          />
        </Space>

        <Table<AccountRow>
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          loading={loading}
          rowSelection={rowSelection}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ y: 300 }}
          bordered
        />

        {/* Đếm số ở thanh dưới (giống ảnh) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            color: "#444",
            marginTop: 4,
          }}
        >
          <div>
            <b>Bôi đen:</b>{" "}
            <Text strong style={{ color: "#1677ff" }}>
              {counts.filtered}
            </Text>{" "}
            &nbsp; <b>Đã chọn:</b>{" "}
            <Text strong style={{ color: "#52c41a" }}>
              {counts.selected}
            </Text>{" "}
            &nbsp; <b>Tất cả:</b>{" "}
            <Text strong style={{ color: "#fa541c" }}>
              {counts.total}
            </Text>
          </div>

          <Checkbox
            checked={ignoreProxy}
            onChange={(e) => setIgnoreProxy(e.target.checked)}
          >
            Không nhập proxy
          </Checkbox>
        </div>
      </div>

      {/* Nút hành động */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <Button
          type="primary"
          onClick={handleSave}
          disabled={selectedRowKeys.length === 0}
          loading={saving}
          style={{ minWidth: 100 }}
        >
          Lưu
        </Button>
        <Button danger onClick={onClose} style={{ minWidth: 100 }}>
          Đóng
        </Button>
      </div>
    </Modal>
  );
};

export default AccountModal;
