import { Table } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Resizable } from "react-resizable";

const MIN_COL_WIDTH = 80;
const MAX_COL_WIDTH = 600;
const DEFAULT_COL_WIDTH = 160;

// Header cell có tay nắm kéo để resize
const ResizableHeaderCell = (props: any) => {
  const { onResize, width, children, ...restProps } = props;

  if (!width) {
    return <th {...restProps}>{children}</th>;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => e.stopPropagation()} // tránh trigger sort khi bấm vào tay nắm
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 10,
            cursor: "col-resize",
            zIndex: 1,
          }}
        />
      }
      draggableOpts={{ enableUserSelectHack: false }}
      onResize={onResize}
      minConstraints={[MIN_COL_WIDTH, 0]}
      maxConstraints={[MAX_COL_WIDTH, 0]}
    >
      <th {...restProps} style={{ position: "relative", padding: 0 }}>
        <div
          style={{
            width,
            padding: "8px 16px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {children}
        </div>
      </th>
    </Resizable>
  );
};

// Component chính
interface ResizableSortableTableProps {
  columns?: any[];
  dataSource?: any[];
  rowKey?: string;
  [key: string]: any;
}

export default function ResizableSortableTable({
  columns: columnsProp,
  dataSource: dataProp,
  rowKey = "key",
  ...tableProps
}: ResizableSortableTableProps) {
  // Cột mẫu (nếu không truyền từ props)
  const defaultColumns = useMemo(
    () => [
      {
        title: "Họ tên",
        dataIndex: "name",
        key: "name",
        width: 220,
        sorter: (a: any, b: any) => a.name.localeCompare(b.name, "vi"),
        sortDirections: ["ascend", "descend"],
        ellipsis: true,
      },
      {
        title: "Tuổi",
        dataIndex: "age",
        key: "age",
        width: 120,
        sorter: (a: any, b: any) => a.age - b.age,
        defaultSortOrder: "descend",
        sortDirections: ["descend", "ascend"],
        align: "right",
      },
      {
        title: "Địa chỉ",
        dataIndex: "address",
        key: "address",
        width: 100,
        sorter: {
          compare: (a: any, b: any) => a.address.localeCompare(b.address, "vi"),
          multiple: 2,
        },
        sortDirections: ["ascend", "descend"],
        ellipsis: true,
      },
      {
        title: "Điểm",
        dataIndex: "score",
        key: "score",
        width: 120,
        sorter: { compare: (a: any, b: any) => a.score - b.score, multiple: 1 },
        sortDirections: ["descend", "ascend"],
        align: "right",
      },
    ],
    []
  );

  const defaultData = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        key: i + 1,
        name: `Người dùng ${i + 1}`,
        age: 18 + ((i * 7) % 43),
        address: `Quận ${((i % 5) + 1).toString().padStart(2, "0")}, TP. HCM`,
        score: Math.round(50 + 50 * Math.sin(i)),
      })),
    []
  );

  // Chuẩn hoá cột ban đầu (bổ sung width mặc định nếu thiếu)
  const initialColumns = useMemo(() => {
    const cols = (columnsProp ?? defaultColumns).map((c: any) => ({
      width: c.width ?? DEFAULT_COL_WIDTH,
      ...c,
    }));
    return cols;
  }, [columnsProp, defaultColumns]);

  const [columns, setColumns] = useState(initialColumns);

  // Khi props.columns thay đổi thì reset state cột
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Xử lý resize theo index cột
  const handleResize =
    (index: number) =>
    (_e: any, { size }: { size: { width: number; height: number } }) => {
      setColumns((prev: any[]) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          width: Math.max(size.width, MIN_COL_WIDTH),
        };
        return next;
      });
    };

  // Gắn onHeaderCell để kích hoạt Resizable cho từng cột
  const resizableColumns = useMemo(
    () =>
      columns.map((col: any, index: number) => ({
        ...col,
        onHeaderCell: (column: any) => ({
          width: column.width,
          onResize: handleResize(index),
        }),
      })),
    [columns]
  );

  const dataSource = useMemo(
    () => dataProp ?? defaultData,
    [dataProp, defaultData]
  );

  // Lắng nghe thay đổi sort/paginate/filter (tuỳ chọn)
  const onChange = (pagination: any, filters: any, sorter: any, extra: any) => {
    console.log(pagination, filters, sorter, extra);
    // Bạn có thể bắt sự kiện ở đây để lưu trạng thái sort hoặc gửi query lên server
    // console.log({ pagination, filters, sorter, extra });
  };

  return (
    <div className="w-full">
      <Table
        components={{ header: { cell: ResizableHeaderCell } }}
        columns={resizableColumns}
        dataSource={dataSource}
        rowKey={rowKey}
        size="middle"
        bordered
        onChange={onChange}
        // Cho phép kéo ngang nếu tổng width > viewport
        scroll={{ x: "max-content" }}
        pagination={{ pageSize: 8 }}
        {...tableProps}
      />
    </div>
  );
}
