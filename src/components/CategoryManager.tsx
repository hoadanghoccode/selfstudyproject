import { PlusOutlined } from "@ant-design/icons";
import { Button, Checkbox, Select, Space, Typography } from "antd";

type Category = { key: string; name: string };

function CategoryManager({
  categories,
  checkedKeys,
  setCheckedKeys,
  onAdd,
  t,
}: {
  categories: Category[];
  checkedKeys: string[];
  setCheckedKeys: (next: string[]) => void;
  onAdd: () => void;
  onEdit: (cat?: Category) => void; // optional: mở màn hình quản lý
  onDelete: (cat?: Category) => void; // optional
  t: (k: string) => string;
}) {
  const allKeys = categories.map((c) => c.key);
  const isAllChecked =
    checkedKeys.length === allKeys.length && allKeys.length > 0;
  const isIndeterminate =
    checkedKeys.length > 0 && checkedKeys.length < allKeys.length;

  const options = categories.map((c) => ({
    value: c.key,
    label: c.name, // dùng label string để tag hiển thị gọn
  }));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Select
        mode="multiple"
        allowClear
        showSearch
        placeholder="Chọn danh mục"
        value={checkedKeys}
        onChange={(vals) => setCheckedKeys(vals as string[])}
        options={options}
        optionFilterProp="label"
        style={{ width: 300 }}
        maxTagCount="responsive"
        // Header + Footer custom trong dropdown
        dropdownRender={(menu) => (
          <div>
            {/* Header: Chọn tất cả + đếm */}
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <Checkbox
                  checked={isAllChecked}
                  indeterminate={isIndeterminate}
                  onChange={(e) => {
                    const c = e.target.checked;
                    setCheckedKeys(c ? allKeys : []);
                  }}
                >
                  Tất cả
                </Checkbox>
                <Typography.Text type="secondary">
                  {checkedKeys.length}/{allKeys.length} đã chọn
                </Typography.Text>
              </Space>
            </div>

            {/* Menu mặc định của Select */}
            <div>{menu}</div>
          </div>
        )}
      />
      <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
        {t("account.management.add")}
      </Button>
    </div>
  );
}

export default CategoryManager;
