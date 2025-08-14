import { message, notification } from "antd";
export const toast = {
  ok: (txt: string) => message.success(txt),
  err: (txt: string) => message.error(txt),
  info: (txt: string) => message.info(txt),
};
export const noti = (msg: string, desc?: string) =>
  notification.open({ message: msg, description: desc });

export function showNotification(statusCode: number, message?: string) {
  if (statusCode === 200 || statusCode === 201) {
    notification.success({
      message: message || "Thành công",
      placement: "topRight",
    });
  } else {
    notification.error({
      message: message || "Thất bại",
      placement: "topRight",
    });
  }
}
