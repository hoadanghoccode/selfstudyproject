/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from "react";
import { Table, Pagination, Select, Typography, Dropdown } from "antd";
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

  hiddenColumnKeys?: string[];

  selectable?: boolean;
  selectedRowKeys?: React.Key[];
  onSelectedRowKeysChange?: (keys: React.Key[], rows: T[]) => void;
  onRowClickSelect?: boolean;
  preserveSelectedRowKeys?: boolean;
  rowKey?: string | ((record: T) => React.Key);
  pageSizeOptions?: number[];

  /** Menu chuột phải */
  contextMenuItems?: (
    record: T | null,
    selectedRecords: T[],
    allData: T[]
  ) => { label: string; key: string; onClick?: () => void; children?: any[] }[];
};

export default function CustomTableV3<T extends object>({
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
  contextMenuItems,
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

  // ===== sort =====
  const onChange: TableProps<T>["onChange"] = (_p, _f, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const field =
      (s?.field as string | undefined) ??
      (s?.column?.key as string | undefined);
    const order = (s?.order as Order) ?? null;
    handleSortClick?.({ field, order });
  };

  // ===== selection =====
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

  // ===== Context Menu state =====
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);

  const showContextMenu = (e: React.MouseEvent, record: T | null) => {
    e.preventDefault();
    if (!contextMenuItems) return;

    const selectedRecords = dataSource.filter((r) =>
      selectedKeys.includes(getRowKey(r))
    );
    const items = contextMenuItems(record, selectedRecords, dataSource);

    setMenuItems(items || []);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const onRow: TableProps<T>["onRow"] = (record) => ({
    onClick: (e) => {
      if (!selectable || !onRowClickSelect) return;
      const target = e.target as HTMLElement;
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
      const rows = dataSource.filter((r) => next.includes(getRowKey(r))) as T[];
      setKeys(next, rows);
    },
    onContextMenu: (e) => showContextMenu(e, record),
  });

  const from = dataSource.length ? (page - 1) * rowsPerPage + 1 : 0;
  const to = (page - 1) * rowsPerPage + dataSource.length;

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
      onContextMenu={(e) => {
        if ((e.target as HTMLElement).closest(".ant-table-tbody tr")) return;
        showContextMenu(e, null);
      }}
    >
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

      {menuPosition && menuItems.length > 0 && (
        <Dropdown
          open
          menu={{ items: menuItems }}
          trigger={["contextMenu"]}
          onOpenChange={(open) => {
            if (!open) setMenuPosition(null);
          }}
        >
          <div
            style={{
              position: "fixed",
              top: menuPosition.y,
              left: menuPosition.x,
              zIndex: 9999,
            }}
          />
        </Dropdown>
      )}
    </div>
  );
}
