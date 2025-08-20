// pages/AccountsPage.tsx
import {
  BarsOutlined,
  CheckOutlined,
  ChromeOutlined,
  CloseOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FunnelPlotOutlined,
  GlobalOutlined,
  HighlightOutlined,
  IdcardOutlined,
  MessageOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
  TagsOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Input, Space, theme } from "antd";
import React, { useState, useMemo } from "react";
import ColumnChooserButton from "../components/ColumnChooserButton";
import CustomTableV2, { type Column } from "../components/CustomTableV2";
import { useI18n } from "../i18n/I18nContext";
import { content } from "../mocks/sampledata";

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
  avatar?: string;
};

export default function AccountsTablePage() {
  const { token } = theme.useToken();
  const [loading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [hiddenCols, setHiddenCols] = useState<string[]>([]); // các cột đang ẨN
  const { t } = useI18n();

  // === Selection state (consolidated) ===
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  console.log("selectedRowKeys nhes", selectedRowKeys);

  // === Hidden items state ===
  const [hiddenItemIds, setHiddenItemIds] = useState<React.Key[]>([]);

  // === Filtered data source ===
  const filteredDataSource = useMemo(() => {
    let data = content.filter((item) => !hiddenItemIds.includes(item.id));

    // Filter by keyword
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      data = data.filter(
        (item) =>
          item.phone?.toLowerCase().includes(lowerKeyword) ||
          item.createdBy?.toLowerCase().includes(lowerKeyword) ||
          item.cookie?.toLowerCase().includes(lowerKeyword)
      );
    }

    return data;
  }, [content, hiddenItemIds, keyword]);

  // === Actions ===
  // const editRecord = (record: any) => {
  //   console.log("Edit record id:", record.id);
  // };

  const selectAll = (all: any[]) => {
    const allIds = all.map((r) => r.id);
    setSelectedRowKeys(allIds);
    console.log("Selected all ids:", allIds);
  };

  const clearSelection = () => {
    setSelectedRowKeys([]);
    console.log("Cleared all selection");
  };

  // === Hide/Show Actions ===
  const hideSelectedItems = () => {
    const selectedIds = selectedRowKeys;
    setHiddenItemIds((prev) => [...new Set([...prev, ...selectedIds])]);
    console.log("Hidden selected items:", selectedIds);
  };

  const hideUnselectedItems = () => {
    const allIds = content.map((item) => item.id);
    const unselectedIds = allIds.filter((id) => !selectedRowKeys.includes(id));
    setHiddenItemIds((prev) => [...new Set([...prev, ...unselectedIds])]);
    console.log("Hidden unselected items:", unselectedIds);
  };

  const showAllItems = () => {
    setHiddenItemIds([]);
    console.log("Show all items");
  };

  const handleAction = (actionKey: any, targets: any) => {
    // const ids = targets.map((t: any) => t.id).join(", ");
    console.log("Action:", actionKey, "Targets:", targets);

    switch (actionKey) {
      case "select":
        console.log("select nhes");
        setSelectedRowKeys((prev) => [
          ...new Set([...prev, ...targets.map((t: any) => t?.id)]),
        ]);
        break;

      case "unselect":
        console.log("unselect nhes");
        setSelectedRowKeys((prev) =>
          prev.filter((k) => !targets.map((t: any) => t?.id).includes(k))
        );
        break;

      case "delete":
        console.log("delete nhe");
        // TODO: gọi API xoá
        break;

      default:
        break;
    }
  };

  const safeStr = (v: any) => (v ?? "").toString();

  const columns: Column<any>[] = [
    {
      title: t("account.table.phone"),
      dataIndex: "phone",
      width: 140,
      sorter: (a: any, b: any) =>
        safeStr(a.phone).localeCompare(safeStr(b.phone)),
    },
    {
      title: t("account.table.password"),
      dataIndex: "password",
      width: 120,
      // không sort
    },
    {
      title: t("account.table.avatar"),
      dataIndex: "avatar",
      width: 120,
      render: (avatarUrl: string) => {
        const defaultAvatar =
          "https://via.placeholder.com/40x40/1677ff/ffffff?text=U";
        return (
          <img
            src={avatarUrl || defaultAvatar}
            alt="Avatar"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              objectFit: "cover",
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = defaultAvatar;
            }}
          />
        );
      },
    },
    {
      title: t("account.table.category"),
      dataIndex: "category",
      width: 120,
      sorter: (a, b) => safeStr(a.category).localeCompare(safeStr(b.category)),
    },
    {
      title: t("account.table.cookie"),
      dataIndex: "cookie",
      width: 120,
    },
    {
      title: t("account.table.birthday"),
      dataIndex: "birthday",
      width: 120,
      // nếu birthday là Date/string parse được
      sorter: (a, b) => {
        const ta = Date.parse(a.birthday ?? "") || 0;
        const tb = Date.parse(b.birthday ?? "") || 0;
        return ta - tb;
      },
    },
    {
      title: t("account.table.fullName"),
      dataIndex: "createdBy",
      width: 140,
      sorter: (a, b) =>
        safeStr(a.createdBy).localeCompare(safeStr(b.createdBy)),
    },
    {
      title: t("account.table.gender"),
      dataIndex: "gender",
      width: 100,
      sorter: (a, b) => safeStr(a.gender).localeCompare(safeStr(b.gender)),
    },
    {
      title: t("account.table.proxy"),
      dataIndex: "proxy",
      width: 120,
    },
    {
      title: "Trạng thái",
      dataIndex: "",
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

        <div style={{ marginLeft: "auto" }} />

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

      <CustomTableV2<any>
        lazyBatchSize={120}
        scrollY={600}
        resizable={true}
        columns={columns}
        selected={selectedRowKeys.length}
        dataSource={filteredDataSource}
        count={filteredDataSource.length}
        loading={loading}
        hiddenColumnKeys={hiddenCols}
        showAllRows
        // === Selection props ===
        selectable={true}
        selectedRowKeys={selectedRowKeys}
        onSelectedRowKeysChange={(keys, _rows) => {
          console.log("Selection changed:", keys.length, "items");
          setSelectedRowKeys(keys);
        }}
        onRowClickSelect={true}
        preserveSelectedRowKeys={true}
        rowKey="id"
        // === Context menu ===
        contextMenuEnabled
        getContextMenu={(record, _selectedRows, highlightedRows, allData) => {
          // Validate record
          if (!record || !record.id) {
            // Khi không có record (vd: danh sách trống), vẫn hiển thị menu để phục hồi
            return {
              items: [
                {
                  key: "showAll",
                  label: "Hiện tất cả",
                  icon: <EyeOutlined />,
                  disabled: hiddenItemIds.length === 0,
                  onClick: () => showAllItems(),
                },
                { type: "divider" as const },
                {
                  key: "reloadList",
                  label: "Tải lại danh sách",
                  icon: <ReloadOutlined />,
                  onClick: () => window.location.reload(),
                },
              ],
            };
          }

          // Logic targets:
          // - Nếu click "Chọn" trên row chưa được chọn → targets = [record] (chỉ row hiện tại)
          // - Nếu click "Bỏ chọn" trên row đã được chọn → targets = [record] (chỉ row hiện tại)
          // - Nếu click "Bỏ chọn" trên row đã được chọn và có nhiều row được chọn → targets = selectedRows (tất cả selected)
          const targets = [record]; // Mặc định chỉ tác động đến row hiện tại

          return {
            items: [
              // === Nhóm Chọn ===
              {
                key: "select",
                label: "Chọn",
                icon: <CheckOutlined />,
                children: [
                  {
                    key: "selectAll",
                    label: "Tất cả",
                    icon: <UnorderedListOutlined />,
                    onClick: () => selectAll(allData),
                  },
                  {
                    key: "selectHighlighted",
                    label: "Bôi đen",
                    icon: <HighlightOutlined />,
                    onClick: () => {
                      const targets =
                        highlightedRows && highlightedRows.length > 0
                          ? highlightedRows
                          : [record];
                      setSelectedRowKeys((prev) => [
                        ...new Set([
                          ...prev,
                          ...targets.map((t: any) => t?.id),
                        ]),
                      ]);
                      console.log("Selected highlighted rows:", targets);
                    },
                  },
                  {
                    key: "unselectHighlighted",
                    label: "Bỏ chọn (bôi đen)",
                    icon: <CloseOutlined />,
                    onClick: () => {
                      const targets =
                        highlightedRows && highlightedRows.length > 0
                          ? highlightedRows
                          : [record];
                      setSelectedRowKeys((prev) =>
                        prev.filter(
                          (k) => !targets.map((t: any) => t?.id).includes(k)
                        )
                      );
                    },
                  },
                  {
                    key: "selectByStatus",
                    label: "Tình trạng",
                    icon: <TagsOutlined />,
                    onClick: () => console.log("Chọn theo tình trạng"),
                  },
                  {
                    key: "selectByState",
                    label: "Trạng thái",
                    icon: <BarsOutlined />,
                    onClick: () => console.log("Chọn theo trạng thái"),
                  },
                  {
                    key: "selectByPhone",
                    label: "Theo phone",
                    icon: <PhoneOutlined />,
                    onClick: () => console.log("Chọn theo phone"),
                  },
                  {
                    key: "selectByNote",
                    label: "Ghi chú",
                    icon: <FileTextOutlined />,
                    onClick: () => console.log("Chọn theo ghi chú"),
                  },
                ],
              },

              // === Bỏ chọn tất cả ===
              {
                key: "clearAll",
                label: "Bỏ chọn tất cả",
                icon: <CloseOutlined />,
                onClick: () => clearSelection(),
              },

              // === Ẩn/Hiện ===
              {
                key: "hideShow",
                label: "Ẩn/Hiện",
                icon: <EyeInvisibleOutlined />,
                children: [
                  {
                    key: "hideSelected",
                    label: "Ẩn dòng tích chọn",
                    icon: <EyeInvisibleOutlined />,
                    disabled: selectedRowKeys.length === 0,
                    onClick: () => hideSelectedItems(),
                  },
                  {
                    key: "hideUnselected",
                    label: "Ẩn dòng không tích",
                    icon: <EyeInvisibleOutlined />,
                    disabled: selectedRowKeys.length === 0,
                    onClick: () => hideUnselectedItems(),
                  },
                  {
                    key: "showAll",
                    label: "Hiện tất cả",
                    icon: <EyeOutlined />,
                    disabled: hiddenItemIds.length === 0,
                    onClick: () => showAllItems(),
                  },
                ],
              },

              // === Proxy ===
              {
                key: "proxy",
                label: "Nhập Proxy",
                icon: <GlobalOutlined />,
                onClick: () => console.log("Nhập Proxy"),
              },

              // === Sao chép ===
              {
                key: "copy",
                label: "Copy",
                icon: <CopyOutlined />,
                children: [
                  {
                    key: "copyId",
                    label: "ID",
                    icon: <IdcardOutlined />,
                    onClick: () => console.log("Copy ID:", record.id),
                  },
                  {
                    key: "copyPhone",
                    label: "Số điện thoại",
                    icon: <PhoneOutlined />,
                    onClick: () => console.log("Copy Phone:", record.phone),
                  },
                ],
              },

              // === Mở trình duyệt ===
              {
                key: "openBrowser",
                label: "Mở trình duyệt",
                icon: <ChromeOutlined />,
                onClick: () => console.log("Mở trình duyệt"),
              },

              // === Xóa ===
              {
                key: "delete",
                label: "Xóa tài khoản",
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => {
                  console.log(
                    "Xóa:",
                    targets.map((t) => t?.id)
                  );
                  handleAction("delete", targets);
                },
              },

              // === Chức năng Zalo ===
              {
                key: "zaloFunctions",
                label: "Chức năng Zalo",
                icon: <MessageOutlined />,
                onClick: () => console.log("Chức năng Zalo"),
              },

              // === Cập nhật dữ liệu ===
              {
                key: "updateData",
                label: "Cập nhật dữ liệu",
                icon: <ReloadOutlined />,
                onClick: () => console.log("Cập nhật dữ liệu"),
              },

              // === Chức năng khác ===
              {
                key: "otherFunctions",
                label: "Chức năng",
                icon: <SettingOutlined />,
                onClick: () => console.log("Chức năng khác"),
                children: [
                  {
                    key: "checkAccount",
                    label: "Kiểm tra tài khoản",
                    icon: <IdcardOutlined />,
                    onClick: () =>
                      console.log("Kiểm tra tài khoản:", record.id),
                  },
                ],
              },

              // === Chuyển thư mục ===
              {
                key: "moveFolder",
                label: "Chuyển thư mục",
                icon: <FolderOpenOutlined />,
                onClick: () => console.log("Chuyển thư mục"),
              },

              // === Hồ sơ Chrome ===
              {
                key: "chromeProfile",
                label: "Profile Chrome",
                icon: <UserOutlined />,
                onClick: () => console.log("Profile Chrome"),
              },

              // === Tải lại danh sách ===
              {
                key: "reloadList",
                label: "Tải lại danh sách",
                icon: <ReloadOutlined />,
                onClick: () => window.location.reload(),
                // onClick: () => fetchData(),
              },
            ],
          };
        }}
      />
    </div>
  );
}
