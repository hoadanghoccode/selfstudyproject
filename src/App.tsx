import {
  AppstoreOutlined,
  BellOutlined,
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
import { BrowserRouter, Link, useLocation } from "react-router-dom";
// import TableCrudPage from "./pages/TableCrudPage";
import { useState } from "react";
import "./App.css";
import Language from "./components/Language";
import SocialPill from "./components/SocialPill";
import VersionCard from "./components/VersionCard";
import { useI18n } from "./i18n/I18nContext";
import AppRouter from "./router/AppRouter";

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
            selectedKeys={[selectedKey]}
            defaultOpenKeys={["sms", "friend", "group"]}
            // openKeys={openKeys}
            items={[
              {
                key: "/",
                icon: <AppstoreOutlined />,
                // theo ảnh: tiêu đề "Tài khoản Zalo"
                label: <Link to="/">{t("menu.accounts")}</Link>,
              },

              // ========== NHẮN TIN ==========
              {
                key: "sms",
                icon: <MessageOutlined />,
                label: t("menu.sms"),
                children: [
                  {
                    key: "/sms/by-phone",
                    label: (
                      <Link to="/sms/by-phone">{t("menu.sms.byPhone")}</Link>
                    ),
                  },
                  {
                    key: "/sms/by-group-members",
                    label: (
                      <Link to="/sms/by-group-members">
                        {t("menu.sms.byGroupMembers")}
                      </Link>
                    ),
                  },
                  {
                    key: "/sms/by-friends",
                    label: (
                      <Link to="/sms/by-friends">
                        {t("menu.sms.byFriends")}
                      </Link>
                    ),
                  },
                  {
                    key: "/sms/by-group",
                    label: (
                      <Link to="/sms/by-group">{t("menu.sms.byGroup")}</Link>
                    ),
                  },
                  {
                    key: "/sms/by-tag",
                    label: <Link to="/sms/by-tag">{t("menu.sms.byTag")}</Link>,
                  },
                ],
              },

              // ========== KẾT BẠN ==========
              {
                key: "friend",
                icon: <UserAddOutlined />,
                label: t("menu.friend"),
                children: [
                  {
                    key: "/friend/by-phone",
                    label: (
                      <Link to="/friend/by-phone">
                        {t("menu.friend.byPhone")}
                      </Link>
                    ),
                  },
                  {
                    key: "/friend/by-group-members",
                    label: (
                      <Link to="/friend/by-group-members">
                        {t("menu.friend.byGroupMembers")}
                      </Link>
                    ),
                  },
                  {
                    key: "/friend/confirm",
                    label: (
                      <Link to="/friend/confirm">
                        {t("menu.friend.confirm")}
                      </Link>
                    ),
                  },
                  {
                    key: "/friend/revoke-invitations",
                    label: (
                      <Link to="/friend/revoke-invitations">
                        {t("menu.friend.revokeInvitations")}
                      </Link>
                    ),
                  },
                ],
              },

              // ========== NHÓM ==========
              {
                key: "group",
                icon: <TeamOutlined />,
                label: t("menu.group"),
                children: [
                  {
                    key: "/group/find-link",
                    label: (
                      <Link to="/group/find-link">
                        {t("menu.group.findLink")}
                      </Link>
                    ),
                  },
                  {
                    key: "/group/join",
                    label: <Link to="/group/join">{t("menu.group.join")}</Link>,
                  },
                  {
                    key: "/group/invite-friends",
                    label: (
                      <Link to="/group/invite-friends">
                        {t("menu.group.inviteFriends")}
                      </Link>
                    ),
                  },
                  {
                    key: "/group/leave",
                    label: (
                      <Link to="/group/leave">{t("menu.group.leave")}</Link>
                    ),
                  },
                ],
              },
            ]}
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
          <AppRouter />
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
