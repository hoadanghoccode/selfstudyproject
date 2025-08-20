import { Table, Typography, Menu } from "antd";
import type { TableProps, MenuProps } from "antd";
import React from "react";
import { createPortal } from "react-dom";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";

/* ===================== Resizable Header Cell (no re-render while dragging) ===================== */
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

  const lastWRef = React.useRef<number>(width);

  const handleResizeStart = React.useCallback(() => {
    onHeaderResizeStart?.();
    document.body.classList.add("resizing");
  }, [onHeaderResizeStart]);

  const handleResizeStop = React.useCallback(
    (finalW?: number) => {
      onHeaderResizeStop?.(finalW);
      document.body.classList.remove("resizing");
    },
    [onHeaderResizeStop]
  );

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
            handleResizeStop(lastWRef.current);
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
      onResize={(e, data) => {
        lastWRef.current = data.size.width;
        onResize?.(e, data);
      }}
      onResizeStart={handleResizeStart}
      onResizeStop={(_e, data) => handleResizeStop(data?.size?.width)}
      draggableOpts={{ enableUserSelectHack: false, useCSSTransforms: true }}
    >
      {/* Ưu tiên style.width nếu được truyền từ onHeaderCell; fallback sang prop width */}
      <th
        {...restProps}
        style={{
          ...(restProps?.style || {}),
          width: restProps?.style?.width ?? width,
        }}
      />
    </Resizable>
  );
});

/* ===================== Types ===================== */
export type Column<T = any> = {
  title: React.ReactNode;
  dataIndex: string;
  sort?: boolean;
  aligns?: "left" | "center" | "right";
  width?: number | string; // sẽ ép về number
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

  highlightedCount?: number;

  // === Resize ===
  resizable?: boolean;
  onColumnResize?: (dataIndex: string, width: number) => void;

  // === Performance ===
  rowHeightPx?: number; // dùng cho content-visibility intrinsic size
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
  // preserveSelectedRowKeys = true,
  rowKey,
  contextMenuEnabled = false,
  getContextMenu,
  highlightedCount,
  selected = 0,
  resizable = false,
  onColumnResize,
  rowHeightPx = 40,
}: CustomTableProps<T>) {
  /* ===== rowKey ===== */
  const getRowKey =
    typeof rowKey === "function"
      ? rowKey
      : typeof rowKey === "string"
      ? (record: any) => record?.[rowKey] ?? record?.id ?? record?.key
      : (record: any, index?: number) =>
          record?.id ?? record?.key ?? String(index);

  /* ===== column widths (state to persist after drop) ===== */
  const [columnWidths, setColumnWidths] = React.useState<
    Record<string, number>
  >(() => {
    const init: Record<string, number> = {};
    columns.forEach((c) => {
      if (typeof c.width === "number") init[c.dataIndex] = c.width;
      else if (typeof c.width === "string")
        init[c.dataIndex] = parseInt(c.width, 10) || 150;
    });
    init["__index"] = init["__index"] ?? 70;
    return init;
  });

  /* ===== CSS vars for live resize (no React re-render while dragging) ===== */
  // const tableWrapRef = React.useRef<HTMLDivElement>(null);
  const cssVarName = (k: string) => `--colw-${k}`;
  const setCSSWidth = React.useCallback((k: string, w: number) => {
    tableWrapRef.current?.style.setProperty(cssVarName(k), `${w}px`);
  }, []);

  // init/update vars from state
  React.useEffect(() => {
    Object.entries(columnWidths).forEach(([k, v]) => setCSSWidth(k, v));
  }, [columnWidths, setCSSWidth]);

  // live updater (rAF throttled) & commit on stop
  const rafIdRef = React.useRef<number | null>(null);
  const schedule = (fn: () => void) => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      fn();
    });
  };
  const clampW = (w: number) => Math.max(50, Math.min(1000, w));

  const handleResizeLive = React.useMemo(() => {
    return (dataIndex: string) =>
      (_e: unknown, { size }: { size: { width: number; height: number } }) => {
        const nextW = clampW(size.width);
        schedule(() => setCSSWidth(dataIndex, nextW));
      };
  }, [setCSSWidth]);

  const commitWidth = React.useCallback(
    (dataIndex: string, w?: number) => {
      if (typeof w !== "number") return;
      const nextW = clampW(w);
      setCSSWidth(dataIndex, nextW);
      setColumnWidths((prev) =>
        prev[dataIndex] === nextW ? prev : { ...prev, [dataIndex]: nextW }
      );
      onColumnResize?.(dataIndex, nextW);
    },
    [onColumnResize, setCSSWidth]
  );

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
        preserveSelectedRowKeys: true,
      }
    : undefined;

  /* ===== drag highlight ===== */
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

  const keyIndexMap = React.useMemo(() => {
    const m = new Map<React.Key, number>();
    viewData.forEach((r, i) => m.set(getRowKey(r as any), i));
    return m;
  }, [viewData]);
  const getIndexByKey = (key: React.Key) => keyIndexMap.get(key) ?? -1;
  const getKeyByIndex = (idx: number) => getRowKey(viewData[idx] as any);

  /* ===== context menu ===== */
  const [isResizingHeader, setIsResizingHeader] = React.useState(false);
  type CtxState = { open: boolean; x: number; y: number; record?: T };
  const [ctx, setCtx] = React.useState<CtxState>({ open: false, x: 0, y: 0 });
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

  const closeCtx = React.useCallback(
    () => setCtx((s) => ({ ...s, open: false })),
    []
  );

  React.useEffect(() => {
    if (!ctx.open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t)) return;
      // giữ menu khi click/right-click trong table; onCtx sẽ cập nhật record & di chuyển
      if (tableWrapRef.current?.contains(t)) return;
      closeCtx();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCtx();
    window.addEventListener("click", onDoc);
    window.addEventListener("contextmenu", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("click", onDoc);
      window.removeEventListener("contextmenu", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [ctx.open, closeCtx]);

  const highlightedKeySet = React.useMemo(
    () => new Set(highlightedKeys),
    [highlightedKeys]
  );
  const selectedKeySet = React.useMemo(
    () => new Set(selectedKeys),
    [selectedKeys]
  );
  const highlightedRowsMemo = React.useMemo(
    () => viewData.filter((r) => highlightedKeySet.has(getRowKey(r))),
    [viewData, highlightedKeySet]
  );
  const selectedRowsMemo = React.useMemo(
    () => viewData.filter((r) => selectedKeySet.has(getRowKey(r))),
    [viewData, selectedKeySet]
  );

  const rowMap = React.useMemo(() => {
    const m = new Map<string, T>();
    viewData.forEach((r: any) => m.set(String(getRowKey(r)), r));
    return m;
  }, [viewData]);

  React.useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const onCtx = (e: MouseEvent) => {
      if (!contextMenuEnabled || !getContextMenu || isResizingHeader) return;
      const target = e.target as HTMLElement;
      if (!el.contains(target)) return;
      e.preventDefault();
      e.stopPropagation();

      // 1) ưu tiên DOM: phần tử gần nhất có data-row-key
      let record: T | undefined;
      const rowEl = target.closest("[data-row-key]") as HTMLElement | null;
      if (rowEl) {
        const keyAttr = rowEl.getAttribute("data-row-key");
        if (keyAttr) record = rowMap.get(String(keyAttr));
      }
      // 2) fallback theo toạ độ (khi virtual/sticky làm mất data-row-key tạm thời)
      if (!record) {
        const body = el.querySelector(
          ".ant-table-body"
        ) as HTMLDivElement | null;
        const rect = body?.getBoundingClientRect();
        if (rect) {
          // ước lượng index theo vị trí click, giả định rowHeightPx
          const scrollTop = body!.scrollTop;
          const y = e.clientY - rect.top + scrollTop;
          const idx = Math.max(
            0,
            Math.min(viewData.length - 1, Math.floor(y / rowHeightPx))
          );
          record = viewData[idx];
        }
      }

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

    el.addEventListener("contextmenu", onCtx, { capture: true });
    return () =>
      el.removeEventListener(
        "contextmenu",
        onCtx as any,
        { capture: true } as any
      );
  }, [
    contextMenuEnabled,
    getContextMenu,
    isResizingHeader,
    rowMap,
    highlightedRowsMemo,
    selectedRowsMemo,
    viewData,
    buildMenuModel,
    rowHeightPx,
  ]);

  /* ===== Toggle by Space & Esc ===== */
  const toggleSelectionFor = React.useCallback(
    (keysToToggle: React.Key[]) => {
      if (!selectable || keysToToggle.length === 0) return;
      const cur = new Set(selectedKeys);
      keysToToggle.forEach((k) => (cur.has(k) ? cur.delete(k) : cur.add(k)));
      const next = Array.from(cur);
      const rows = viewData.filter((r) => next.includes(getRowKey(r))) as T[];
      setKeys(next, rows);
    },
    [selectable, selectedKeys, viewData, getRowKey]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === "Space" || e.key === " ") {
      const target = e.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable="true"]'))
        return;
      if (highlightedKeys.length === 0) return;
      e.preventDefault();
      toggleSelectionFor(highlightedKeys);
    } else if (e.key === "Escape") {
      setHighlightedKeys([]);
    }
  };

  React.useEffect(() => {
    const up = () => {
      setIsMouseDown(false);
      setIsDragging(false);
    };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

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
      const idx = index ?? getIndexByKey(startKey) ?? 0;
      setIsMouseDown(true);
      setIsDragging(false);
      setStartIndex(idx);
      startYRef.current = (e as React.MouseEvent).clientY;
      setHighlightedKeys([startKey]);
      tableWrapRef.current?.focus();
    },
    onMouseMove: (e) => {
      if (!isMouseDown || isDragging) return;
      const dy = Math.abs((e as React.MouseEvent).clientY - startYRef.current);
      if (dy > DRAG_THRESHOLD) {
        setIsDragging(true);
        const endIdx = index ?? getIndexByKey(getRowKey(record));
        updateRange(endIdx);
      }
    },
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
      tableWrapRef.current?.focus();
      if (!selectable || isDragging) return;
      const clickTarget = event.target as HTMLElement;
      if (isClickInSelectionCell(clickTarget)) {
        if (clickTarget.closest(".ant-checkbox")) return; // để AntD xử lý
        const key = getRowKey(record);
        const exists = selectedKeys.includes(key);
        const next = exists
          ? selectedKeys.filter((k) => k !== key)
          : [...selectedKeys, key];
        const rows = viewData.filter((r) => next.includes(getRowKey(r))) as T[];
        setKeys(next, rows);
        return;
      }
      if (!onRowClickSelect) return;
      if (clickTarget.closest(".react-resizable-handle")) return;

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
        const rows = viewData.filter((r) => next.includes(getRowKey(r))) as T[];
        setKeys(next, rows);
      } else {
        setLastClickTime(now);
        setLastClickKey(currentKey);
      }
    },
  });

  /* ===== columns (ẩn/hiện) + STT + onHeaderCell (resize via CSS vars) ===== */
  const antColumns = React.useMemo(() => {
    const visible = columns.filter(
      (c) => !hiddenColumnKeys.includes(c.dataIndex)
    );

    const sttNum =
      typeof columnWidths["__index"] === "number"
        ? columnWidths["__index"]
        : 70;
    const sttVar = `var(${cssVarName("__index")}, ${sttNum}px)`;

    const sttCol: any = {
      title: "STT",
      dataIndex: "__index",
      width: sttNum, // số cho Resizable
      fixed: "left" as const,
      render: (_: any, __: any, idx: number) => idx + 1,
      onHeaderCell: resizable
        ? () => ({
            width: sttNum,
            style: { width: sttVar },
            onResize: handleResizeLive("__index"),
            onHeaderResizeStart: () => setIsResizingHeader(true),
            onHeaderResizeStop: (finalW?: number) => {
              setIsResizingHeader(false);
              commitWidth("__index", finalW);
            },
            minWidth: 50,
            maxWidth: 200,
          })
        : undefined,
    };

    const dataCols = visible.map((c) => {
      const wNum =
        typeof columnWidths[c.dataIndex] === "number"
          ? columnWidths[c.dataIndex]
          : typeof c.width === "number"
          ? c.width
          : typeof c.width === "string"
          ? parseInt(c.width, 10) || 150
          : 150;
      const wVar = `var(${cssVarName(c.dataIndex)}, ${wNum}px)`;

      return {
        title: c.title,
        dataIndex: c.dataIndex,
        key: c.dataIndex,
        width: wNum, // size cho Resizable
        align: c.aligns,
        ellipsis: true,
        sorter: c.sorter ?? false,
        defaultSortOrder: c.defaultSortOrder,
        render: (value: any, record: any, index: number) =>
          c.render ? c.render(value, record, index) : value,
        onHeaderCell:
          resizable && c.resizable !== false
            ? () => ({
                width: wNum,
                style: { width: wVar }, // vẽ thực tế theo CSS var → không re-render khi kéo
                onResize: handleResizeLive(c.dataIndex),
                onHeaderResizeStart: () => setIsResizingHeader(true),
                onHeaderResizeStop: (finalW?: number) => {
                  setIsResizingHeader(false);
                  commitWidth(c.dataIndex, finalW);
                },
                minWidth: c.minWidth ?? 50,
                maxWidth: c.maxWidth ?? 1000,
              })
            : undefined,
      };
    });

    return [sttCol, ...dataCols];
  }, [
    columns,
    hiddenColumnKeys,
    columnWidths,
    resizable,
    handleResizeLive,
    commitWidth,
  ]);

  /* ===== components (header resize + body row perf) ===== */
  const components: TableProps<T>["components"] = {
    ...(resizable ? { header: { cell: ResizableTitle } } : {}),
    body: {
      row: (props: any) => (
        <tr
          {...props}
          style={{
            ...props.style,
            contentVisibility: "auto", // bỏ qua layout/paint cho row offscreen
            containIntrinsicSize: `${rowHeightPx}px`,
          }}
        />
      ),
    },
  };

  /* ===== UI ===== */
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
          contain: "layout paint", // hạn chế phạm vi reflow/paint khi kéo
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
