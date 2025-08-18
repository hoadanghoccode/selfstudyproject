import { Table, Typography, Menu } from "antd";
import type { TableProps, MenuProps } from "antd";
import React, { useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";

// ===================== Resizable Header Cell =====================
const ResizableTitle = React.memo((props: any) => {
  const {
    onResize,
    width,
    minWidth = 50,
    maxWidth = 1000,
    onHeaderResizeStart,
    onHeaderResizeStop,
    ...restProps
  } = props;

  if (!width) return <th {...restProps} />;

  const handleResizeStart = React.useCallback(() => {
    onHeaderResizeStart?.();
    document.body.classList.add("resizing");
  }, [onHeaderResizeStart]);

  const handleResizeStop = React.useCallback(() => {
    onHeaderResizeStop?.();
    document.body.classList.remove("resizing");
  }, [onHeaderResizeStop]);

  return (
    <Resizable
      width={width}
      height={0}
      minConstraints={[minWidth, 0]}
      maxConstraints={[maxWidth, 0]}
      handle={
        <span
          className="react-resizable-handle"
          onMouseDown={(e) => {
            e.stopPropagation();
            handleResizeStart();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            handleResizeStop();
          }}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 8,
            cursor: "col-resize",
          }}
        />
      }
      onResize={onResize}
      onResizeStart={handleResizeStart}
      onResizeStop={handleResizeStop}
      draggableOpts={{ enableUserSelectHack: false, useCSSTransforms: true }}
    >
      <th {...restProps} style={{ position: "relative", width }} />
    </Resizable>
  );
});

// ===================== Types =====================
export type Column<T = any> = {
  title: React.ReactNode;
  dataIndex: string;
  sort?: boolean;
  aligns?: "left" | "center" | "right";
  width?: number | string;
  render?: (value: any, row: any, index: number) => React.ReactNode;
  sorter?: (a: T, b: T) => number;
  defaultSortOrder?: "ascend" | "descend";
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
};

export type CustomTableProps<T extends object> = {
  selected: number;
  columns: Column[];
  dataSource: T[];
  count: number;
  loading?: boolean;
  hiddenColumnKeys?: string[];
  selectable?: boolean;
  selectedRowKeys?: React.Key[];
  onSelectedRowKeysChange?: (keys: React.Key[], rows: T[]) => void;
  onRowClickSelect?: boolean;
  preserveSelectedRowKeys?: boolean;
  rowKey?: string | ((record: T) => React.Key);
  pageSizeOptions?: number[];

  // === Context menu ===
  contextMenuEnabled?: boolean;
  getContextMenu?: (
    record: T | undefined,
    selectedRows: T[],
    highlightedRows: T[],
    allData: T[]
  ) => { items?: MenuProps["items"]; onClick?: MenuProps["onClick"] } & {
    items?: (MenuProps["items"] & { onClick?: MenuProps["onClick"] }) | any;
  };

  showAllRows?: boolean;
  highlightedCount?: number;

  // === Resize ===
  resizable?: boolean;
  onColumnResize?: (dataIndex: string, width: number) => void;
};

// ===================== Component =====================
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
  resizable = false,
  onColumnResize,
}: CustomTableProps<T>) {
  // ===== rowKey =====
  const getRowKey =
    typeof rowKey === "function"
      ? rowKey
      : typeof rowKey === "string"
      ? (record: any) => record?.[rowKey] ?? record?.id ?? record?.key
      : (record: any, index?: number) =>
          record?.id ?? record?.key ?? String(index);

  // ===== column widths =====
  const [columnWidths, setColumnWidths] = React.useState<
    Record<string, number>
  >(() => {
    const init: Record<string, number> = {};
    columns.forEach((c) => {
      if (typeof c.width === "number") init[c.dataIndex] = c.width;
    });
    init["__index"] = init["__index"] ?? 70;
    return init;
  });

  const handleResize = React.useMemo(() => {
    return (dataIndex: string) => {
      return (
        _e: unknown,
        { size }: { size: { width: number; height: number } }
      ) => {
        const nextW = Math.max(50, Math.min(1000, size.width));
        setColumnWidths((prev) =>
          prev[dataIndex] === nextW ? prev : { ...prev, [dataIndex]: nextW }
        );
        onColumnResize?.(dataIndex, nextW);
      };
    };
  }, [onColumnResize]);

  // ===== Sort FE =====
  type Sorter = { field?: React.Key; order?: "ascend" | "descend" } | null;
  const [sorter, setSorter] = React.useState<Sorter>(() => {
    const c = columns.find((c) => c.defaultSortOrder);
    return c ? { field: c.dataIndex, order: c.defaultSortOrder } : null;
  });

  const onChange: TableProps<T>["onChange"] = (_p, _f, s) => {
    const srt = Array.isArray(s) ? s[0] : s;
    const order = srt?.order;
    const field = srt?.field as React.Key | undefined;
    setSorter(order ? { field, order } : null);
  };

  const viewData = React.useMemo(() => {
    if (!sorter?.field) return dataSource;
    const col = columns.find((c) => c.dataIndex === sorter.field);
    if (!col?.sorter) return dataSource;
    const cmp = col.sorter;
    const arr = [...dataSource].sort((a, b) => {
      const r = (cmp as any)(a, b);
      return sorter.order === "descend" ? -r : r;
    });
    return arr;
  }, [dataSource, columns, sorter]);

  // ===== selection =====
  const [internalKeys, setInternalKeys] = React.useState<React.Key[]>([]);
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

  // ===== drag highlight (HYBRID) =====
  const [highlightedKeys, setHighlightedKeys] = React.useState<React.Key[]>([]);
  const [isMouseDown, setIsMouseDown] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startIndex, setStartIndex] = React.useState<number | null>(null);
  const [lastClickTime, setLastClickTime] = React.useState<number>(0);
  const [lastClickKey, setLastClickKey] = React.useState<React.Key | null>(
    null
  );
  const startYRef = React.useRef<number>(0);

  const DRAG_THRESHOLD = 3; // px

  const keyIndexMap = useMemo(() => {
    const m = new Map<React.Key, number>();
    viewData.forEach((r, i) => m.set(getRowKey(r as any), i));
    return m;
  }, [viewData]);

  const getIndexByKey = (key: React.Key) => keyIndexMap.get(key) ?? -1;
  const getKeyByIndex = (idx: number) => getRowKey(viewData[idx] as any);

  // ===== context menu: GLOBAL =====
  const [isResizingHeader, setIsResizingHeader] = React.useState(false);
  type CtxState = { open: boolean; x: number; y: number; record?: T };
  const [ctx, setCtx] = React.useState<CtxState>({ open: false, x: 0, y: 0 });

  // Build & giữ model menu tại thời điểm mở (items + handlers)
  const [menuItems, setMenuItems] = React.useState<MenuProps["items"]>([]);
  const handlersRef = React.useRef<Record<string, MenuProps["onClick"]>>({});
  const menuLevelOnClickRef = React.useRef<MenuProps["onClick"]>(undefined);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const tableWrapRef = React.useRef<HTMLDivElement>(null);

  const buildMenuModel = React.useCallback(
    (cfg: ReturnType<NonNullable<typeof getContextMenu>> | undefined) => {
      const handlers: Record<string, MenuProps["onClick"]> = {};
      const walk = (items: any[] | undefined): any[] | undefined => {
        if (!items) return items;
        return items.map((it) => {
          if (!it) return it;
          const { onClick, children, ...rest } = it;
          if (onClick && rest?.key != null)
            handlers[String(rest.key)] = onClick;
          const node: any = { ...rest };
          if (children && Array.isArray(children))
            node.children = walk(children);
          return node;
        });
      };
      const items = walk(cfg?.items as any[]);
      return { items, handlers, menuOnClick: cfg?.onClick };
    },
    []
  );

  const closeCtx = useCallback(() => {
    setCtx((s) => ({ ...s, open: false }));
  }, []);

  // đóng menu khi click ngoài / Esc
  useEffect(() => {
    if (!ctx.open) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      closeCtx();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCtx();
    window.addEventListener("click", onDocClick);
    window.addEventListener("contextmenu", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", onDocClick);
      window.removeEventListener("contextmenu", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [ctx.open, closeCtx]);

  const highlightedKeySet = useMemo(
    () => new Set(highlightedKeys),
    [highlightedKeys]
  );
  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys]);

  const highlightedRowsMemo = useMemo(
    () => viewData.filter((r) => highlightedKeySet.has(getRowKey(r))),
    [viewData, highlightedKeySet]
  );

  const selectedRowsMemo = useMemo(
    () => viewData.filter((r) => selectedKeySet.has(getRowKey(r))),
    [viewData, selectedKeySet]
  );

  // rowKey -> record map để bắt contextmenu ở wrapper
  const rowMap = useMemo(() => {
    const m = new Map<string, T>();
    viewData.forEach((r: any) => m.set(String(getRowKey(r)), r));
    return m;
  }, [viewData]);

  // Bắt chuột phải ở wrapper của bảng
  useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const onCtx = (e: MouseEvent) => {
      if (!contextMenuEnabled || !getContextMenu || isResizingHeader) return;
      const target = e.target as HTMLElement;
      if (!el.contains(target)) return;

      e.preventDefault();
      e.stopPropagation();

      const tr = target.closest("tr[data-row-key]") as HTMLElement | null;
      const keyAttr = tr?.getAttribute("data-row-key") ?? undefined;
      const record = keyAttr ? rowMap.get(String(keyAttr)) : undefined;

      const cfg = getContextMenu(
        record,
        highlightedRowsMemo.length > 0 ? highlightedRowsMemo : selectedRowsMemo,
        highlightedRowsMemo,
        viewData
      );
      const model = buildMenuModel(cfg);
      setMenuItems(model.items);
      handlersRef.current = model.handlers || {};
      menuLevelOnClickRef.current = model.menuOnClick;

      setCtx({ open: true, x: e.clientX, y: e.clientY, record });
    };

    el.addEventListener("contextmenu", onCtx);
    return () => el.removeEventListener("contextmenu", onCtx);
  }, [
    contextMenuEnabled,
    getContextMenu,
    isResizingHeader,
    rowMap,
    highlightedRowsMemo,
    selectedRowsMemo,
    viewData,
    buildMenuModel,
  ]);

  // ====== Toggle chọn theo danh sách key (Space) ======
  const toggleSelectionFor = React.useCallback(
    (keysToToggle: React.Key[]) => {
      if (!selectable || keysToToggle.length === 0) return;

      const cur = new Set(selectedKeys);
      keysToToggle.forEach((k) => {
        if (cur.has(k)) cur.delete(k);
        else cur.add(k);
      });

      const next = Array.from(cur);
      const rows = dataSource.filter((r) => next.includes(getRowKey(r))) as T[];
      setKeys(next, rows);
    },
    [selectable, selectedKeys, dataSource, getRowKey]
  );

  // ====== Bắt phím Space trên wrapper ======
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Space -> toggle chọn/bỏ chọn theo vùng bôi đen
    if (e.code === "Space" || e.key === " ") {
      const target = e.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable="true"]'))
        return;
      if (highlightedKeys.length === 0) return;
      e.preventDefault();
      toggleSelectionFor(highlightedKeys);
      return;
    }

    // Esc -> clear vùng bôi đen
    if (e.key === "Escape") {
      setHighlightedKeys([]);
    }
  };

  // ====== Dừng drag nếu nhả chuột ngoài bảng ======
  React.useEffect(() => {
    const up = () => {
      setIsMouseDown(false);
      setIsDragging(false);
    };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  // ====== Cập nhật dải bôi đen theo endIndex ======
  const updateRange = React.useCallback(
    (endIdx: number) => {
      if (startIndex === null || endIdx < 0) return;
      const from = Math.min(startIndex, endIdx);
      const to = Math.max(startIndex, endIdx);
      const range: React.Key[] = [];
      for (let i = from; i <= to; i++) range.push(getKeyByIndex(i));
      setHighlightedKeys(range.length ? range : [getKeyByIndex(startIndex)]);
    },
    [startIndex, getKeyByIndex]
  );

  // ===== onRow (drag highlight + click/dblclick) =====
  const onRow: TableProps<T>["onRow"] = (record, index) => ({
    onMouseDown: (e) => {
      if (!selectable) return;
      if ((e as React.MouseEvent).button !== 0) return;

      const target = e.target as HTMLElement;
      if (
        target.closest(
          "a,button,input,textarea,select,[role='button'],.ant-checkbox,.react-resizable-handle"
        )
      )
        return;

      e.preventDefault();
      const startKey = getRowKey(record);
      const idx = index ?? getIndexByKey(startKey) ?? 0;

      setIsMouseDown(true);
      setIsDragging(false); // sẽ thành true khi di chuyển vượt ngưỡng
      setStartIndex(idx);
      startYRef.current = (e as React.MouseEvent).clientY;

      // 👇 RESET vùng bôi đen sang item đang click
      setHighlightedKeys([startKey]);

      tableWrapRef.current?.focus(); // nhận phím Space
    },

    // Bắt đầu drag ngay cả khi còn ở hàng đầu tiên
    onMouseMove: (e) => {
      if (!isMouseDown || isDragging) return;
      const dy = Math.abs((e as React.MouseEvent).clientY - startYRef.current);
      if (dy > DRAG_THRESHOLD) {
        setIsDragging(true);
        const endIdx = index ?? getIndexByKey(getRowKey(record));
        updateRange(endIdx);
      }
    },

    // Khi đã drag, sang hàng khác thì mở rộng/thu hẹp dải
    onMouseEnter: () => {
      if (!isMouseDown || !isDragging) return;
      const endIdx = index ?? getIndexByKey(getRowKey(record));
      updateRange(endIdx);
    },

    onMouseUp: () => {
      setIsMouseDown(false);
      setIsDragging(false);
    },

    onClick: (event) => {
      // đảm bảo wrapper có focus để sau đó Space hoạt động
      tableWrapRef.current?.focus();

      if (!selectable || !onRowClickSelect) return;
      if (isDragging) return; // click sau khi drag: bỏ qua

      const clickTarget = event.target as HTMLElement;
      if (
        clickTarget.closest(".ant-checkbox") ||
        clickTarget.closest(".react-resizable-handle")
      )
        return;

      const now = Date.now();
      const currentKey = getRowKey(record);

      if (now - lastClickTime < 300 && lastClickKey === currentKey) {
        setLastClickTime(0);
        setLastClickKey(null);

        const key = getRowKey(record);
        const exists = selectedKeys.includes(key);
        const next = exists
          ? selectedKeys.filter((k) => k !== key)
          : [...selectedKeys, key];

        const rows = dataSource.filter((r) =>
          next.includes(getRowKey(r))
        ) as T[];
        setKeys(next, rows);
      } else {
        setLastClickTime(now);
        setLastClickKey(currentKey);
      }
    },
  });

  // ===== columns (ẩn/hiện) + STT + onHeaderCell (resize) =====
  const antColumns = React.useMemo(() => {
    const visible = columns.filter(
      (c) => !hiddenColumnKeys.includes(c.dataIndex)
    );

    const sttW =
      typeof columnWidths["__index"] === "number"
        ? columnWidths["__index"]
        : 70;

    const sttCol: any = {
      title: "STT",
      dataIndex: "__index",
      width: sttW,
      fixed: "left" as const,
      render: (_: any, __: any, idx: number) => idx + 1,
      onHeaderCell: resizable
        ? () => ({
            width: sttW,
            onResize: handleResize("__index"),
            onHeaderResizeStart: () => setIsResizingHeader(true),
            onHeaderResizeStop: () => setIsResizingHeader(false),
            minWidth: 50,
            maxWidth: 200,
          })
        : undefined,
    };

    const dataCols = visible.map((c) => {
      const w =
        typeof columnWidths[c.dataIndex] === "number"
          ? columnWidths[c.dataIndex]
          : typeof c.width === "number"
          ? c.width
          : typeof c.width === "string"
          ? parseInt(c.width, 10) || 150
          : 150;

      return {
        title: c.title,
        dataIndex: c.dataIndex,
        key: c.dataIndex,
        width: w,
        align: c.aligns,
        ellipsis: true,
        sorter: c.sorter ?? false,
        defaultSortOrder: c.defaultSortOrder,
        render: (value: any, record: any, index: number) =>
          c.render ? c.render(value, record, index) : value,
        onHeaderCell:
          resizable && c.resizable !== false
            ? () => ({
                width: w,
                onResize: handleResize(c.dataIndex),
                onHeaderResizeStart: () => setIsResizingHeader(true),
                onHeaderResizeStop: () => setIsResizingHeader(false),
                minWidth: c.minWidth ?? 50,
                maxWidth: c.maxWidth ?? 1000,
              })
            : undefined,
      };
    });

    return [sttCol, ...dataCols];
  }, [columns, hiddenColumnKeys, columnWidths, resizable, handleResize]);

  // ===== components (chỉ override header để resize) =====
  const components: TableProps<T>["components"] = {
    ...(resizable ? { header: { cell: ResizableTitle } } : {}),
  };

  // ===== UI =====
  const table = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        ref={tableWrapRef}
        tabIndex={0} // để nhận sự kiện bàn phím
        onKeyDown={handleKeyDown} // Space để toggle theo highlightedKeys
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
          sticky={false}
          scroll={{ x: "max-content" }}
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

  // ===== Global Context Menu (Portal) =====
  const menuPortal =
    contextMenuEnabled &&
    ctx.open &&
    createPortal(
      <div
        ref={menuRef}
        style={{
          position: "fixed",
          top: ctx.y,
          left: ctx.x,
          zIndex: 10000,
          background: "#fff",
          border: "1px solid #f0f0f0",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          borderRadius: 8,
          overflow: "hidden",
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Menu
          items={menuItems}
          onClick={(info) => {
            const h = handlersRef.current[String(info.key)];
            if (h) h(info);
            else menuLevelOnClickRef.current?.(info);
            closeCtx();
          }}
        />
      </div>,
      document.body
    );

  return (
    <>
      {table}
      {menuPortal}
    </>
  );
}
