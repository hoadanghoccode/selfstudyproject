import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useTable,
  useSortBy,
  useBlockLayout,
  useResizeColumns,
  Column,
} from "react-table";
import { FixedSizeList as List, type ListOnScrollProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

/**
 * Virtualized React Table (react-table v7 + react-window)
 * - 12 cột, 200 bản ghi mẫu
 * - Sort (click header)
 * - Resize cột (kéo ở mép phải header)
 * - Kéo-bôi-đen chọn nhiều hàng (drag select)
 * - Context menu (chuột phải) cho từng hàng
 * - Tối ưu re-render: virtualization + memo + rAF throttle khi kéo
 */

// ====== Types ======
export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  progress: number;
  status: "single" | "relationship" | "complicated";
  city: string;
  state: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
};

// ====== Utils: Dummy data (200 rows) ======
function makeData(count = 200): Person[] {
  const firstNames = [
    "Liam",
    "Olivia",
    "Noah",
    "Emma",
    "Ava",
    "Mia",
    "Lucas",
    "Amelia",
    "Ethan",
    "Sophia",
  ];
  const lastNames = [
    "Nguyen",
    "Tran",
    "Le",
    "Pham",
    "Hoang",
    "Vu",
    "Pham",
    "Do",
    "Bui",
    "Dang",
  ];
  const cities = ["Hanoi", "Ho Chi Minh", "Da Nang", "Hai Phong", "Can Tho"];
  const states = ["HN", "HCM", "DN", "HP", "CT"];
  const companies = ["Acme", "Globex", "Innotech", "VietDev", "OceanSoft"];
  const jobs = ["Engineer", "Designer", "PM", "Analyst", "QA"];
  const rand = (n: number) => Math.floor(Math.random() * n);
  return Array.from({ length: count }).map((_, i) => {
    const fn = firstNames[rand(firstNames.length)];
    const ln = lastNames[rand(lastNames.length)];
    const city = cities[rand(cities.length)];
    const state = states[rand(states.length)];
    const company = companies[rand(companies.length)];
    const job = jobs[rand(jobs.length)];
    const age = 18 + rand(42);
    const visits = rand(1000);
    const progress = rand(100);
    const statusOpts: Person["status"][] = [
      "single",
      "relationship",
      "complicated",
    ];
    const status = statusOpts[rand(statusOpts.length)];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@${company.toLowerCase()}.com`;
    const phone = `09${rand(9)}${rand(9)}-${rand(9)}${rand(9)}${rand(9)}-${rand(
      9
    )}${rand(9)}`;
    return {
      id: String(i + 1),
      firstName: fn,
      lastName: ln,
      age,
      visits,
      progress,
      status,
      city,
      state,
      email,
      phone,
      company,
      jobTitle: job,
    };
  });
}

// ====== Component ======
const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 44;

type ContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  row?: Person;
};

export default function VirtualizedReactTable() {
  const data = useMemo(() => makeData(200), []);

  const columns = useMemo<Column<Person>[]>(
    () => [
      { Header: "First Name", accessor: "firstName", width: 140 },
      { Header: "Last Name", accessor: "lastName", width: 140 },
      { Header: "Age", accessor: "age", width: 80 },
      { Header: "Visits", accessor: "visits", width: 100 },
      { Header: "%", accessor: "progress", width: 80 },
      { Header: "Status", accessor: "status", width: 140 },
      { Header: "City", accessor: "city", width: 140 },
      { Header: "State", accessor: "state", width: 80 },
      { Header: "Email", accessor: "email", width: 220 },
      { Header: "Phone", accessor: "phone", width: 160 },
      { Header: "Company", accessor: "company", width: 160 },
      { Header: "Job", accessor: "jobTitle", width: 160 },
    ],
    []
  );

  const defaultColumn = useMemo(
    () => ({ width: 140, minWidth: 60, maxWidth: 500 }),
    []
  );

  const {
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
    totalColumnsWidth,
    state: tableState,
  } = useTable<Person>(
    {
      columns,
      data,
      defaultColumn,
      autoResetSortBy: false,
      autoResetResize: false,
    },
    useBlockLayout,
    useResizeColumns,
    useSortBy
  );

  // ====== Selection state ======
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  const toggleRow = useCallback((id: string, value?: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const shouldSelect = value ?? !prev.has(id);
      if (shouldSelect) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const selectRange = useCallback(
    (start: number, end: number, merge = false) => {
      const [s, e] = start < end ? [start, end] : [end, start];
      setSelected((prev) => {
        const next = merge ? new Set(prev) : new Set<string>();
        for (let i = s; i <= e; i++) next.add(rows[i].original.id);
        return next;
      });
    },
    [rows]
  );

  // ====== Drag-select logic ======
  const [dragging, setDragging] = useState(false);
  const [dragRange, setDragRange] = useState<[number, number] | null>(null);
  const listRef = useRef<List>(null);
  const scrollOffsetRef = useRef(0);
  const rAFRef = useRef<number | null>(null);

  const getIndexFromClientY = useCallback(
    (clientY: number, container: HTMLElement) => {
      const rect = container.getBoundingClientRect();
      const y = clientY - rect.top + scrollOffsetRef.current - HEADER_HEIGHT; // minus header height
      const idx = Math.floor(y / ROW_HEIGHT);
      return Math.max(0, Math.min(rows.length - 1, idx));
    },
    [rows.length]
  );

  const onScroll = useCallback((p: ListOnScrollProps) => {
    scrollOffsetRef.current = p.scrollOffset;
  }, []);

  const onRowMouseDown = useCallback(
    (e: React.MouseEvent, rowIndex: number) => {
      if (e.button !== 0) return; // only left click starts drag-select
      const container = (e.currentTarget as HTMLElement).closest(
        ".vrt-container"
      ) as HTMLElement | null;
      if (!container) return;

      e.preventDefault();
      setDragging(true);
      setLastClickedIndex(rowIndex);
      setDragRange([rowIndex, rowIndex]);

      // Shift-click behaviour: extend from last clicked without starting drag
      if (e.shiftKey && lastClickedIndex != null) {
        selectRange(lastClickedIndex, rowIndex, e.ctrlKey || e.metaKey);
      }

      const move = (ev: MouseEvent) => {
        if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
        rAFRef.current = requestAnimationFrame(() => {
          const idx = getIndexFromClientY(ev.clientY, container);
          setDragRange(([start]) => [start, idx]);
        });
      };

      const up = (ev: MouseEvent) => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", up);
        setDragging(false);
        rAFRef.current && cancelAnimationFrame(rAFRef.current);
        rAFRef.current = null;
        const containerNow = container;
        const endIdx = getIndexFromClientY(ev.clientY, containerNow);
        const [startIdx] = dragRange ?? [rowIndex, rowIndex];
        const merge = ev.ctrlKey || ev.metaKey; // additive selection with Ctrl/Cmd
        selectRange(startIdx, endIdx, merge);
        setDragRange(null);
      };

      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up, { once: true });
    },
    [dragRange, getIndexFromClientY, lastClickedIndex, selectRange]
  );

  // ====== Context menu ======
  const [menu, setMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
  });
  const closeMenu = useCallback(
    () => setMenu((m) => ({ ...m, visible: false })),
    []
  );
  useEffect(() => {
    const fn = () => setMenu((m) => (m.visible ? { ...m, visible: false } : m));
    window.addEventListener("scroll", fn, true);
    window.addEventListener("resize", fn);
    return () => {
      window.removeEventListener("scroll", fn, true);
      window.removeEventListener("resize", fn);
    };
  }, []);

  const onRowContextMenu = useCallback((e: React.MouseEvent, row: Person) => {
    e.preventDefault();
    setMenu({ visible: true, x: e.clientX, y: e.clientY, row });
  }, []);

  const copyRowJSON = useCallback(
    (row: Person) => {
      navigator.clipboard?.writeText(JSON.stringify(row, null, 2));
      closeMenu();
    },
    [closeMenu]
  );

  const exportSelectedCSV = useCallback(() => {
    if (selected.size === 0) return;
    const selectedRows = rows
      .filter((r) => selected.has(r.original.id))
      .map((r) => r.original);
    const headers = Object.keys(selectedRows[0]);
    const csv = [
      headers.join(","),
      ...selectedRows.map((r) =>
        headers.map((h) => JSON.stringify((r as any)[h] ?? "")).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${selected.size}-rows.csv`;
    a.click();
    URL.revokeObjectURL(url);
    closeMenu();
  }, [closeMenu, rows, selected]);

  // ====== Cell/Row renderers ======
  const RenderRow = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const row = rows[index];
      prepareRow(row);

      const isDraggingOver = dragRange
        ? (() => {
            const [s, e] =
              dragRange[0] < dragRange[1]
                ? dragRange
                : [dragRange[1], dragRange[0]];
            return index >= s && index <= e;
          })()
        : false;

      const isSelected = selected.has(row.original.id);

      return (
        <div
          className={[
            "flex w-full items-center border-b border-slate-200",
            isDraggingOver
              ? "bg-blue-50"
              : isSelected
              ? "bg-blue-100"
              : index % 2 === 0
              ? "bg-white"
              : "bg-slate-50",
            "cursor-default select-none",
          ].join(" ")}
          style={{ ...style, height: ROW_HEIGHT }}
          onMouseDown={(e) => onRowMouseDown(e, index)}
          onContextMenu={(e) => onRowContextMenu(e, row.original)}
        >
          {row.cells.map((cell) => (
            <div
              {...cell.getCellProps()}
              className="px-3 text-sm truncate"
              title={String(cell.value)}
            >
              {cell.render("Cell")}
            </div>
          ))}
        </div>
      );
    },
    [dragRange, onRowContextMenu, onRowMouseDown, prepareRow, rows, selected]
  );

  return (
    <div className="w-full h-[600px] rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div
        className="bg-slate-100 border-b border-slate-200"
        {...getTableProps()}
      >
        {headerGroups.map((headerGroup) => (
          <div
            {...headerGroup.getHeaderGroupProps()}
            className="flex items-center"
            style={{ height: HEADER_HEIGHT, width: totalColumnsWidth }}
          >
            {headerGroup.headers.map((column: any) => (
              <div
                {...column.getHeaderProps(column.getSortByToggleProps())}
                className="px-3 h-full flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wide relative select-none border-r border-slate-200"
              >
                <span
                  className="truncate"
                  title={String(column.render("Header"))}
                >
                  {column.render("Header")}
                </span>
                {/* Sort indicator */}
                <span className="text-[10px] text-slate-500">
                  {column.isSorted ? (column.isSortedDesc ? "▼" : "▲") : ""}
                </span>
                {/* Resizer */}
                {column.canResize && (
                  <div
                    {...column.getResizerProps?.()}
                    className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none ${
                      column.isResizing ? "bg-blue-400" : "bg-transparent"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="vrt-container w-full h-[calc(600px-44px)]">
        <AutoSizer>
          {({ width, height }) => (
            <List
              ref={listRef}
              height={height}
              width={width}
              itemCount={rows.length}
              itemSize={ROW_HEIGHT}
              onScroll={onScroll}
              overscanCount={8}
            >
              {({ index, style }) => (
                <div style={{ width: totalColumnsWidth }}>
                  <RenderRow index={index} style={style} />
                </div>
              )}
            </List>
          )}
        </AutoSizer>
      </div>

      {/* Footer / status bar */}
      <div className="h-10 flex items-center gap-4 px-3 text-sm text-slate-600 bg-white border-t border-slate-200">
        <div>Rows: {rows.length}</div>
        <div>Selected: {selected.size}</div>
        <button
          className="ml-auto px-3 py-1 rounded-xl border border-slate-300 hover:bg-slate-50"
          onClick={exportSelectedCSV}
          disabled={selected.size === 0}
        >
          Export CSV
        </button>
      </div>

      {/* Context Menu */}
      {menu.visible && (
        <div
          className="fixed z-50 bg-white border border-slate-200 rounded-xl shadow-lg text-sm overflow-hidden"
          style={{ left: menu.x + 2, top: menu.y + 2, minWidth: 200 }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 font-medium text-slate-700 border-b border-slate-100 truncate">
            {menu.row?.firstName} {menu.row?.lastName}
          </div>
          <button
            className="w-full text-left px-3 py-2 hover:bg-slate-50"
            onClick={() => menu.row && toggleRow(menu.row.id)}
          >
            {menu.row && selected.has(menu.row.id)
              ? "Bỏ chọn hàng"
              : "Chọn hàng"}
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-slate-50"
            onClick={() => menu.row && copyRowJSON(menu.row)}
          >
            Copy row JSON
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-slate-50 disabled:opacity-50"
            onClick={exportSelectedCSV}
            disabled={selected.size === 0}
          >
            Export selection (.csv)
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-slate-50"
            onClick={closeMenu}
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
}
