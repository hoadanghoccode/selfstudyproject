import React from "react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";

type Row = { key: number; [k: string]: any };

const COLS = Array.from({ length: 12 }, (_, i) => `c${i + 1}`); // c1..c12

export default function TableNoLag() {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const ghostRef = React.useRef<HTMLDivElement>(null);

  // 1) Khởi tạo width qua CSS variables (DOM-only)
  React.useLayoutEffect(() => {
    const el = wrapRef.current!;
    COLS.forEach((k, i) => {
      el.style.setProperty(`--w-${k}`, `${i === 0 ? 200 : 140}px`);
    });
  }, []);

  // 2) Data mẫu 100 dòng
  const data = React.useMemo<Row[]>(
    () =>
      Array.from({ length: 100 }, (_, r) => {
        const row: Row = { key: r };
        for (const k of COLS) row[k] = `Row ${r} - ${k} - nội dung dài dài...`;
        return row;
      }),
    []
  );

  // 3) Columns: dùng CSS var cho width, thêm handle để kéo
  const columns = React.useMemo<ColumnsType<Row>>(
    () =>
      COLS.map((k, idx) => ({
        title: (
          <div className="th-inner">
            Col {idx + 1}
            <span className="col-handle" data-col={k} />
          </div>
        ),
        dataIndex: k,
        ellipsis: true,
        // Không dùng prop width (tránh AntD can thiệp), set width bằng style
        onHeaderCell: () => ({
          "data-col": k,
          style: { position: "relative", width: `var(--w-${k})` },
        }),
        onCell: () => ({
          "data-col": k,
          style: { width: `var(--w-${k})` },
        }),
        shouldCellUpdate: () => false, // tối ưu khi chỉ đổi độ rộng
      })),
    []
  );

  // 4) Kéo bằng event delegation (DOM-only)
  React.useEffect(() => {
    const wrap = wrapRef.current!;
    const ghost = ghostRef.current!;

    let activeKey: string | null = null;
    let startX = 0;
    let startW = 0;

    const moveGhost = (x: number) => {
      ghost.style.transform = `translateX(${x}px)`;
    };

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (!t.classList.contains("col-handle")) return;

      activeKey = t.dataset.col!;
      if (!activeKey) return;

      const th = wrap.querySelector(
        `th[data-col="${activeKey}"]`
      ) as HTMLTableCellElement;
      const tableRect = wrap.getBoundingClientRect();
      const thRect = th.getBoundingClientRect();

      startX = e.clientX;
      startW = thRect.width;

      ghost.style.display = "block";
      moveGhost(thRect.right - tableRect.left);
      document.body.classList.add("resizing-col");

      // capture pointer để kéo mượt
      (t as any).setPointerCapture?.((e as any).pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!activeKey) return;
      const delta = e.clientX - startX;
      const newW = Math.max(60, startW + delta);

      // Cập nhật biến CSS => trình duyệt reflow, không re-render React
      wrap.style.setProperty(`--w-${activeKey}`, `${Math.round(newW)}px`);

      // Di chuyển ghost
      const th = wrap.querySelector(
        `th[data-col="${activeKey}"]`
      ) as HTMLTableCellElement;
      const tableRect = wrap.getBoundingClientRect();
      const thRect = th.getBoundingClientRect();
      moveGhost(thRect.left - tableRect.left + newW);
    };

    const onPointerUp = () => {
      if (!activeKey) return;
      ghost.style.display = "none";
      document.body.classList.remove("resizing-col");
      activeKey = null;
    };

    wrap.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      wrap.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="no-lag-resize-wrap"
      style={{ position: "relative" }}
    >
      <Table
        tableLayout="fixed" // rất quan trọng
        pagination={false}
        rowKey="key"
        columns={columns}
        dataSource={data}
      />
      <div ref={ghostRef} className="col-resize-ghost" />
    </div>
  );
}
