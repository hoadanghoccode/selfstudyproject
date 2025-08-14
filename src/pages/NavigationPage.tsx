import { Breadcrumb, Pagination, Anchor, Affix } from "antd";

export default function NavigationPage() {
  return (
    <>
      <Breadcrumb items={[{ title: "Home" }, { title: "Navigation" }]} />
      <div style={{ height: 16 }} />
      <Pagination total={120} showQuickJumper showSizeChanger />
      <div style={{ height: 24 }} />
      <Affix offsetTop={80}>
        <Anchor
          items={[
            { key: "1", href: "#sec1", title: "Section 1" },
            { key: "2", href: "#sec2", title: "Section 2" },
          ]}
        />
      </Affix>
      <div id="sec1" style={{ height: 400 }} />
      <div id="sec2" style={{ height: 400 }} />
    </>
  );
}
