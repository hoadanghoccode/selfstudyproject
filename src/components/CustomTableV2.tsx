import { Dropdown, Table, Typography } from "antd";
import type { TableProps } from "antd/es/table";
import React, { useMemo, useState } from "react";

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
  selectable?: boolean;
  selectedRowKeys?: React.Key[];
  onSelectedRowKeysChange?: (keys: React.Key[], rows: T[]) => void;
  onRowClickSelect?: boolean;
  preserveSelectedRowKeys?: boolean;
  rowKey?: string | ((record: T) => React.Key);
  pageSizeOptions?: number[];
  /** Bật menu chuột phải */
  contextMenuEnabled?: boolean;
  /** Hàm trả menu context cho từng row */
  getContextMenu?: (
    record: T | undefined,
    selectedRows: T[],
    highlightedRows: T[],
    allData: T[]
  ) => Parameters<typeof Dropdown>[0]["menu"];
  /** Hiển thị tất cả, ẩn phân trang và dùng footer đơn giản */
  showAllRows?: boolean;
  /** Số lượng phần tử đang được bôi đen (nếu không truyền sẽ mặc định = số đã chọn) */
  highlightedCount?: number;
};

export default function CustomTableV2<T extends object>({
  columns,
  dataSource,
  count,
  rowsPerPage,
  page,
  handleSortClick,
  loading,
  hiddenColumnKeys = [],
  selectable = true,
  selectedRowKeys,
  onSelectedRowKeysChange,
  onRowClickSelect = true,
  preserveSelectedRowKeys = true,
  rowKey,
  contextMenuEnabled = false,
  getContextMenu,
  showAllRows = false,
  highlightedCount,
}: CustomTableProps<T>) {
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
    const indexBase = showAllRows ? 0 : (page - 1) * rowsPerPage;
    return [
      {
        title: "STT",
        dataIndex: "__index",
        width: 70,
        fixed: "left" as const,
        render: (_: any, __: any, idx: number) => indexBase + idx + 1,
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
  }, [columns, hiddenColumnKeys, page, rowsPerPage, showAllRows]);

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

  // drag highlight + click cả dòng để toggle chọn
  const [highlightedKeys, setHighlightedKeys] = useState<React.Key[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startIndex, setStartIndex] = useState<number | null>(null);

  const getIndexByKey = (key: React.Key) =>
    dataSource.findIndex((r) => getRowKey(r as any) === key);
  const getKeyByIndex = (idx: number) => getRowKey(dataSource[idx] as any);

  const onRow: TableProps<T>["onRow"] = (record) => ({
    onMouseDown: (e) => {
      if (!selectable) return;
      // Chỉ khởi tạo kéo bôi đen với chuột trái
      if ((e as React.MouseEvent).button !== 0) return;
      const target = e.target as HTMLElement;
      if (
        target.closest(
          "a,button,input,textarea,select,[role='button'],.ant-checkbox"
        )
      )
        return;
      const startKey = getRowKey(record);
      setIsDragging(true);
      setStartIndex(getIndexByKey(startKey));
      setHighlightedKeys([startKey]);
      e.preventDefault();
    },
    onMouseEnter: () => {
      if (!isDragging || startIndex === null) return;
      const endIndex = getIndexByKey(getRowKey(record));
      if (endIndex < 0) return;
      const from = Math.min(startIndex, endIndex);
      const to = Math.max(startIndex, endIndex);
      const range: React.Key[] = [];
      for (let i = from; i <= to; i += 1) range.push(getKeyByIndex(i));
      setHighlightedKeys(range);
    },
    onMouseUp: () => setIsDragging(false),
    onClick: (e) => {
      if (!selectable || !onRowClickSelect) return;
      if (isDragging) return; // tránh toggle khi đang kéo chọn
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
  });

  // ===== Custom row cho context menu =====
  const ContextMenuRow = React.forwardRef<HTMLTableRowElement, any>(
    (props, ref) => {
      const { record, ...rest } = props;
      // Nếu record từ props không có id, thử lấy từ dataSource
      let actualRecord = record;
      if (!record || !record.id) {
        // Thử lấy record từ dataSource dựa trên index
        const rowIndex = props["data-row-key"]
          ? dataSource.findIndex((r) => getRowKey(r) === props["data-row-key"])
          : -1;

        if (rowIndex >= 0) {
          actualRecord = dataSource[rowIndex];
          console.log("Found record from dataSource:", actualRecord);
        } else {
          console.error("Could not find record in dataSource");
        }
      }

      const highlightedRows = dataSource.filter((r) =>
        highlightedKeys.includes(getRowKey(r))
      );
      // Ưu tiên truyền vùng bôi đen vào menu; nếu không có thì fallback selected
      const selectedRows =
        highlightedRows.length > 0
          ? highlightedRows
          : dataSource.filter((r) => selectedKeys.includes(getRowKey(r)));

      if (!contextMenuEnabled || !getContextMenu) {
        return <tr ref={ref} {...rest} />;
      }

      return (
        <Dropdown
          menu={getContextMenu(
            actualRecord,
            selectedRows,
            highlightedRows,
            dataSource
          )}
          trigger={["contextMenu"]}
          getPopupContainer={() => document.body}
          overlayStyle={{ zIndex: 10000 }}
        >
          <tr
            ref={ref}
            {...rest}
            onContextMenu={(e) => e.preventDefault()}
            style={{ cursor: "context-menu" }}
          />
        </Dropdown>
      );
    }
  );

  const components: TableProps<T>["components"] = contextMenuEnabled
    ? { body: { row: ContextMenuRow } }
    : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          borderRadius: 8,
          overflow: "hidden",
          background: "#fff",
        }}
        className="custom-table-strong-borders"
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
          rowClassName={(rec) =>
            highlightedKeys.includes(getRowKey(rec)) ? "row-highlighted" : ""
          }
          components={components}
          bordered
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontWeight: "bold",
        }}
      >
        <Typography.Text>
          Bôi đen:{" "}
          <span style={{ color: "red" }}>
            {highlightedCount ?? highlightedKeys.length}
          </span>
          <span style={{ marginLeft: 12 }}>Tất cả: </span>
          <span style={{ color: "#1677ff" }}>{count}</span>
        </Typography.Text>
      </div>
    </div>
  );
}
