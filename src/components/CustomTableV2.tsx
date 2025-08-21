import { Table, Typography, Menu } from "antd";
import type { TableProps, MenuProps } from "antd";
import React, { useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";

/* ===================== Resizable Header Cell ===================== */
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
      <th {...restProps} style={{ ...(restProps?.style || {}), width }} />
    </Resizable>
  );
});

/* ===================== Types ===================== */
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

  // Context menu
  contextMenuEnabled?: boolean;
  getContextMenu?: (
    record: T | undefined,
    selectedRows: T[],
    highlightedRows: T[],
    allData: T[]
  ) => { items?: MenuProps["items"]; onClick?: MenuProps["onClick"] } & {
    items?: (MenuProps["items"] & { onClick?: MenuProps["onClick"] }) | any;
  };

  highlightedCount?: number;

  // Resize
  resizable?: boolean;
  onColumnResize?: (dataIndex: string, width: number) => void;
};

/* ===================== Component ===================== */
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
  /* ===== rowKey ===== */
  const getRowKey =
    typeof rowKey === "function"
      ? rowKey
      : typeof rowKey === "string"
      ? (record: any) => record?.[rowKey] ?? record?.id ?? record?.key
      : (record: any, index?: number) =>
          record?.id ?? record?.key ?? String(index);

  /* ===== Sort FE ===== */
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

  /* ===== Infinite Scroll (FE) trên virtual ===== */
  const PAGE = 10; // tuỳ chỉnh
  const [list, setList] = React.useState<T[]>(() => viewData.slice(0, PAGE));
  const [hasMore, setHasMore] = React.useState(viewData.length > PAGE);
  const [loadingMore, setLoadingMore] = React.useState(false);

  console.log("list", list);

  useEffect(() => {
    setList(viewData.slice(0, PAGE));
    setHasMore(viewData.length > PAGE);
  }, [viewData]);

  const loadMore = React.useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    // nếu cần fetch API thì đổi chỗ này thành await fetch...
    requestAnimationFrame(() => {
      setList((prev) => {
        const nextLen = Math.min(prev.length + PAGE, viewData.length);
        return viewData.slice(0, nextLen);
      });
      setHasMore((_prev) => list.length + PAGE < viewData.length);
      setLoadingMore(false);
    });
  }, [loadingMore, hasMore, viewData, list.length]);

  /* ===== selection ===== */
  const [internalKeys, setInternalKeys] = React.useState<React.Key[]>([]);
  const selectedKeys = selectedRowKeys ?? internalKeys;
  const setKeys = (keys: React.Key[], rows: T[]) => {
    if (selectedRowKeys === undefined) setInternalKeys(keys);
    onSelectedRowKeysChange?.(keys, rows);
  };
  const rowSelection = selectable
    ? {
        selectedRowKeys: selectedKeys,
        onChange: (k: React.Key[], r: T[]) => setKeys(k, r),
        preserveSelectedRowKeys,
      }
    : undefined;

  /* ===== Resize widths ===== */
  const [columnWidths, setColumnWidths] = React.useState<
    Record<string, number>
  >(() => {
    const init: Record<string, number> = {};
    columns.forEach(
      (c) => typeof c.width === "number" && (init[c.dataIndex] = c.width)
    );
    init["__index"] = init["__index"] ?? 70;
    return init;
  });
  const handleResize = React.useMemo(() => {
    return (dataIndex: string) =>
      (_e: unknown, { size }: { size: { width: number; height: number } }) => {
        const nextW = Math.max(50, Math.min(1000, size.width));
        setColumnWidths((prev) =>
          prev[dataIndex] === nextW ? prev : { ...prev, [dataIndex]: nextW }
        );
        onColumnResize?.(dataIndex, nextW);
      };
  }, [onColumnResize]);

  /* ===== Drag highlight: RANGE-BASED (mượt) ===== */
  const [isMouseDown, setIsMouseDown] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startIndex, setStartIndex] = React.useState<number | null>(null);
  const startYRef = React.useRef<number>(0);
  const DRAG_THRESHOLD = 3;

  // Range {from,to} theo index GLOBAL trong viewData (vì list là prefix slice)
  const [highlightRange, setHighlightRange] = React.useState<{
    from: number;
    to: number;
  } | null>(null);
  const highlightRangeRef = React.useRef<{ from: number; to: number } | null>(
    null
  );
  useEffect(() => {
    highlightRangeRef.current = highlightRange;
  }, [highlightRange]);

  const keyIndexMap = useMemo(() => {
    const m = new Map<React.Key, number>();
    viewData.forEach((r, i) => m.set(getRowKey(r as any), i));
    return m;
  }, [viewData]);
  const getIndexByKey = (key: React.Key) => keyIndexMap.get(key) ?? -1;

  // cập nhật range nhẹ nhàng
  const updateRange = React.useCallback(
    (endIdx: number) => {
      if (startIndex === null || endIdx < 0) return;
      const from = Math.min(startIndex, endIdx);
      const to = Math.max(startIndex, endIdx);
      const cur = highlightRangeRef.current;
      if (!cur || cur.from !== from || cur.to !== to) {
        const next = { from, to };
        highlightRangeRef.current = next;
        setHighlightRange(next);
      }
    },
    [startIndex]
  );

  /* ===== Context menu (giữ logic của bạn) ===== */
  const [isResizingHeader, setIsResizingHeader] = React.useState(false);
  type CtxState = { open: boolean; x: number; y: number; record?: T };
  const [ctx, setCtx] = React.useState<CtxState>({ open: false, x: 0, y: 0 });
  const [menuItems, setMenuItems] = React.useState<MenuProps["items"]>([]);
  const handlersRef = React.useRef<Record<string, MenuProps["onClick"]>>({});
  const menuLevelOnClickRef = React.useRef<MenuProps["onClick"]>(undefined);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const tableWrapRef = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLDivElement | null>(null);

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

  const closeCtx = useCallback(
    () => setCtx((s) => ({ ...s, open: false })),
    []
  );

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

  const rowMap = useMemo(() => {
    const m = new Map<string, T>();
    viewData.forEach((r: any) => m.set(String(getRowKey(r)), r));
    return m;
  }, [viewData]);

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

      // tính selected/highlighted rows khi mở menu (lazy)
      const selSet = new Set(selectedKeys);
      const selectedRows = viewData.filter((r) => selSet.has(getRowKey(r)));
      let highlightedRows: T[] = [];
      const hr = highlightRangeRef.current;
      if (hr) highlightedRows = viewData.slice(hr.from, hr.to + 1) as T[];

      const cfg = getContextMenu(
        record,
        highlightedRows.length > 0 ? highlightedRows : selectedRows,
        highlightedRows,
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
    viewData,
    selectedKeys,
    buildMenuModel,
  ]);

  /* ===== Keyboard toggle selection (Space) ===== */
  const toggleSelectionForRange = React.useCallback(() => {
    const hr = highlightRangeRef.current;
    if (!selectable || !hr) return;
    const keysToToggle = viewData.slice(hr.from, hr.to + 1).map(getRowKey);
    const cur = new Set(selectedKeys);
    keysToToggle.forEach((k) => (cur.has(k) ? cur.delete(k) : cur.add(k)));
    const next = Array.from(cur);
    const rows = viewData.filter((r) => next.includes(getRowKey(r))) as T[];
    setKeys(next, rows);
  }, [selectable, selectedKeys, viewData, getRowKey]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === "Space" || e.key === " ") {
      const target = e.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable="true"]'))
        return;
      e.preventDefault();
      toggleSelectionForRange();
      return;
    }
    if (e.key === "Escape") setHighlightRange(null);
  };

  /* ===== onRow (khởi động drag + click/dblclick) ===== */
  const isClickInSelectionCell = (el: HTMLElement | null) => {
    const td = el?.closest("td");
    return !!td && td.classList.contains("ant-table-selection-column");
  };

  const onRow: TableProps<T>["onRow"] = (record, index) => ({
    onMouseDown: (e) => {
      if (!selectable) return;
      const target = e.target as HTMLElement;
      if (
        isClickInSelectionCell(target) ||
        target.closest(".ant-checkbox") ||
        target.closest(".react-resizable-handle")
      )
        return;
      if ((e as React.MouseEvent).button !== 0) return;
      e.preventDefault();

      const startKey = getRowKey(record);
      // index ở đây là index trong "list" (slice). Global index = index vì list là prefix của viewData.
      const idxGlobal = index ?? getIndexByKey(startKey) ?? 0;

      setIsMouseDown(true);
      setIsDragging(false);
      setStartIndex(idxGlobal);
      startYRef.current = (e as React.MouseEvent).clientY;

      // highlight trước 1 dòng
      const initRange = { from: idxGlobal, to: idxGlobal };
      setHighlightRange(initRange);
      highlightRangeRef.current = initRange;

      tableWrapRef.current?.focus();
    },
  });

  /* ===== columns + onHeaderCell ===== */
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

  /* ====== scroll.x theo tổng width ====== */
  const totalWidth = React.useMemo(() => {
    const sum = (antColumns as any[]).reduce((s, c) => {
      const w = Number(c.width);
      return s + (Number.isFinite(w) ? w : 150);
    }, 0);
    return Math.max(sum, 1000);
  }, [antColumns]);

  const components: TableProps<T>["components"] = {
    ...(resizable ? { header: { cell: ResizableTitle } } : {}),
  };

  /* ======= body holder + rowHeight + infinite scroll listener ======= */
  const [rowHeight, setRowHeight] = React.useState(36);

  React.useLayoutEffect(() => {
    const wrap = tableWrapRef.current;
    if (!wrap) return;
    const holder =
      (wrap.querySelector(
        ".rc-virtual-list-holder"
      ) as HTMLDivElement | null) ||
      (wrap.querySelector(".ant-table-body") as HTMLDivElement | null);
    bodyRef.current = holder;

    if (holder) {
      const firstRow =
        (holder.querySelector("tr.ant-table-row") as HTMLElement | null) ||
        (holder.querySelector(".ant-table-row") as HTMLElement | null);
      if (firstRow) {
        const h = firstRow.getBoundingClientRect().height;
        if (h) setRowHeight(h);
      }
    }
  }, [list.length, sorter, antColumns]);

  // infinite scroll: lắng nghe scroll trên holder
  useEffect(() => {
    const holder = bodyRef.current;
    if (!holder) return;

    const THRESHOLD = 200; // px
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (loadingMore || !hasMore) return;
        const { scrollTop, clientHeight, scrollHeight } = holder;
        if (scrollTop + clientHeight >= scrollHeight - THRESHOLD) loadMore();
      });
    };

    holder.addEventListener("scroll", onScroll);
    return () => holder.removeEventListener("scroll", onScroll);
  }, [loadMore, hasMore, loadingMore]);

  /* ======= Global mousemove/mouseup cho drag ======= */
  const isMouseDownRef = React.useRef(false);
  const isDraggingRef = React.useRef(false);
  const rowHeightRef = React.useRef(rowHeight);
  const viewLenRef = React.useRef(viewData.length);
  const updateRangeRef = React.useRef(updateRange);

  useEffect(() => {
    rowHeightRef.current = rowHeight;
  }, [rowHeight]);
  useEffect(() => {
    viewLenRef.current = viewData.length;
  }, [viewData.length]);
  useEffect(() => {
    updateRangeRef.current = updateRange;
  }, [updateRange]);
  useEffect(() => {
    isMouseDownRef.current = isMouseDown;
  }, [isMouseDown]);
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  useEffect(() => {
    let raf: number | null = null;

    const onMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current) return;
      const el = bodyRef.current;
      if (!el) return;

      const dy = Math.abs(e.clientY - startYRef.current);
      if (!isDraggingRef.current && dy > DRAG_THRESHOLD) {
        setIsDragging(true);
        isDraggingRef.current = true;
        document.body.classList.add("row-dragging");
      }

      const rect = el.getBoundingClientRect();
      const y = e.clientY - rect.top + el.scrollTop;
      const rh = rowHeightRef.current || 1;

      let endIdx = Math.floor(y / rh);
      const total = viewLenRef.current;
      endIdx = Math.max(0, Math.min(total - 1, endIdx));
      updateRangeRef.current(endIdx);

      // auto scroll
      const EDGE = 24,
        SPEED = 16;
      const wantUp = e.clientY < rect.top + EDGE;
      const wantDown = e.clientY > rect.bottom - EDGE;

      if (raf) cancelAnimationFrame(raf);
      if (wantUp || wantDown) {
        const step = () => {
          if (!isMouseDownRef.current) return;
          if (wantUp) el.scrollTop -= SPEED;
          else if (wantDown) el.scrollTop += SPEED;
          raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      }
    };

    const onUp = () => {
      if (raf) cancelAnimationFrame(raf);
      setIsMouseDown(false);
      isMouseDownRef.current = false;
      setIsDragging(false);
      isDraggingRef.current = false;
      document.body.classList.remove("row-dragging");
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  /* ===================== UI ===================== */
  const table = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        ref={tableWrapRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        style={{
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          borderRadius: 8,
          overflow: "hidden",
          background: "#fff",
        }}
        className="custom-table-strong-borders"
      >
        <Table<T>
          // virtual
          size="small"
          rowKey={getRowKey}
          columns={antColumns as any}
          dataSource={list}
          loading={loading}
          scroll={{ x: totalWidth, y: 480 }} // x/y phải là number khi virtual
          pagination={false}
          onChange={onChange}
          rowSelection={rowSelection}
          onRow={onRow}
          rowClassName={(_rec, idx) => {
            const key = getRowKey(_rec);
            const isSelected = selectedKeys.includes(key);
            // idx ở đây là index trong "list" (prefix của viewData) => globalIdx = idx
            const hr = highlightRangeRef.current;
            const isHighlighted = hr ? idx >= hr.from && idx <= hr.to : false;
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
            {highlightedCount ??
              (highlightRange
                ? highlightRange.to - highlightRange.from + 1
                : 0)}
          </span>
          <span style={{ marginLeft: 12 }}>Đã chọn: </span>
          <span style={{ color: "green" }}>{selected}</span>
          <span style={{ marginLeft: 12 }}>Tất cả: </span>
          <span style={{ color: "red" }}>{count}</span>
          {loadingMore && (
            <span style={{ marginLeft: 12, color: "#999" }}>
              (đang tải thêm...)
            </span>
          )}
        </Typography.Text>
      </div>
    </div>
  );

  /* ===== Global Context Menu (Portal) ===== */
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

/* ===== Gợi ý CSS để thấy rõ highlight =====
.row-highlighted td { background: rgba(22,119,255,0.12) !important; }
.row-selected-no-bg td { outline: 1px solid #52c41a; }
body.row-dragging { user-select: none; -webkit-user-select: none; }
*/
