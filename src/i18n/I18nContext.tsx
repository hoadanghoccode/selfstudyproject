import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type LanguageCode = "vn" | "en";

type TranslationDict = Record<string, string>;

type Translations = Record<LanguageCode, TranslationDict>;

const translations: Translations = {
  vn: {
    "menu.accounts": "Tài khoản Zalo",
    "menu.version": "Phiên bản cài đặt",
    "menu.content": "Quản lý nội dung",
    "menu.messages": "Quản lý tin nhắn",
    "menu.sms": "Nhắn tin",
    "menu.sms.byFriends": "Theo bạn bè",
    "menu.sms.byPhone": "Theo số điện thoại",
    "menu.sms.byGroup": "Theo nhóm",
    "menu.sms.history": "Lịch sử nhắn tin",
    "menu.friend": "Kết bạn",
    "menu.friend.add": "Chức năng kết bạn",
    "menu.friend.status": "Trạng thái kết bạn",
    "menu.friend.history": "Lịch sử kết bạn",
    "menu.group": "Nhóm",
    "menu.group.interaction": "Tương tác nhóm",
    "menu.group.linkInteraction": "Tương tác với link nhóm",
    "menu.proxy": "Quản lý Proxy",
    "menu.proxy.static": "Quản lý Proxy tĩnh",
    "menu.proxy.dynamic": "Cấu hình Proxy động",
    "header.no_proxy": "Không đổi Proxy",
    "footer.copyright": "AntD Lab ©2025",
    "account.management.total": "Tổng số",
    "account.management.category": "Quản lý danh mục",
    "account.management.addAccount": "Thêm tài khoản",
    "account.management.exportData": "Xuất dữ liệu",
    "account.management.trash": "Thùng rác",
    "account.management.columnCustomization": "Tùy chỉnh cột",
    "account.management.closeBrowser": "Đóng trình duyệt",
    "account.management.add": "Thêm",
    "account.management.selected": "Đã chọn",
    "account.table.phone": "Số điện thoại",
    "account.table.password": "Mật khẩu",
    "account.table.avatar": "Avatar",
    "account.table.category": "Danh mục",
    "account.table.cookie": "Cookie",
    "account.table.birthday": "Ngày sinh",
    "account.table.fullName": "Họ và tên",
    "account.table.gender": "Giới tính",
    "account.table.proxy": "Proxy",
    "account.table.range":
      "Hiển thị {{from}} đến {{to}} trong {{count}} dữ liệu",
    "menu.sms.byGroupMembers": "Thành viên nhóm",
    "menu.sms.byTag": "Theo thẻ phân loại",
    "menu.friend.confirm": "Xác nhận kết bạn",
    "menu.friend.revokeInvitations": "Thu hồi lời mời kết bạn",
    "menu.group.findLink": "Tìm kiếm link nhóm zalo",
    "menu.group.join": "Tham gia nhóm",
    "menu.group.inviteFriends": "Mời bạn bè vào nhóm",
    "menu.group.leave": "Rời nhóm",
    "menu.friend.byPhone": "Theo số điện thoại",
    "menu.friend.byGroupMembers": "Thành viên nhóm",
  },
  en: {
    "menu.version": "Installation Version",
    "menu.content": "Content Management",
    "menu.messages": "Message Management",
    "menu.sms.history": "Message history",
    "menu.friend.add": "Add friends",
    "menu.friend.status": "Friend status",
    "menu.friend.history": "Friend history",
    "account.table.avatar": "Avatar",
    "menu.group.interaction": "Group interaction",
    "menu.group.linkInteraction": "Interact with group link",
    "menu.proxy": "Proxy management",
    "menu.proxy.static": "Static proxies",
    "menu.proxy.dynamic": "Dynamic proxy config",
    "header.no_proxy": "Do not change Proxy",
    "footer.copyright": "AntD Lab ©2025",
    "account.management.total": "Total",
    "account.management.category": "Category Management",
    "account.management.addAccount": "Add Account",
    "account.management.exportData": "Export Data",
    "account.management.trash": "Trash",
    "account.management.columnCustomization": "Column Customization",
    "account.management.closeBrowser": "Close Browser",
    "account.management.add": "Add",
    "account.management.selected": "Selected",
    "account.table.phone": "Phone number",
    "account.table.password": "Password",
    "account.table.category": "Category",
    "account.table.cookie": "Cookie",
    "account.table.birthday": "Birthday",
    "account.table.fullName": "Full name",
    "account.table.gender": "Gender",
    "account.table.proxy": "Proxy",
    "account.table.range": "Showing {{from}} to {{to}} of {{count}} records",
    "menu.accounts": "Zalo Accounts",
    "menu.sms": "Messaging",
    "menu.sms.byPhone": "By phone number",
    "menu.sms.byGroupMembers": "Group members",
    "menu.sms.byFriends": "By friends",
    "menu.sms.byGroup": "By group",
    "menu.sms.byTag": "By tag",

    "menu.friend": "Add friends",
    "menu.friend.byPhone": "By phone number",
    "menu.friend.byGroupMembers": "Group members",
    "menu.friend.confirm": "Confirm friend requests",
    "menu.friend.revokeInvitations": "Revoke invitations",

    "menu.group": "Groups",
    "menu.group.findLink": "Find Zalo group link",
    "menu.group.join": "Join group",
    "menu.group.inviteFriends": "Invite friends to group",
    "menu.group.leave": "Leave group",
  },
};

type I18nContextValue = {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, unknown>) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = "app.lang";

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    return saved ?? "vn";
  });

  const setLang = useCallback((next: LanguageCode) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  useEffect(() => {
    // Ensure storage consistency on mount
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const t = useCallback(
    (key: string, params?: Record<string, unknown>) => {
      const dict = translations[lang] || {};
      const template = dict[key] ?? translations.vn[key] ?? key;
      if (!params) return template;
      return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, p1: string) => {
        const v = params[p1];
        return v === undefined || v === null ? "" : String(v);
      });
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
};
