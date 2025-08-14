import { message, notification } from "antd";
export const toast = {
  ok: (txt: string) => message.success(txt),
  err: (txt: string) => message.error(txt),
  info: (txt: string) => message.info(txt),
};
export const noti = (msg: string, desc?: string) =>
  notification.open({ message: msg, description: desc });
