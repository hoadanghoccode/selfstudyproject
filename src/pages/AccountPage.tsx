import { MoreOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Col,
  Dropdown,
  Input,
  List,
  Menu,
  Row,
  Space,
  Statistic,
  Typography,
} from "antd";
import { saveAs } from "file-saver";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import ConfirmDeleteCate from "../components/ConfirmDeleteCate";
import ModalAddCategory from "../components/ModalAddCategory";
import ModalAddCustomer from "../components/ModalAddCustomer";
import { showNotification } from "../utils/notify";
import AccountsTablePage from "./AccountsTablePage"; // 🔹 table bên phải bạn đã có
import { useI18n } from "../i18n/I18nContext";

const AccountPage: React.FC = () => {
  // demo data danh mục (thay bằng API thực tế)
  const [categories] = useState([
    { key: "realEstate", name: "Bất động sản", count: 1 },
    { key: "commercial", name: "Thương mại", count: 1 },
  ]);
  const [checked, setChecked] = useState<string[]>(["all"]);
  const [data, setData] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
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
  const [modalVisible, setModalVisible] = useState(false);
  const handleAddCategory = async (values: any) => {
    // Call API to add category
    console.log("Adding category:", values);
    setModalVisible(false);
    showNotification(201, "Tạo danh mục thành công");
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddCustomer = async (values: any) => {
    // Call API to add category
    console.log("Adding category:", values);
    setIsModalOpen(false);
    showNotification(201, "Tạo danh mục thành công");
  };

  const categoryData: any = [
    { value: "cat1", label: "Danh mục 1" },
    { value: "cat3", label: "Danh mục 2" },
    { value: "cat4", label: "Danh mục 2" },
    { value: "cat5", label: "Danh mục 2" },
    { value: "cat6", label: "Danh mục 2" },
    { value: "cat7", label: "Danh mục 2" },
  ];

  const [isEdit, setIsEdit] = useState(false);

  const handleDelete = () => {
    // Call API to delete category
    setOpen(false);
    console.log("Deleting category:");
  };
  const { t, lang, setLang } = useI18n();

  return (
    <>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Typography.Title level={4} style={{ margin: 0, flex: 1 }}>
            {t("menu.accounts")}
          </Typography.Title>
          <Space>
            <Button onClick={() => setIsModalOpen(true)} type="primary">
              {t("account.management.addAccount")}
            </Button>
            <Button onClick={exportToExcel}>
              {t("account.management.exportData")}
            </Button>
          </Space>
        </div>

        <Row gutter={16}>
          {/* LEFT: Thống kê + Quản lý danh mục */}
          <Col xs={24} md={6}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Card size="small">
                <Row gutter={12}>
                  <Col span={8}>
                    <Statistic
                      title={t("account.management.total")}
                      value={1}
                    />
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

              <Card size="small" title={t("account.management.category")}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Input.Search
                    placeholder="Tìm kiếm"
                    allowClear
                    style={{ marginBottom: 12, marginRight: "10px" }}
                  />
                  <Button
                    style={{ padding: "10px 7px" }}
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setModalVisible(true)}
                  >
                    {t("account.management.add")}
                  </Button>
                </div>
                <List
                  size="small"
                  dataSource={[{ key: "all", name: "Tất cả" }, ...categories]}
                  renderItem={(item) => (
                    <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                      <Space
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                      >
                        <Space>
                          <Checkbox
                            checked={
                              item.key === "all"
                                ? checked.length === categories.length + 1
                                : checked.includes(item.key)
                            }
                            onChange={(e) => {
                              const c = e.target.checked;
                              if (item.key === "all") {
                                setChecked(
                                  c
                                    ? [
                                        "all",
                                        ...categories.map((cat) => cat.key),
                                      ]
                                    : []
                                );
                              } else {
                                setChecked((prev) => {
                                  let next: string[];
                                  if (c) {
                                    next = [...prev, item.key];
                                  } else {
                                    next = prev.filter(
                                      (k) => k !== item.key && k !== "all"
                                    );
                                  }
                                  // If all categories are checked, add "all"
                                  const allChecked = categories.every((cat) =>
                                    next.includes(cat.key)
                                  );
                                  if (allChecked && !next.includes("all")) {
                                    next = [
                                      "all",
                                      ...categories.map((cat) => cat.key),
                                    ];
                                  } else if (
                                    !allChecked &&
                                    next.includes("all")
                                  ) {
                                    next = next.filter((k) => k !== "all");
                                  }
                                  return next;
                                });
                              }
                            }}
                          />
                          <span>{item.name}</span>
                        </Space>
                        {item.key !== "all" && (
                          <Dropdown
                            trigger={["click"]}
                            overlay={
                              <Menu>
                                <Menu.Item
                                  key="edit"
                                  onClick={() => {
                                    setModalVisible(true);
                                    setIsEdit(true);
                                  }}
                                >
                                  Sửa
                                </Menu.Item>
                                <Menu.Item
                                  key="delete"
                                  onClick={() => {
                                    setOpen(true);
                                  }}
                                  style={{ color: "red" }}
                                >
                                  Xóa
                                </Menu.Item>
                              </Menu>
                            }
                          >
                            <MoreOutlined style={{ cursor: "pointer" }} />
                          </Dropdown>
                        )}
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
      <ModalAddCategory
        visible={modalVisible}
        isEdit={isEdit}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleAddCategory}
      />

      <ModalAddCustomer
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSubmit={handleAddCustomer}
        categories={categoryData}
      />

      <ConfirmDeleteCate
        open={open}
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
        // loading={deleting}
      />
    </>
  );
};

export default AccountPage;
