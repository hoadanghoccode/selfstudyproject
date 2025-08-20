import { Table, Typography, Menu } from "antd";
import type { TableProps, MenuProps } from "antd";
import React, { useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";

/** =====================================================
 * CustomTableV3
 * - Nâng cấp từ bản V2 bạn gửi: giữ toàn bộ API cũ
 * - Thêm: Shift-click chọn dải, Ctrl/Cmd-click toggle, Ctrl+A chọn tất cả
 * - Thêm: Auto-scroll khi kéo bôi đen ra mép trên/dưới (y), rAF-throttle
 * - Thêm: tuỳ chọn highlight theo “rect” (chỉ lưu from/to index) để scale lớn
 * - Cải thiện: chặn drag khi resize header, context menu auto-fit viewport
 * - Cải thiện: shouldCellUpdate để giảm re-render khi highlight
 * ===================================================== */

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
      <th {...restProps} style={{ ...(restProps?.style || {}), width }} />
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
  shouldCellUpdate?: (record: T, prevRecord: T) => boolean; // NEW: tối ưu render
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

  // === NEW features ===
  virtual?: boolean; // passthrough cho Table nếu bạn đang dùng AntD build có hỗ trợ
  highlightAsRect?: boolean; // nếu true: lưu from/to index thay vì mảng key → scale tốt
  autoScrollWhileDrag?: boolean; // auto scroll khi kéo
  onHighlightChange?: (
    keys: React.Key[],
    rect: { from: number; to: number } | null
  ) => void;
};

// util nhỏ: rAF-throttle cho setState nặng
function useRafThrottle() {
  const rafRef = React.useRef<number | null>(null);
  const schedule = React.useCallback((fn: () => void) => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      fn();
    });
  }, []);
  React.useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    []
  );
  return schedule;
}

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
  virtual = false,
  highlightAsRect = true,
  autoScrollWhileDrag = true,
  onHighlightChange,
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

  // ===== drag highlight (rows) =====
  const [isMouseDown, setIsMouseDown] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [startIndex, setStartIndex] = React.useState<number | null>(null);
  const startYRef = React.useRef<number>(0);
  const schedule = useRafThrottle();

  // Hai chế độ highlight: mảng key hoặc rect (from/to)
  const [highlightedKeys, setHighlightedKeys] = React.useState<React.Key[]>([]);
  const [selRect, setSelRect] = React.useState<{
    from: number;
    to: number;
  } | null>(null);

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

      // auto-fit menu vào viewport
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mx = Math.min(e.clientX, vw - 240); // 240 ~ menu width dự kiến
      const my = Math.min(e.clientY, vh - 320); // cao dự kiến

      setCtx({ open: true, x: Math.max(8, mx), y: Math.max(8, my), record });
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

  // ====== Keyboard: Space (toggle), Esc (clear), Ctrl/Cmd+A (select all) ======
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('input,textarea,select,[contenteditable="true"]'))
      return;

    // Ctrl/Cmd + A: chọn tất cả
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      e.preventDefault();
      const allKeys = viewData.map((r) => getRowKey(r));
      const rows = viewData as T[];
      setKeys(allKeys, rows);
      return;
    }

    // Ctrl/Cmd + Shift + A: bỏ chọn tất cả
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
      e.preventDefault();
      setKeys([], [] as any);
      return;
    }

    // Space -> toggle chọn/bỏ chọn theo vùng bôi đen
    if (e.code === "Space" || e.key === " ") {
      if (highlightAsRect && selRect) {
        const { from, to } = selRect;
        const keys: React.Key[] = [];
        for (let i = from; i <= to; i++) keys.push(getKeyByIndex(i));
        e.preventDefault();
        toggleSelectionFor(keys);
        return;
      }
      if (highlightedKeys.length > 0) {
        e.preventDefault();
        toggleSelectionFor(highlightedKeys);
        return;
      }
    }

    // Esc -> clear vùng bôi đen
    if (e.key === "Escape") {
      setHighlightedKeys([]);
      setSelRect(null);
      onHighlightChange?.([], null);
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

  // ====== Cập nhật dải bôi đen theo endIndex (rAF-throttle) ======
  const updateRange = React.useCallback(
    (endIdx: number) => {
      if (startIndex === null || endIdx < 0) return;
      const from = Math.min(startIndex, endIdx);
      const to = Math.max(startIndex, endIdx);

      if (highlightAsRect) {
        setSelRect({ from, to });
        const keys: React.Key[] = [];
        for (let i = from; i <= to; i++) keys.push(getKeyByIndex(i));
        setHighlightedKeys(keys);
        onHighlightChange?.(keys, { from, to });
      } else {
        const range: React.Key[] = [];
        for (let i = from; i <= to; i++) range.push(getKeyByIndex(i));
        setHighlightedKeys(range.length ? range : [getKeyByIndex(startIndex)]);
        onHighlightChange?.(range, null);
      }
    },
    [startIndex, getKeyByIndex, highlightAsRect, onHighlightChange]
  );

  const DRAG_THRESHOLD = 3; // px

  const isClickInSelectionCell = (el: HTMLElement | null) => {
    const td = el?.closest("td");
    return !!td && td.classList.contains("ant-table-selection-column");
  };

  // ===== auto-scroll while dragging =====
  const autoScrollTimerRef = React.useRef<number | null>(null);
  const stopAutoScroll = () => {
    if (autoScrollTimerRef.current != null)
      cancelAnimationFrame(autoScrollTimerRef.current);
    autoScrollTimerRef.current = null;
  };
  const runAutoScroll = (e: React.MouseEvent, idx: number) => {
    if (!autoScrollWhileDrag) return;
    const wrap = tableWrapRef.current;
    if (!wrap) return;
    const scroller = wrap.querySelector(
      ".ant-table-body"
    ) as HTMLElement | null;
    if (!scroller) return;

    const rect = scroller.getBoundingClientRect();
    const y = e.clientY;
    const margin = 24; // vùng nhạy kéo sát mép
    let dy = 0;
    if (y < rect.top + margin) dy = -8;
    else if (y > rect.bottom - margin) dy = 8;

    if (dy === 0) {
      stopAutoScroll();
      return;
    }

    const step = () => {
      scroller.scrollTop += dy;
      // ước lượng index theo chiều cuộn
      const endIdx = idx + (dy > 0 ? 1 : -1);
      schedule(() =>
        updateRange(Math.max(0, Math.min(viewData.length - 1, endIdx)))
      );
      autoScrollTimerRef.current = requestAnimationFrame(step);
    };

    if (autoScrollTimerRef.current == null)
      autoScrollTimerRef.current = requestAnimationFrame(step);
  };

  // ===== onRow (drag highlight + click/dblclick + shift/ctrl) =====
  const lastClickRef = React.useRef<{ time: number; key: React.Key | null }>({
    time: 0,
    key: null,
  });

  const onRow: TableProps<T>["onRow"] = (record, index) => ({
    onMouseDown: (e) => {
      if (!selectable) return;

      const target = e.target as HTMLElement;
      // không kích hoạt highlight khi bấm vào checkbox hoặc handle resize
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

      if (highlightAsRect) setSelRect({ from: idx, to: idx });
      setHighlightedKeys([startKey]);
      tableWrapRef.current?.focus();
    },

    onMouseMove: (e) => {
      if (!isMouseDown) return;
      const dy = Math.abs((e as React.MouseEvent).clientY - startYRef.current);
      if (!isDragging && dy > DRAG_THRESHOLD) setIsDragging(true);
      if (!isDragging) return;
      const endIdx = index ?? getIndexByKey(getRowKey(record));
      schedule(() => updateRange(endIdx));
      runAutoScroll(e as React.MouseEvent, endIdx);
    },

    onMouseEnter: (e) => {
      if (!isMouseDown || !isDragging) return;
      const endIdx = index ?? getIndexByKey(getRowKey(record));
      schedule(() => updateRange(endIdx));
      runAutoScroll(e as React.MouseEvent, endIdx);
    },

    onMouseUp: () => {
      setIsMouseDown(false);
      setIsDragging(false);
      stopAutoScroll();
    },

    onClick: (event) => {
      tableWrapRef.current?.focus();
      if (!selectable || isDragging) return;

      const clickTarget = event.target as HTMLElement;
      if (isClickInSelectionCell(clickTarget)) return; // để AntD xử lý checkbox
      if (clickTarget.closest(".react-resizable-handle")) return;

      const currentKey = getRowKey(record);
      const now = Date.now();

      // SHIFT: chọn dải từ last anchor (startIndex) tới row hiện tại
      if ((event as React.MouseEvent).shiftKey && startIndex != null) {
        const idx = index ?? getIndexByKey(currentKey);
        const from = Math.min(startIndex, idx);
        const to = Math.max(startIndex, idx);
        const rangeKeys: React.Key[] = [];
        for (let i = from; i <= to; i++) rangeKeys.push(getKeyByIndex(i));
        const rows = viewData.filter((_, i) => i >= from && i <= to) as T[];
        setKeys(Array.from(new Set([...selectedKeys, ...rangeKeys])), rows);
        setHighlightedKeys(rangeKeys);
        setSelRect({ from, to });
        onHighlightChange?.(rangeKeys, { from, to });
        return;
      }

      // Ctrl/Cmd: toggle 1 item
      if (
        (event as React.MouseEvent).metaKey ||
        (event as React.MouseEvent).ctrlKey
      ) {
        const exists = selectedKeys.includes(currentKey);
        const next = exists
          ? selectedKeys.filter((k) => k !== currentKey)
          : [...selectedKeys, currentKey];
        const rows = dataSource.filter((r) =>
          next.includes(getRowKey(r))
        ) as T[];
        setKeys(next, rows);
        setHighlightedKeys([currentKey]);
        setSelRect({
          from: getIndexByKey(currentKey),
          to: getIndexByKey(currentKey),
        });
        onHighlightChange?.([currentKey], {
          from: getIndexByKey(currentKey),
          to: getIndexByKey(currentKey),
        });
        return;
      }

      // Double click: toggle dòng đó
      if (
        now - lastClickRef.current.time < 300 &&
        lastClickRef.current.key === currentKey
      ) {
        lastClickRef.current = { time: 0, key: null };
        const exists = selectedKeys.includes(currentKey);
        const next = exists
          ? selectedKeys.filter((k) => k !== currentKey)
          : [...selectedKeys, currentKey];
        const rows = dataSource.filter((r) =>
          next.includes(getRowKey(r))
        ) as T[];
        setKeys(next, rows);
      } else {
        lastClickRef.current = { time: now, key: currentKey };
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
      shouldCellUpdate: () => false, // STT ổn định, không cần update
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
        shouldCellUpdate: c.shouldCellUpdate ?? (() => false),
      } as any;
    });

    return [sttCol, ...dataCols];
  }, [columns, hiddenColumnKeys, columnWidths, resizable, handleResize]);

  // ===== components (chỉ override header để resize) =====
  const components: TableProps<T>["components"] = {
    ...(resizable ? { header: { cell: ResizableTitle } } : {}),
  };

  // ===== rowClassName (tối ưu: dùng chỉ số để highlight khi rect-mode) =====
  const rowClassName: TableProps<T>["rowClassName"] = (rec, idx) => {
    const k = getRowKey(rec);
    const isSelected = selectedKeys.includes(k);

    let isHighlighted = false;
    if (highlightAsRect && selRect && typeof idx === "number") {
      isHighlighted = idx >= selRect.from && idx <= selRect.to;
    } else {
      isHighlighted = highlightedKeys.includes(k);
    }

    return `${isHighlighted ? "row-highlighted" : ""} ${
      isSelected ? "row-selected-no-bg" : ""
    }`;
  };

  // ===== UI =====
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
          rowClassName={rowClassName}
          components={components}
          bordered
          {...(virtual ? ({ virtual: true } as any) : {})}
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
              (highlightAsRect && selRect
                ? selRect.to - selRect.from + 1
                : highlightedKeys.length)}
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

/* =============================================
  CSS gợi ý bổ sung (đặt trong global/styled):

  .row-highlighted td { background: #e6f7ff !important; }
  .row-selected-no-bg td { outline: 1px solid #1677ff; }
  .resizing * { cursor: col-resize !important; user-select: none !important; }

  // Tăng hit-area cho handle resize (nếu muốn)
  .react-resizable-handle { background: transparent; }
  .react-resizable-handle:hover { background: rgba(22,119,255,0.1); }
============================================= */
