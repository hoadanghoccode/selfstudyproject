/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from "react";
import { Table, Pagination, Select, Typography } from "antd";
import type { TableProps } from "antd/es/table";
import { useI18n } from "../i18n/I18nContext";

type Order = "ascend" | "descend" | null;

export type Column = {
  title: React.ReactNode;
  dataIndex: string;
  sort?: boolean;
  aligns?: "left" | "center" | "right";
  width?: number | string;
  render?: (value: any, row: any, index: number) => React.ReactNode;
};

export type CustomTableProps<T extends object> = {
  columns: Column[];
  dataSource: T[];
  count: number;
  rowsPerPage: number;
  page: number;
  setPage: (p: number) => void;
  setRowsPerPage: (n: number) => void;
  handleSortClick?: (p: { field?: string; order: Order }) => void;
  loading?: boolean;

  /** Ẩn/hiện cột (điều khiển từ ngoài) */
  hiddenColumnKeys?: string[];

  /** Selection (khôi phục) */
  selectable?: boolean; // bật checkbox (mặc định: true)
  selectedRowKeys?: React.Key[]; // controlled
  onSelectedRowKeysChange?: (keys: React.Key[], rows: T[]) => void;
  onRowClickSelect?: boolean; // click cả dòng để toggle (mặc định: true)
  preserveSelectedRowKeys?: boolean; // giữ chọn khi đổi trang (mặc định: true)
  rowKey?: string | ((record: T) => React.Key);
  pageSizeOptions?: number[];
};

export default function CustomTable<T extends object>({
  columns,
  dataSource,
  count,
  rowsPerPage,
  page,
  setPage,
  setRowsPerPage,
  handleSortClick,
  loading,

  hiddenColumnKeys = [],

  selectable = true,
  selectedRowKeys,
  onSelectedRowKeysChange,
  onRowClickSelect = true,
  preserveSelectedRowKeys = true,

  rowKey,
  pageSizeOptions = [10, 20, 50, 100, 1000],
}: CustomTableProps<T>) {
  const { t } = useI18n();
  // ===== rowKey =====
  const getRowKey =
    typeof rowKey === "function"
      ? rowKey
      : typeof rowKey === "string"
      ? (record: any) => record?.[rowKey] ?? record?.id ?? record?.key
      : (record: any, index?: number) =>
          record?.id ?? record?.key ?? String(index);

  // ===== columns (lọc theo hidden) + STT =====
  const antColumns = useMemo(() => {
    const visible = columns.filter(
      (c) => !hiddenColumnKeys.includes(c.dataIndex)
    );
    return [
      {
        title: "STT",
        dataIndex: "__index",
        width: 70,
        fixed: "left" as const,
        render: (_: any, __: any, idx: number) =>
          (page - 1) * rowsPerPage + idx + 1,
      } as any,
      ...visible.map((c) => ({
        title: c.title,
        dataIndex: c.dataIndex,
        key: c.dataIndex,
        width: c.width,
        align: c.aligns,
        ellipsis: true,
        sorter: !!c.sort,
        render: (value: any, record: any, index: number) =>
          c.render ? c.render(value, record, index) : value,
      })),
    ];
  }, [columns, hiddenColumnKeys, page, rowsPerPage]);

  // ===== sort -> bắn ra ngoài =====
  const onChange: TableProps<T>["onChange"] = (_p, _f, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const field =
      (s?.field as string | undefined) ??
      (s?.column?.key as string | undefined);
    const order = (s?.order as Order) ?? null;
    handleSortClick?.({ field, order });
  };

  // ===== selection: controlled/uncontrolled =====
  const [internalKeys, setInternalKeys] = useState<React.Key[]>([]);
  const selectedKeys = selectedRowKeys ?? internalKeys;

  const setKeys = (keys: React.Key[], rows: T[]) => {
    if (selectedRowKeys === undefined) setInternalKeys(keys);
    onSelectedRowKeysChange?.(keys, rows);
  };

  const rowSelection = selectable
    ? {
        selectedRowKeys: selectedKeys,
        onChange: (keys: React.Key[], rows: T[]) => setKeys(keys, rows),
        preserveSelectedRowKeys,
      }
    : undefined;

  // click cả dòng để toggle chọn (trừ khi click vào phần tử tương tác)
  const onRow: TableProps<T>["onRow"] = (record) => ({
    onClick: (e) => {
      if (!selectable || !onRowClickSelect) return;
      const target = e.target as HTMLElement;
      // bỏ qua click vào phần tử tương tác
      if (
        target.closest(
          "a,button,input,textarea,select,[role='button'],.ant-checkbox"
        )
      )
        return;

      const key = getRowKey(record);
      const exists = selectedKeys.includes(key);
      const next = exists
        ? selectedKeys.filter((k) => k !== key)
        : [...selectedKeys, key];

      // lấy rows tương ứng (ít nhất row hiện tại)
      const rows = dataSource.filter((r) => next.includes(getRowKey(r))) as T[];
      setKeys(next, rows);
    },
  });

  // ===== footer range =====
  const from = dataSource.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = (page - 1) * rowsPerPage + dataSource.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Table<T>
        size="small"
        rowKey={getRowKey}
        columns={antColumns as any}
        dataSource={dataSource}
        loading={loading}
        sticky
        scroll={{ x: true }}
        pagination={false}
        onChange={onChange}
        tableLayout="fixed"
        rowSelection={rowSelection}
        onRow={onRow}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Typography.Text>
          {t("account.table.range", { from, to, count })}
        </Typography.Text>

        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <Select
            value={rowsPerPage}
            onChange={(ps) => {
              setPage(1);
              setRowsPerPage(ps);
            }}
            options={pageSizeOptions.map((n) => ({
              value: n,
              label: String(n),
            }))}
            style={{ width: 100 }}
          />
        </div>

        <Pagination
          current={page}
          pageSize={rowsPerPage}
          total={count}
          onChange={(p, ps) => {
            if (ps !== rowsPerPage) setRowsPerPage(ps);
            setPage(p);
          }}
          showSizeChanger={false}
        />
      </div>
    </div>
  );
}
