import {
  Card,
  List,
  Descriptions,
  Statistic,
  Timeline,
  Collapse,
  Tabs,
  Badge,
} from "antd";

export default function DisplayPage() {
  return (
    <>
      <Card title="Cards + List" style={{ marginBottom: 16 }}>
        <List
          dataSource={["React", "AntD", "TypeScript"]}
          renderItem={(i) => (
            <List.Item>
              <Badge status="processing" text={i} />
            </List.Item>
          )}
        />
      </Card>

      <Card title="Descriptions + Statistic" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="User">Nguyễn Văn A</Descriptions.Item>
          <Descriptions.Item label="Plan">Pro</Descriptions.Item>
          <Descriptions.Item label="Usage">
            <Statistic value={76.2} suffix="%" precision={1} />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs
        items={[
          {
            key: "1",
            label: "Timeline",
            children: (
              <Timeline
                items={[
                  { children: "Tạo tài khoản" },
                  { children: "Nâng cấp Pro" },
                  { children: "Gia hạn năm 2025" },
                ]}
              />
            ),
          },
          {
            key: "2",
            label: "Collapse",
            children: (
              <Collapse
                items={[
                  { key: "a", label: "Chi tiết", children: "Nội dung..." },
                ]}
              />
            ),
          },
        ]}
      />
    </>
  );
}
