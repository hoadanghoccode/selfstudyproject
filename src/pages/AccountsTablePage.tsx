// pages/AccountsPage.tsx
import {
  ChromeOutlined,
  DeleteOutlined,
  FunnelPlotOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Input, Space, theme } from "antd";
import { useState } from "react";
import ColumnChooserButton from "../components/ColumnChooserButton";
import CustomTable from "../components/CustomTable";
import { content } from "../mocks/sampledata";
import { useI18n } from "../i18n/I18nContext";
// import axios from "axios";

export type Account = {
  id: number;
  phone: string;
  password: string;
  category: string;
  cookie: string;
  birthday?: string;
  createdBy?: string;
  gender?: string;
  proxy?: string;
};

interface Props {
  setData: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function AccountsTablePage({ setData }: Props) {
  const [sortField, setSortField] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend" | null>(null);
  console.log("sortField:", sortField, "sortOrder:", sortOrder);
  const { token } = theme.useToken();
  const [loading] = useState(false);
  // phân trang
  const [page, setPage] = useState(1); // 1-based
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [keyword, setKeyword] = useState("");
  const [hiddenCols, setHiddenCols] = useState<string[]>([]); // các cột đang ẨN
  //   const [keyword, setKeyword] = useState("");
  //   const [sortField, setSortField] = useState<string | undefined>();
  //   const [sortOrder, setSortOrder] = useState<"ascend" | "descend" | null>(null);
  setData(content); // set data ban đầu
  const { t } = useI18n();

  const columns: any = [
    {
      title: t("account.table.phone"),
      dataIndex: "phone",
      key: "phone",
      width: 140,
      sorter: true,
    },
    {
      title: t("account.table.password"),
      dataIndex: "password",
      key: "password",
      width: 120,
    },
    {
      title: t("account.table.category"),
      dataIndex: "category",
      key: "category",
      width: 120,
    },
    {
      title: t("account.table.cookie"),
      dataIndex: "cookie",
      key: "cookie",
      ellipsis: true,
    },
    {
      title: t("account.table.birthday"),
      dataIndex: "birthday",
      key: "birthday",
      width: 120,
    },
    {
      title: t("account.table.fullName"),
      dataIndex: "createdBy",
      key: "createdBy",
      width: 140,
    },
    {
      title: t("account.table.gender"),
      dataIndex: "gender",
      key: "gender",
      width: 100,
    },
    {
      title: t("account.table.proxy"),
      dataIndex: "proxy",
      key: "proxy",
      width: 120,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Tìm theo SDT, tên, cookie..."
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(1);
          }}
          style={{ width: 280 }}
        />
        <div
          style={{
            backgroundColor: token.colorPrimary,
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
          }}
        >
          <FunnelPlotOutlined
            style={{ fontSize: 16, color: token.colorWhite }}
          />
        </div>

        {/* Thống kê tổng số, live, die, đã chọn */}
        <span style={{ marginLeft: 8, fontWeight: "bold" }}>
          {t("account.management.total")}:{" "}
          <span style={{ color: "#1677ff" }}>1</span> Live:{" "}
          <span style={{ color: "#52c41a" }}>1</span> Die:{" "}
          <span style={{ color: "#ff4d4f" }}>0</span>{" "}
          {t("account.management.selected")}:{" "}
          <span style={{ color: "#1677ff" }}>0</span>
        </span>

        <div style={{ marginLeft: "auto" }} />
        {/* nút khác của riêng trang này */}
        <Space>
          <Button
            icon={<ChromeOutlined />}
            onClick={() => {
              window.close();
            }}
          >
            {/* Đóng trình duyệt    */}
            {t("account.management.closeBrowser")}
          </Button>
        </Space>

        <Space>
          <Button icon={<DeleteOutlined />}>
            {t("account.management.trash")}
          </Button>
        </Space>

        {/* Tùy chỉnh cột – nằm ngoài CustomTable */}
        <ColumnChooserButton
          columns={columns}
          hiddenKeys={hiddenCols}
          onChange={setHiddenCols}
        />
      </div>

      {/* 5) Bảng thuần */}
      <CustomTable<any>
        columns={columns}
        dataSource={content}
        count={100}
        rowsPerPage={rowsPerPage}
        page={page}
        setPage={setPage}
        setRowsPerPage={setRowsPerPage}
        loading={loading}
        hiddenColumnKeys={hiddenCols}
        handleSortClick={({ field, order }) => {
          setSortField(field);
          setSortOrder(order);
          setPage(1);
        }}
      />
    </div>
  );
}
