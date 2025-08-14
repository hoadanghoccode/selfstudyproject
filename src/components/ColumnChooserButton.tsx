/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Button, Checkbox, Popover } from "antd";
import { ColumnHeightOutlined } from "@ant-design/icons";
import type { Column } from "./CustomTable";

type Props = {
  columns: Column[]; // danh sách TẤT CẢ cột (theo config)
  hiddenKeys: string[]; // các cột đang ẨN
  onChange: (nextHidden: string[]) => void;
  buttonText?: React.ReactNode; // mặc định: "Tùy chỉnh cột"
};

export default function ColumnChooserButton({
  columns,
  hiddenKeys,
  onChange,
  buttonText = "Tùy chỉnh cột",
}: Props) {
  // Hiển thị các cột đang BẬT trong Checkbox.Group
  const checked = columns
    .filter((c) => !hiddenKeys.includes(c.dataIndex))
    .map((c) => c.dataIndex);

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      content={
        <Checkbox.Group
          value={checked}
          onChange={(vals) => {
            const showing = new Set(vals as string[]);
            const nextHidden = columns
              .map((c) => c.dataIndex)
              .filter((k) => !showing.has(k));
            onChange(nextHidden);
          }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          options={columns.map((c) => ({
            label: c.title as any,
            value: c.dataIndex,
          }))}
        />
      }
    >
      <Button icon={<ColumnHeightOutlined />}>{buttonText}</Button>
    </Popover>
  );
}
