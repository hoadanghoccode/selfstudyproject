// CustomTanStackTable.tsx – pure CSS (no Tailwind)
// TanStack Table v8  |  Features: FE sort, column resize, drag-to-select rows, ~100 rows, scroll-only
// How to use:
//   npm i @tanstack/react-table
//   import CustomTanStackTable from './CustomTanStackTable'
//   <CustomTanStackTable />

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  SortingState,
  RowSelectionState,
} from "@tanstack/react-table";

type Status = "Active" | "Inactive" | "Pending";

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  city: string;
  status: Status;
}

function makeId(n: number) {
  return `id_${n.toString().padStart(3, "0")}`;
}

function makePeople(count = 100): Person[] {
  const firstNames = [
    "An",
    "Bình",
    "Chi",
    "Dũng",
    "Em",
    "Giang",
    "Hà",
    "Hải",
    "Khoa",
    "Linh",
    "Minh",
    "Nam",
    "Oanh",
    "Phúc",
    "Quân",
    "Quỳnh",
    "Sơn",
    "Tâm",
    "Trang",
    "Vy",
  ];
  const lastNames = [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Phan",
    "Vũ",
    "Đặng",
    "Bùi",
    "Đỗ",
    "Hồ",
    "Ngô",
  ];
  const cities = [
    "Hà Nội",
    "Hải Phòng",
    "Đà Nẵng",
    "Nha Trang",
    "Đà Lạt",
    "Hồ Chí Minh",
    "Cần Thơ",
    "Huế",
  ];
  const statuses: Status[] = ["Active", "Inactive", "Pending"];

  const people: Person[] = [];
  for (let i = 0; i < count; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 7) % lastNames.length];
    const city = cities[(i * 5) % cities.length];
    const status = statuses[(i * 11) % statuses.length];
    const age = 18 + ((i * 13) % 47);
    const id = makeId(i + 1);
    people.push({
      id,
      firstName: fn,
      lastName: ln,
      age,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`,
      city,
      status,
    });
  }
  return people;
}

function StatusPill({ value }: { value: Status }) {
  const cls =
    value === "Active"
      ? "ct-pill active"
      : value === "Inactive"
      ? "ct-pill inactive"
      : "ct-pill pending";
  return <span className={cls}>{value}</span>;
}

// Inline CSS (pure CSS)
function InlineStyles() {
  return (
    <style>{`
  .ct-container { width:100%; font-family:system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; }
  .ct-toolbar { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:8px; margin:0 0 8px; }
  .ct-btn { border:1px solid #e5e7eb; background:#fff; padding:6px 10px; border-radius:10px; box-shadow: 0 1px 2px rgba(0,0,0,.04); cursor:pointer; }
  .ct-btn:hover { background:#f9fafb; }
  .ct-meta { font-size:14px; color:#374151; }
  .ct-meta .muted { color:#9ca3af; margin-left:6px; }

  .ct-tablewrap { border:1px solid #e5e7eb; border-radius:16px; box-shadow: 0 1px 2px rgba(0,0,0,.05); overflow:hidden; }
  .ct-scroll { max-height:520px; overflow:auto; -webkit-overflow-scrolling:touch; }

  .ct-table { border-collapse:separate; border-spacing:0; width:max-content; table-layout:fixed; background:#fff; }
  .ct-thead { position:sticky; top:0; z-index:10; background:#fff; }
  .ct-th { position:relative; border-bottom:1px solid #e5e7eb; padding:8px 12px; text-align:left; font-weight:600; font-size:14px; color:#374151; user-select:none; }
  .ct-th.sortable { cursor:pointer; }
  .ct-td { border-bottom:1px solid #f3f4f6; padding:8px 12px; font-size:14px; color:#374151; }

  .ct-tr:hover { background:#f9fafb; }
  .ct-tr.selected { background:#eff6ff; }

  .ct-resizer { position:absolute; right:-3px; top:0; height:100%; width:8px; cursor:col-resize; opacity:0; transition:opacity .15s; }
  .ct-th:hover .ct-resizer { opacity:1; }
  .ct-resizer.active { background:rgba(59,130,246,.25); opacity:1; }

  .ct-pill { display:inline-flex; align-items:center; border-radius:999px; padding:2px 8px; border:1px solid; font-size:12px; }
  .ct-pill.active { background:#ecfdf5; color:#047857; border-color:#a7f3d0; }
  .ct-pill.inactive { background:#f3f4f6; color:#374151; border-color:#e5e7eb; }
  .ct-pill.pending { background:#fffbeb; color:#92400e; border-color:#fcd34d; }

  /* Prevent text selection while dragging on rows */
  .ct-noselect { user-select:none; }
`}</style>
  );
}

export default function CustomTanStackTable() {
  const [data] = useState<Person[]>(() => makePeople(100));
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // drag-paint selection
  const isDraggingRef = useRef(false);
  const dragModeRef = useRef<"select" | "deselect" | null>(null);
  const lastClickedIndexRef = useRef<number | null>(null);

  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => {
          const all = table.getIsAllRowsSelected();
          const some = table.getIsSomeRowsSelected();
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={all}
                ref={(el) => {
                  if (el) (el as any).indeterminate = !all && some;
                }}
                onChange={table.getToggleAllRowsSelectedHandler()}
              />
              <span style={{ fontSize: 12, color: "#6b7280" }}>Chọn</span>
            </div>
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 72,
        minSize: 60,
        enableResizing: false,
      },
      { accessorKey: "id", header: "ID", size: 100, minSize: 80 },
      {
        accessorKey: "firstName",
        header: "First Name",
        size: 160,
        minSize: 120,
      },
      { accessorKey: "lastName", header: "Last Name", size: 160, minSize: 120 },
      {
        accessorKey: "age",
        header: "Age",
        size: 80,
        minSize: 70,
        cell: (info) => (
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {info.getValue<number>()}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 260,
        minSize: 200,
        cell: (info) => (
          <a href={`mailto:${info.getValue<string>()}`}>
            {info.getValue<string>()}
          </a>
        ),
      },
      { accessorKey: "city", header: "City", size: 160, minSize: 120 },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        minSize: 100,
        cell: (info) => <StatusPill value={info.getValue<Status>()} />,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.id,
    columnResizeMode: "onEnd", // update width when mouseup
    defaultColumn: { minSize: 80, size: 150, maxSize: 600 },
  });

  useEffect(() => {
    const onUp = () => {
      isDraggingRef.current = false;
      dragModeRef.current = null;
    };
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  const startDrag = (rowIndex: number, e?: React.MouseEvent) => {
    // Don't start drag from checkbox or resizer
    const target = e?.target as HTMLElement | undefined;
    if (
      target &&
      (target.closest('input[type="checkbox"]') ||
        target.closest(".ct-resizer"))
    )
      return;

    const row = table.getRowModel().rows[rowIndex];
    if (!row) return;
    const willSelect = !row.getIsSelected();
    dragModeRef.current = willSelect ? "select" : "deselect";
    isDraggingRef.current = true;
    row.toggleSelected(willSelect);
  };

  const handleEnter = (rowIndex: number) => {
    if (!isDraggingRef.current || !dragModeRef.current) return;
    const row = table.getRowModel().rows[rowIndex];
    if (!row) return;
    if (dragModeRef.current === "select" && !row.getIsSelected())
      row.toggleSelected(true);
    if (dragModeRef.current === "deselect" && row.getIsSelected())
      row.toggleSelected(false);
  };

  const handleRowClick = (rowIndex: number, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('input[type="checkbox"]') ||
      target.closest(".ct-resizer")
    )
      return;

    const row = table.getRowModel().rows[rowIndex];
    if (!row) return;
    if (e.shiftKey && lastClickedIndexRef.current != null) {
      const [a, b] = [lastClickedIndexRef.current, rowIndex].sort(
        (x, y) => x - y
      );
      for (let i = a; i <= b; i++)
        table.getRowModel().rows[i]?.toggleSelected(true);
    } else {
      row.toggleSelected(!row.getIsSelected());
      lastClickedIndexRef.current = rowIndex;
    }
  };

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="ct-container">
      <InlineStyles />

      <div className="ct-toolbar">
        <div className="ct-meta">
          <strong>{selectedCount}</strong> hàng đã chọn{" "}
          <span className="muted">
            • kéo chuột để bôi đen / Shift+Click để chọn theo dải
          </span>
        </div>
        <button
          className="ct-btn"
          onClick={() => table.toggleAllRowsSelected(false)}
        >
          Bỏ chọn tất cả
        </button>
      </div>

      <div className="ct-tablewrap">
        <div className="ct-scroll">
          <table className="ct-table">
            <colgroup>
              {table.getVisibleLeafColumns().map((col) => (
                <col key={col.id} style={{ width: col.getSize() }} />
              ))}
            </colgroup>

            <thead className="ct-thead">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted() as
                      | false
                      | "asc"
                      | "desc";
                    const thCls = "ct-th" + (canSort ? " sortable" : "");
                    return (
                      <th
                        key={header.id}
                        className={thCls}
                        onClick={
                          canSort
                            ? header.column.getToggleSortingHandler()
                            : undefined
                        }
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                            className="ct-noselect"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {canSort && (
                              <span style={{ color: "#9ca3af" }}>
                                {sorted === "asc"
                                  ? "▲"
                                  : sorted === "desc"
                                  ? "▼"
                                  : "↕"}
                              </span>
                            )}
                          </div>
                        )}
                        {header.column.columnDef.enableResizing !== false && (
                          <div
                            className={`ct-resizer${
                              header.column.getIsResizing() ? " active" : ""
                            }`}
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            title="Kéo để đổi độ rộng cột"
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody>
              {table.getRowModel().rows.map((row, idx) => {
                const selected = row.getIsSelected();
                return (
                  <tr
                    key={row.id}
                    className={`ct-tr${selected ? " selected" : ""}`}
                    onMouseDown={(e) => startDrag(idx, e)}
                    onMouseEnter={() => handleEnter(idx)}
                    onClick={(e) => handleRowClick(idx, e)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="ct-td">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
