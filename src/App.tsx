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
import {
  Avatar,
  Button,
  Layout,
  Menu,
  Switch,
  theme,
  Typography,
  type MenuProps,
} from "antd";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import DisplayPage from "./pages/DisplayPage";
import FeedbackPage from "./pages/FeedbackPage";
import FormsPage from "./pages/FormsPage";
import NavigationPage from "./pages/NavigationPage";
// import TableCrudPage from "./pages/TableCrudPage";
import { useState } from "react";
import "./App.css";
import Language from "./components/Language";
import SocialPill from "./components/SocialPill";
import VersionCard from "./components/VersionCard";
import AccountsPage from "./pages/AccountPage";
import WizardPage from "./pages/WizardPage";

const { Header, Sider, Content, Footer } = Layout;

const sideItems: MenuProps["items"] = [
  {
    key: "/",
    icon: <HomeOutlined />,
    label: <Link to="/table">Quản lý tài khoản</Link>,
  },

  {
    key: "content",
    icon: <AppstoreOutlined />,
    label: "Quản lý nội dung",
    children: [
      {
        key: "/content/messages",
        label: <Link to="/content/messages">Quản lý tin nhắn</Link>,
        disabled: true,
      },
    ],
  },

  {
    key: "sms",
    icon: <MessageOutlined />,
    label: "Chức năng nhắn tin",
    children: [
      {
        key: "/sms/by-friends",
        label: <Link to="/sms/by-friends">Theo bạn bè</Link>,
      },
      {
        key: "/sms/by-phone",
        label: <Link to="/sms/by-phone">Theo số điện thoại</Link>,
      },
      {
        key: "/sms/by-group",
        label: <Link to="/sms/by-group">Theo nhóm</Link>,
      },
      {
        key: "/sms/history",
        label: <Link to="/sms/history">Lịch sử nhắn tin</Link>,
      },
    ],
  },

  {
    key: "friend",
    icon: <UserAddOutlined />,
    label: "Chức năng kết bạn",
    children: [
      {
        key: "/friend/add",
        label: <Link to="/friend/add">Chức năng kết bạn</Link>,
      },
      {
        key: "/friend/status",
        label: <Link to="/friend/status">Trạng thái kết bạn</Link>,
      },
      {
        key: "/friend/history",
        label: <Link to="/friend/history">Lịch sử kết bạn</Link>,
      },
    ],
  },

  {
    key: "group",
    icon: <TeamOutlined />,
    label: "Chức năng nhóm",
    children: [
      {
        key: "/group/interaction",
        label: <Link to="/group/interaction">Tương tác nhóm</Link>,
      },
      {
        key: "/group/link-interaction",
        label: (
          <Link to="/group/link-interaction">Tương tác với link nhóm</Link>
        ),
      },
    ],
  },

  {
    key: "proxy",
    icon: <CloudServerOutlined />,
    label: "Quản lý Proxy",
    children: [
      {
        key: "/proxy/static",
        label: <Link to="/proxy/static">Quản lý Proxy tĩnh</Link>,
      },
      {
        key: "/proxy/dynamic",
        label: <Link to="/proxy/dynamic">Cấu hình Proxy động</Link>,
      },
    ],
  },
];

function Shell() {
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
            items={sideItems}
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
            <div>Không đổi Proxy</div>
            <Switch
              defaultChecked
              onChange={onChange}
              style={{ transform: "scale(0.8)" }}
            />
            <Language
              value="vn"
              onChange={(lang) => {
                console.log("Change language ->", lang);
                // Nếu dùng i18next thuần:
                // i18n.changeLanguage(lang);
              }}
            />
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

        <Footer style={{ textAlign: "center" }}>AntD Lab ©2025</Footer>
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
