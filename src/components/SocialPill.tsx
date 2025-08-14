import React from "react";
import { Tooltip, Button } from "antd";
import {
  MessageOutlined,
  FacebookFilled,
  GlobalOutlined,
} from "@ant-design/icons";
import ZaloIcon from "../assets/images/flag/zalo.jpg";
import "../App.css";

interface Props {
  className?: string;
  onChat: () => void;
  onZalo: () => void;
  onFacebook: () => void;
  onWebsite: () => void;
}

const SocialPill: React.FC<Props> = ({
  className,
  onChat,
  onZalo,
  onFacebook,
  onWebsite,
}) => {
  return (
    <div className={`social-pill ${className ?? ""}`}>
      <Tooltip title="Chatbot">
        <Button
          shape="circle"
          className="pill-btn ring"
          onClick={onChat}
          icon={<MessageOutlined />}
        />
      </Tooltip>

      <Tooltip title="Zalo">
        <Button shape="circle" className="pill-btn" onClick={onZalo}>
          {/* Nếu chưa có file SVG, tạm hiển thị chữ ZL */}
          {ZaloIcon ? <img src={ZaloIcon} alt="Zalo" /> : "ZL"}
        </Button>
      </Tooltip>

      <Tooltip title="Facebook">
        <Button
          shape="circle"
          className="pill-btn"
          onClick={onFacebook}
          icon={<FacebookFilled />}
        />
      </Tooltip>

      <Tooltip title="Website">
        <Button
          shape="circle"
          className="pill-btn"
          onClick={onWebsite}
          icon={<GlobalOutlined />}
        />
      </Tooltip>
    </div>
  );
};

export default SocialPill;
