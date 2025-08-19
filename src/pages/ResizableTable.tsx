import React, { useState } from "react";
import { Table } from "antd";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";

const ResizableTitle = (props: any) => {
  const { onResize, width, ...restProps } = props;

  if (!width) {
    return <th {...restProps} />;
  }

  return (
    <Resizable
      width={width}
      height={0}
      handle={
        <span
          className="react-resizable-handle"
          onClick={(e) => e.stopPropagation()}
        />
      }
      onResize={onResize}
      draggableOpts={{ enableUserSelectHack: false }}
    >
      <th {...restProps} />
    </Resizable>
  );
};

const App: React.FC = () => {
  const [columns, setColumns] = useState([
    {
      title: "Name",
      dataIndex: "name",
      width: 200,
    },
    {
      title: "Age",
      dataIndex: "age",
      width: 100,
    },
    {
      title: "Address",
      dataIndex: "address",
      width: 200,
    },
  ]);

  const components = {
    header: {
      cell: ResizableTitle,
    },
  };

  const handleResize =
    (index: number) =>
    (_e: any, { size }: { size: { width: number } }) => {
      const nextColumns = [...columns];
      nextColumns[index] = {
        ...nextColumns[index],
        width: size.width,
      };
      setColumns(nextColumns);
    };

  const cols = columns.map((col, index) => ({
    ...col,
    onHeaderCell: (column: any) => ({
      width: column.width,
      onResize: handleResize(index),
    }),
  }));

  const data = Array.from({ length: 100 }).map((_, i) => ({
    key: i,
    name: `Edward ${i}`,
    age: 32,
    address: `London Park no. ${i}`,
  }));

  return (
    <Table
      bordered
      tableLayout="fixed"
      components={components}
      columns={cols}
      dataSource={data}
      pagination={false}
    />
  );
};

export default App;
