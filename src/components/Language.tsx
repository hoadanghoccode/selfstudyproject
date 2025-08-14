import type { MenuProps } from "antd";
import { Avatar, Button, Dropdown, Space, Typography } from "antd";
import React, { useMemo } from "react";
// Nếu bạn dùng Redux + i18next, mở comment 4 dòng dưới
// import { useDispatch, useSelector } from 'react-redux';
// import { AppState } from 'src/store/Store';
// import { setLanguage } from 'src/store/customizer/CustomizerSlice';
// import { useTranslation } from 'react-i18next';

import FlagEn from "../assets/images/flag/icon-flag-en.svg";
import FlagVn from "../assets/images/flag/vn.png";

type LangValue = "en" | "ch" | "fr" | "ar" | "vn";

const Languages: Array<{ flagname: string; icon: string; value: LangValue }> = [
  { flagname: "VietNam (VN)", icon: FlagVn, value: "vn" },
  { flagname: "English (UK)", icon: FlagEn, value: "en" },
];

interface Props {
  // Nếu KHÔNG dùng Redux, truyền props dưới để control từ ngoài
  value?: LangValue;
  onChange?: (lang: LangValue) => void;
}

const Language: React.FC<Props> = ({ value, onChange }) => {
  // ===== Nếu dùng Redux + i18next, dùng các dòng dưới thay vì props =====
  // const dispatch = useDispatch();
  // const customizer = useSelector((state: AppState) => state.customizer);
  // const { i18n } = useTranslation();
  // const current = Languages.find(l => l.value === customizer.isLanguage) ?? Languages[0];

  const current = Languages.find((l) => l.value === value) ?? Languages[0];

  const items: MenuProps["items"] = useMemo(
    () =>
      Languages.map((opt) => ({
        key: opt.value,
        label: (
          <Space align="center">
            <Avatar src={opt.icon} size={20} />
            <Typography.Text>{opt.flagname}</Typography.Text>
          </Space>
        ),
      })),
    []
  );

  const handleClick: MenuProps["onClick"] = ({ key }) => {
    const lang = key as LangValue;

    // Nếu dùng Redux:
    // dispatch(setLanguage(lang));
    // i18n.changeLanguage(lang);

    // Nếu dùng props:
    onChange?.(lang);
  };

  // Nếu dùng Redux + i18next, sync khi language trong store đổi:
  // useEffect(() => {
  //   i18n.changeLanguage(customizer.isLanguage);
  // }, [customizer.isLanguage, i18n]);

  return (
    <Dropdown
      menu={{ items, onClick: handleClick, selectedKeys: [current.value] }}
      placement="bottomRight"
      trigger={["click"]}
    >
      <Button
        type="text"
        icon={<Avatar src={current.icon} size={18} />}
        aria-label="language"
      />
    </Dropdown>
  );
};

export default Language;
