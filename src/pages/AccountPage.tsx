import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Input,
  List,
  Row,
  Space,
  Statistic,
  Typography,
} from "antd";
import { saveAs } from "file-saver";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import AccountsTablePage from "./AccountsTablePage"; // 🔹 table bên phải bạn đã có

const AccountPage: React.FC = () => {
  // demo data danh mục (thay bằng API thực tế)
  const [categories] = useState([
    { key: "all", name: "Tất cả", count: 1 },
    { key: "test", name: "Test", count: 1 },
  ]);
  const [checked, setChecked] = useState<string[]>(["all"]);
  const [data, setData] = useState<any[]>([]);
  //   console.log("data here", data);

  const exportToExcel = () => {
    // 1. Chuyển data thành worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 2. Tạo workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách");

    // 3. Ghi workbook ra mảng buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // 4. Tạo file blob và lưu
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "danh_sach.xlsx");
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Typography.Title level={4} style={{ margin: 0, flex: 1 }}>
          Danh sách tài khoản
        </Typography.Title>
        <Space>
          <Button type="primary">Thêm tài khoản</Button>
          <Button onClick={exportToExcel}>Xuất dữ liệu</Button>
        </Space>
      </div>

      <Row gutter={16}>
        {/* LEFT: Thống kê + Quản lý danh mục */}
        <Col xs={24} md={6}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card size="small">
              <Row gutter={12}>
                <Col span={8}>
                  <Statistic title="Tổng số" value={1} />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Live"
                    value={1}
                    valueStyle={{ color: "#3f8600" }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Die"
                    value={0}
                    valueStyle={{ color: "#cf1322" }}
                  />
                </Col>
              </Row>
            </Card>

            <Card size="small" title="Quản lý danh mục">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Input.Search
                  placeholder="Tìm kiếm"
                  allowClear
                  style={{ marginBottom: 12, marginRight: "10px" }}
                />
                <Button
                  style={{ padding: "10px 7px" }}
                  type="primary"
                  icon={<PlusOutlined />}
                >
                  Thêm
                </Button>
              </div>
              <List
                size="small"
                dataSource={categories}
                renderItem={(item) => (
                  <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                    <Space>
                      <Checkbox
                        checked={checked.includes(item.key)}
                        onChange={(e) => {
                          const c = e.target.checked;
                          setChecked((prev) =>
                            c
                              ? [...prev, item.key]
                              : prev.filter((k) => k !== item.key)
                          );
                        }}
                      />
                      <span>{item.name}</span>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        </Col>

        {/* RIGHT: Table + toolbar (đã có trong AccountsTablePage) */}
        <Col xs={24} md={18}>
          <Card size="small">
            <AccountsTablePage setData={setData} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default AccountPage;
