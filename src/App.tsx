import {
  AppstoreOutlined,
  BellOutlined,
  CloudServerOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Layout, Menu, Switch, theme, Typography } from "antd";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import DisplayPage from "./pages/DisplayPage";
import FeedbackPage from "./pages/FeedbackPage";
import NavigationPage from "./pages/NavigationPage";
// import TableCrudPage from "./pages/TableCrudPage";
import { useState } from "react";
import "./App.css";
import Language from "./components/Language";
import SocialPill from "./components/SocialPill";
import VersionCard from "./components/VersionCard";
import AccountsPage from "./pages/AccountPage";
import WizardPage from "./pages/WizardPage";
import { useI18n } from "./i18n/I18nContext";

const { Header, Sider, Content, Footer } = Layout;

// Removed unused sideItems; menu is built with i18n dynamically below

function Shell() {
  const { t, lang, setLang } = useI18n();
  const { token } = theme.useToken();
  const location = useLocation();
  const selectedKey = location.pathname || "/";
  const [collapsed, setCollapsed] = useState(false);
  const onChange = (checked: boolean) => {
    console.log(`switch to ${checked}`);
  };

  return (
    <Layout hasSider style={{ minHeight: "100vh" }}>
      <Sider
        width={260}
        collapsible
        collapsed={collapsed}
        trigger={null}
        theme="light"
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              padding: 16,
              fontWeight: 700,
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: token.colorPrimary,
            }}
          >
            {!collapsed ? "MKT ZALO" : "MKT"}
          </div>

          <Menu
            className="sider-menu"
            theme="light"
            mode="inline"
            items={[
              {
                key: "/",
                icon: <HomeOutlined />,
                label: <Link to="/table">{t("menu.accounts")}</Link>,
              },
              {
                key: "content",
                icon: <AppstoreOutlined />,
                label: t("menu.content"),
                children: [
                  {
                    key: "/content/messages",
                    label: <Link to="/content/messages">{t("menu.messages")}</Link>,
                    disabled: true,
                  },
                ],
              },
              {
                key: "sms",
                icon: <MessageOutlined />,
                label: t("menu.sms"),
                children: [
                  { key: "/sms/by-friends", label: <Link to="/sms/by-friends">{t("menu.sms.byFriends")}</Link> },
                  { key: "/sms/by-phone", label: <Link to="/sms/by-phone">{t("menu.sms.byPhone")}</Link> },
                  { key: "/sms/by-group", label: <Link to="/sms/by-group">{t("menu.sms.byGroup")}</Link> },
                  { key: "/sms/history", label: <Link to="/sms/history">{t("menu.sms.history")}</Link> },
                ],
              },
              {
                key: "friend",
                icon: <UserAddOutlined />,
                label: t("menu.friend"),
                children: [
                  { key: "/friend/add", label: <Link to="/friend/add">{t("menu.friend.add")}</Link> },
                  { key: "/friend/status", label: <Link to="/friend/status">{t("menu.friend.status")}</Link> },
                  { key: "/friend/history", label: <Link to="/friend/history">{t("menu.friend.history")}</Link> },
                ],
              },
              {
                key: "group",
                icon: <TeamOutlined />,
                label: t("menu.group"),
                children: [
                  { key: "/group/interaction", label: <Link to="/group/interaction">{t("menu.group.interaction")}</Link> },
                  { key: "/group/link-interaction", label: <Link to="/group/link-interaction">{t("menu.group.linkInteraction")}</Link> },
                ],
              },
              {
                key: "proxy",
                icon: <CloudServerOutlined />,
                label: t("menu.proxy"),
                children: [
                  { key: "/proxy/static", label: <Link to="/proxy/static">{t("menu.proxy.static")}</Link> },
                  { key: "/proxy/dynamic", label: <Link to="/proxy/dynamic">{t("menu.proxy.dynamic")}</Link> },
                ],
              },
            ]}
            selectedKeys={[selectedKey]}
            defaultOpenKeys={["content", "sms", "friend", "group", "proxy"]}
            style={{ borderRight: 0 }}
          />

          <div style={{ flex: 1 }} />

          {!collapsed && (
            <>
              <div
                style={{
                  padding: 16,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <SocialPill
                  onChat={() => console.log("Open chatbot")}
                  onZalo={() => window.open("https://zalo.me/", "_blank")}
                  onFacebook={() =>
                    window.open("https://facebook.com/", "_blank")
                  }
                  onWebsite={() =>
                    window.open("https://your-site.com", "_blank")
                  }
                />
              </div>

              <div
                style={{
                  position: "sticky",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  zIndex: 1,
                  background: "#fff",
                  padding: "0 16px 16px 16px",
                }}
              >
                <VersionCard />
              </div>
            </>
          )}
        </div>
      </Sider>

      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((v) => !v)}
          />
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div>{t("header.no_proxy")}</div>
            <Switch
              defaultChecked
              onChange={onChange}
              style={{ transform: "scale(0.8)" }}
            />
            <Language value={lang} onChange={setLang as (v: any) => void} />
            <Button type="text" icon={<BellOutlined />} />
            <Button type="text" icon={<PlayCircleOutlined />} />
            <Button type="text" icon={<SettingOutlined />} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 8px",
                borderRadius: 16,
                background: "#fff",
              }}
            >
              <Avatar size={28} icon={<UserOutlined />} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  maxWidth: 180,
                }}
              >
                <Typography.Text
                  strong
                  style={{
                    lineHeight: 1,
                    maxWidth: 140,
                    display: "inline-block",
                  }}
                  ellipsis
                >
                  Nguyễn Đăng Hòa
                </Typography.Text>
                <Typography.Text
                  type="secondary"
                  style={{
                    lineHeight: 1,
                    maxWidth: 140,
                    display: "inline-block",
                  }}
                  ellipsis={{ tooltip: true }}
                >
                  hoaace2003@gmail.com
                </Typography.Text>
              </div>
            </div>
          </div>
        </Header>

        <Content
          style={{
            margin: 16,
            background: token.colorBgContainer,
            padding: 16,
            borderRadius: 12,
            minHeight: "calc(100vh - 112px)",
          }}
        >
          <Routes>
            <Route path="/" element={<AccountsPage />} />
            <Route path="/table" element={<AccountsPage />} />
            <Route path="/wizard" element={<WizardPage />} />
            <Route path="/display" element={<DisplayPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/navigation" element={<NavigationPage />} />
          </Routes>
        </Content>

        <Footer style={{ textAlign: "center" }}>{t("footer.copyright")}</Footer>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
