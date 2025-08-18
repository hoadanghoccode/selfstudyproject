import { Dropdown, Table, Typography } from "antd";
import type { TableProps } from "antd/es/table";
import React, { useMemo, useState } from "react";

export type Column<T = any> = {
  title: React.ReactNode;
  dataIndex: string;
  sort?: boolean;
  aligns?: "left" | "center" | "right";
  width?: number | string;
  render?: (value: any, row: any, index: number) => React.ReactNode;
  /** Sort: luôn truyền compare fn nếu muốn bật sort */
  sorter?: (a: T, b: T) => number;
  defaultSortOrder?: "ascend" | "descend";
};

export type CustomTableProps<T extends object> = {
  selected: number;
  columns: Column[];
  dataSource: T[];
  count: number;
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
  highlightedCount,
  selected = 0,
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
    return [
      {
        title: "STT",
        dataIndex: "__index",
        width: 70,
        fixed: "left" as const,
        render: (_: any, __: any, idx: number) => idx + 1,
      } as any,
      ...visible.map((c) => ({
        title: c.title,
        dataIndex: c.dataIndex,
        key: c.dataIndex,
        width: c.width,
        align: c.aligns,
        ellipsis: true,
        sorter: c.sorter ?? false,
        defaultSortOrder: c.defaultSortOrder,
        render: (value: any, record: any, index: number) =>
          c.render ? c.render(value, record, index) : value,
      })),
    ];
  }, [columns, hiddenColumnKeys]);

  // ===== onChange handler =====
  const onChange: TableProps<T>["onChange"] = (_p, _f, s) => {
    const srt = Array.isArray(s) ? s[0] : s; // đơn giản: lấy sort đầu
    const order = srt?.order;
    const field = srt?.field as React.Key | undefined;
    setSorter(order ? { field, order } : null);
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
  const [highlightedKeys, setHighlightedKeys] = useState<React.Key[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [startIndex, setStartIndex] = useState<number | null>(null);
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [lastClickKey, setLastClickKey] = useState<React.Key | null>(null);

  type Sorter = { field?: React.Key; order?: "ascend" | "descend" } | null;
  const [sorter, setSorter] = useState<Sorter>(() => {
    const c = columns.find((c) => c.defaultSortOrder);
    return c ? { field: c.dataIndex, order: c.defaultSortOrder } : null;
  });

  const viewData = useMemo(() => {
    if (!sorter?.field) return dataSource;

    const col = columns.find((c) => c.dataIndex === sorter.field);
    if (!col?.sorter) return dataSource;

    const cmp = col.sorter; // compare function do bạn cung cấp
    const arr = [...dataSource].sort((a, b) => {
      const r = (cmp as any)(a, b);
      return sorter.order === "descend" ? -r : r;
    });
    return arr;
  }, [dataSource, columns, sorter]);

  const keyIndexMap = useMemo(() => {
    const m = new Map<React.Key, number>();
    viewData.forEach((r, i) => m.set(getRowKey(r as any), i));
    return m;
  }, [viewData]);

  // const getIndexByKey = (key: React.Key) =>
  //   dataSource.findIndex((r) => getRowKey(r as any) === key);
  // const getKeyByIndex = (idx: number) => getRowKey(dataSource[idx] as any);
  const getIndexByKey = (key: React.Key) => keyIndexMap.get(key) ?? -1;
  const getKeyByIndex = (idx: number) => getRowKey(viewData[idx] as any);

  const onRow: TableProps<T>["onRow"] = (record, index) => ({
    onMouseDown: (e) => {
      if (!selectable) return;
      if ((e as React.MouseEvent).button !== 0) return;
      const target = e.target as HTMLElement;
      if (
        target.closest(
          "a,button,input,textarea,select,[role='button'],.ant-checkbox"
        )
      )
        return;
      e.preventDefault();

      const timeout = setTimeout(() => {
        const startKey = getRowKey(record);
        setIsDragging(true);
        // ưu tiên index đang render; fallback qua map nếu thiếu
        setStartIndex(index ?? getIndexByKey(startKey) ?? 0);
        setHighlightedKeys([startKey]);
      }, 150);

      (e.currentTarget as any)._dragTimeout = timeout;
    },
    onMouseEnter: () => {
      if (!isDragging || startIndex === null) return;
      const endIndex = index ?? getIndexByKey(getRowKey(record));
      if (endIndex == null || endIndex < 0) return;

      const from = Math.min(startIndex, endIndex);
      const to = Math.max(startIndex, endIndex);
      const range: React.Key[] = [];
      for (let i = from; i <= to; i += 1) range.push(getKeyByIndex(i));
      setHighlightedKeys(range);
    },
    onMouseUp: () => setIsDragging(false),
    onClick: (event) => {
      console.log("Click vào row:", record);

      // Hủy timeout drag nếu có
      const target = event.currentTarget as any;
      if (target._dragTimeout) {
        clearTimeout(target._dragTimeout);
        target._dragTimeout = null;
        console.log("Đã hủy drag timeout");
      }

      if (!selectable || !onRowClickSelect) {
        console.log(
          "Click bị chặn - selectable:",
          selectable,
          "onRowClickSelect:",
          onRowClickSelect
        );
        return;
      }

      if (isDragging) {
        console.log("Đang dragging - bỏ qua click");
        return;
      }

      const clickTarget = event.target as HTMLElement;
      // Chỉ loại trừ khi click trực tiếp vào checkbox, cho phép click vào các phần khác của row
      if (clickTarget.closest(".ant-checkbox")) {
        console.log("Click vào checkbox - bỏ qua");
        return;
      }

      const currentTime = Date.now();
      const currentKey = getRowKey(record);

      // Kiểm tra double-click (trong vòng 300ms và cùng một row)
      if (currentTime - lastClickTime < 300 && lastClickKey === currentKey) {
        console.log("Double click detected cho row:", currentKey);

        // Reset double-click state
        setLastClickTime(0);
        setLastClickKey(null);

        // Xử lý double-click
        const key = getRowKey(record);
        const exists = selectedKeys.includes(key);
        const next = exists
          ? selectedKeys.filter((k) => k !== key)
          : [...selectedKeys, key];

        const rows = dataSource.filter((r) =>
          next.includes(getRowKey(r))
        ) as T[];
        setKeys(next, rows);

        console.log(
          "Đã cập nhật selection - key:",
          key,
          "exists:",
          exists,
          "next:",
          next
        );
      } else {
        // Single click - lưu thông tin để detect double-click
        setLastClickTime(currentTime);
        setLastClickKey(currentKey);
        console.log("Single click - lưu để detect double-click");
      }
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
          // console.log("Found record from dataSource:", actualRecord);
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

  const content = (
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
          dataSource={viewData}
          loading={loading}
          sticky
          scroll={{ x: true }}
          pagination={false}
          onChange={onChange}
          tableLayout="fixed"
          rowSelection={rowSelection}
          onRow={onRow}
          rowClassName={(rec) => {
            const isHighlighted = highlightedKeys.includes(getRowKey(rec));
            const isSelected = selectedKeys.includes(getRowKey(rec));
            return `${isHighlighted ? "row-highlighted" : ""} ${
              isSelected ? "row-selected-no-bg" : ""
            }`;
          }}
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
          <span style={{ color: "#1677ff" }}>
            {highlightedCount ?? highlightedKeys.length}
          </span>
          <span style={{ marginLeft: 12 }}>Đã chọn: </span>
          <span style={{ color: "green" }}>{selected}</span>
          <span style={{ marginLeft: 12 }}>Tất cả: </span>
          <span style={{ color: "red" }}>{count}</span>
        </Typography.Text>
      </div>
    </div>
  );

  // Khi không có data, vẫn cho phép click chuột phải trên toàn bộ khu vực bảng
  if (contextMenuEnabled && getContextMenu && dataSource.length === 0) {
    return (
      <Dropdown
        menu={getContextMenu({} as T, [], [], dataSource)}
        trigger={["contextMenu"]}
        getPopupContainer={() => document.body}
        overlayStyle={{ zIndex: 10000 }}
      >
        <div
          onContextMenu={(e) => e.preventDefault()}
          style={{
            minHeight: 200,
            cursor: "context-menu",
            width: "100%",
          }}
        >
          {content}
        </div>
      </Dropdown>
    );
  }

  return content;
}
