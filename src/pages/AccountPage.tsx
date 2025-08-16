import { Button, Card, Col, message, Row, Space } from "antd";
import { saveAs } from "file-saver";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import CategoryManager from "../components/CategoryManager";
import ConfirmDeleteCate from "../components/ConfirmDeleteCate";
import ModalAddCategory from "../components/ModalAddCategory";
import ImportAccountsModal from "../components/ModalAddCustomer";
import { useI18n } from "../i18n/I18nContext";
import { showNotification } from "../utils/notify";
import AccountsTablePage from "./AccountsTablePage"; // 🔹 table bên phải bạn đã có

const AccountPage: React.FC = () => {
  // demo data danh mục (thay bằng API thực tế)
  const [categories] = useState([
    { key: "realEstate", name: "Bất động sản", count: 1 },
    { key: "commercial", name: "Thương mại", count: 1 },
  ]);
  const [checked, setChecked] = useState<string[]>([]);
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

  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);

  // rows: danh sách account đã parse theo định dạng bạn chọn ở Cách 4
  const handleImportAccounts = async (rows: any[]) => {
    try {
      setLoading(true);

      // TODO: gọi API backend của bạn để import
      // await axios.post("/api/accounts/import", { rows });

      message.success(`Đã nhập ${rows.length} tài khoản`);
      setIsModalOpen(false);
    } catch (err) {
      message.error("Nhập tài khoản thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    // Call API to delete category
    setOpen(false);
    console.log("Deleting category:");
  };
  const { t } = useI18n();

  return (
    <>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* LEFT: Category Manager */}
          <CategoryManager
            categories={categories} // [{key, name}, ...]
            checkedKeys={checked} // state dạng string[]
            setCheckedKeys={setChecked} // setState cho checked (string[])
            onAdd={() => setModalVisible(true)} // mở modal thêm
            onEdit={(_cat) => {
              setIsEdit(true);
              setModalVisible(true); /* set form... */
            }}
            onDelete={() => setOpen(true)} // mở confirm xóa
            t={t}
          />

          {/* RIGHT: Action buttons */}
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
          {/* RIGHT: Table + toolbar (đã có trong AccountsTablePage) */}
          <Col xs={24}>
            <Card
              style={{
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                borderRadius: 8,
                overflow: "hidden",
                background: "#fff",
              }}
              className="custom-table-strong-borders"
              size="small"
            >
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

      <ImportAccountsModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPickGemLogin={() => message.info("Chọn tài khoản từ GemLogin")}
        onPickGpmLogin={() => message.info("Chọn tài khoản từ GPM-Login")}
        onGenerateQR={(proxy) =>
          message.info(`Tạo QR đăng nhập với proxy: ${proxy ?? "(không có)"}`)
        }
        onImportAccounts={handleImportAccounts} // 🔑 dùng prop này thay cho onSubmit
        loading={loading}
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
