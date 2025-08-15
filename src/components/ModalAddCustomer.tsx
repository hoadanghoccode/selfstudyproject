import React, { useMemo, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Row,
  Col,
  Typography,
  Divider,
  Select,
  Space,
  message,
} from "antd";
import { Formik } from "formik";
import * as Yup from "yup";
import QrModal from "./QrModal";
import AccountModal from "./AccountModal";
import AccountGpmModal from "./AccountGpmModal";

const { Title, Text } = Typography;

type FormatField =
  | "Phone"
  | "Password"
  | "Proxy"
  | "Cookie"
  | "Imei"
  | "Useragent"
  | "Empty";

export interface ParsedAccount {
  phone?: string;
  password?: string;
  proxy?: string;
  cookie?: string;
  imei?: string;
  useragent?: string;
}

interface ImportAccountsModalProps {
  open: boolean;
  onClose: () => void;
  onPickGemLogin?: () => void;
  onPickGpmLogin?: () => void;
  onGenerateQR?: (proxy?: string) => void;
  onImportAccounts?: (rows: ParsedAccount[]) => void;
  loading?: boolean;
}

/** Regex kiểm tra proxy: ip:port hoặc ip:port:user:pass */
const ipPart = "(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const reProxy = new RegExp(
  `^(?:${ipPart}\\.${ipPart}\\.${ipPart}\\.${ipPart}):(\\d{1,5})(?::([^:|\\s]+):([^:|\\s]+))?$`
);

/** Yup schema — list dùng context để biết định dạng đang chọn */
const buildSchema = () =>
  Yup.object({
    proxy: Yup.string()
      .trim()
      .nullable()
      .test(
        "proxy-format",
        "Proxy không hợp lệ (ip:port hoặc ip:port:user:pass)",
        (v) => !v || reProxy.test(v)
      ),
    list: Yup.string()
      .trim()
      .required("Vui lòng nhập danh sách tài khoản")
      .test(
        "format-match",
        "Một hoặc nhiều dòng không khớp định dạng đã chọn",
        function (value) {
          const ctx = this.options.context as
            | { format: FormatField[] }
            | undefined;
          const format = (ctx?.format || []).filter((f) => f !== "Empty");
          if (!value) return true;

          const lines = value
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);

          for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].split("|");

            // số cột phải >= số trường yêu cầu
            if (parts.length < format.length) {
              return this.createError({
                path: "list",
                message: `Dòng ${
                  i + 1
                }: thiếu trường, đúng định dạng là ${format.join("|")}`,
              });
            }

            for (let col = 0; col < format.length; col++) {
              const field = format[col];
              const val = (parts[col] ?? "").trim();

              if (!val) {
                return this.createError({
                  path: "list",
                  message: `Dòng ${i + 1}: thiếu giá trị cho trường ${field}`,
                });
              }

              if (field === "Proxy") {
                if (!reProxy.test(val)) {
                  return this.createError({
                    path: "list",
                    message: `Dòng ${i + 1}: proxy không hợp lệ`,
                  });
                }
                const port = Number(val.split(":")[1]);
                if (!(port >= 1 && port <= 65535)) {
                  return this.createError({
                    path: "list",
                    message: `Dòng ${i + 1}: port proxy không hợp lệ`,
                  });
                }
              }
            }
          }
          return true;
        }
      ),
  });

const DEFAULT_FORMAT: FormatField[] = [
  "Phone",
  "Password",
  "Proxy",
  "Cookie",
  "Imei",
  "Useragent",
];

const fieldOptions = [
  { value: "Phone", label: "Phone" },
  { value: "Password", label: "Password" },
  { value: "Proxy", label: "Proxy" },
  { value: "Cookie", label: "Cookie" },
  { value: "Imei", label: "Imei" },
  { value: "Useragent", label: "Useragent" },
  { value: "Empty", label: "(Bỏ trống)" },
];

const ImportAccountsModal: React.FC<ImportAccountsModalProps> = ({
  open,
  onClose,
  onPickGemLogin,
  onPickGpmLogin,
  onGenerateQR,
  onImportAccounts,
  loading = false,
}) => {
  const [format, setFormat] = useState<FormatField[]>(DEFAULT_FORMAT);

  const exampleByFormat = useMemo(() => {
    const cols = format
      .filter((f) => f !== "Empty")
      .map((f) => {
        switch (f) {
          case "Phone":
            return "0123456789";
          case "Password":
            return "password123";
          case "Proxy":
            return "123.45.67.89:8080 hoặc 123.45.67.89:8080:user:pass";
          case "Cookie":
            return "cookie_data";
          case "Imei":
            return "123456789012345";
          case "Useragent":
            return "Mozilla/5.0...";
          default:
            return "";
        }
      })
      .filter(Boolean);
    return cols.join("|") || "Phone|Password|Proxy|Cookie|Imei|Useragent";
  }, [format]);

  const countLines = (text?: string) =>
    (text || "").split(/\r?\n/).filter((l) => l.trim()).length;

  /** Parse danh sách theo format đã chọn (sau khi validate pass) */
  const parseByFormat = (text: string): ParsedAccount[] => {
    const mapIdxToField: Record<number, Exclude<FormatField, "Empty">> = {};
    format.forEach((f, i) => {
      if (f !== "Empty") mapIdxToField[i] = f as any;
    });
    return text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|");
        const obj: ParsedAccount = {};
        Object.keys(mapIdxToField).forEach((k) => {
          const idx = Number(k);
          const key = mapIdxToField[idx];
          const val = (parts[idx] ?? "").trim();
          if (key === "Phone") obj.phone = val;
          if (key === "Password") obj.password = val;
          if (key === "Proxy") obj.proxy = val;
          if (key === "Cookie") obj.cookie = val;
          if (key === "Imei") obj.imei = val;
          if (key === "Useragent") obj.useragent = val;
        });
        return obj;
      });
  };

  const [qrOpen, setQrOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountGpmModalOpen, setAccountGpmModalOpen] = useState(false);

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        width={860}
        destroyOnClose
        title={
          <Title level={4} style={{ margin: 0, textAlign: "center" }}>
            Nhập Tài Khoản
          </Title>
        }
      >
        <Formik
          initialValues={{ proxy: "", list: "" }}
          validationSchema={buildSchema()}
          /** Truyền format vào Yup qua context để test theo thứ tự chọn */
          context={{ format }}
          validateOnBlur
          validateOnChange={false}
          onSubmit={(values) => {
            const rows = parseByFormat(values.list);
            if (!rows.length) {
              message.warning("Chưa có dòng tài khoản nào để nhập.");
              return;
            }
            onImportAccounts?.(rows);
          }}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleSubmit,
            setFieldValue,
            setFieldTouched,
          }) => (
            <Form layout="vertical" onFinish={handleSubmit}>
              {/* Hàng trên: 2 cột */}
              <Row gutter={16}>
                {/* Cách 1 */}
                <Col xs={24} md={14}>
                  <div
                    style={{
                      border: "1px solid #eee",
                      padding: 12,
                      borderRadius: 6,
                    }}
                  >
                    <Text strong>Cách 1: Đăng nhập bằng QR (Khuyên dùng)</Text>
                    <Form.Item
                      label="Nhập proxy (nếu có):"
                      style={{ marginTop: 8, marginBottom: 4 }}
                      validateStatus={
                        touched.proxy && errors.proxy ? "error" : ""
                      }
                      help={
                        touched.proxy && errors.proxy
                          ? (errors.proxy as string)
                          : ""
                      }
                    >
                      <Input
                        name="proxy"
                        value={values.proxy}
                        onChange={handleChange}
                        placeholder="Định dạng: ip:port hoặc ip:port:user:pass"
                        allowClear
                        disabled={loading}
                      />
                    </Form.Item>
                    <Text type="danger">
                      (Định dạng: <code>ip:port</code> hoặc{" "}
                      <code>ip:port:user:pass</code>)
                    </Text>

                    <div style={{ marginTop: 12 }}>
                      <Button
                        block
                        onClick={async () => {
                          await setFieldTouched("proxy", true, true);
                          if (onGenerateQR) {
                            onGenerateQR(values.proxy || undefined);
                          }
                          setQrOpen(true);
                        }}
                        disabled={loading}
                      >
                        Tạo mã QR đăng nhập
                      </Button>
                    </div>
                  </div>
                </Col>

                {/* Cách 2 + Cách 3 */}
                <Col xs={24} md={10}>
                  <Space
                    direction="vertical"
                    style={{ width: "100%" }}
                    size={12}
                  >
                    <div
                      style={{
                        border: "1px solid #eee",
                        padding: 12,
                        borderRadius: 6,
                      }}
                    >
                      <Text strong>Cách 2: Nhập tài khoản từ GemLogin</Text>
                      <div style={{ marginTop: 12 }}>
                        <Button
                          block
                          onClick={() => {
                            onPickGemLogin?.();
                            setAccountModalOpen(true);
                          }}
                          disabled={loading}
                        >
                          Chọn tài khoản
                        </Button>
                      </div>
                    </div>
                    <div
                      style={{
                        border: "1px solid #eee",
                        padding: 12,
                        borderRadius: 6,
                      }}
                    >
                      <Text strong>Cách 3: Nhập tài khoản từ GPM-Login</Text>
                      <div style={{ marginTop: 12 }}>
                        <Button
                          block
                          onClick={() => {
                            onPickGpmLogin?.();
                            setAccountGpmModalOpen(true);
                          }}
                          disabled={loading}
                        >
                          Chọn tài khoản
                        </Button>
                      </div>
                    </div>
                  </Space>
                </Col>
              </Row>

              <Divider style={{ margin: "16px 0" }} />

              {/* Cách 4 */}
              <div
                style={{
                  border: "1px solid #eee",
                  padding: 12,
                  borderRadius: 6,
                }}
              >
                <Text strong>Cách 4: Nhập thông tin tài khoản</Text>

                <Form.Item
                  label={
                    <Space>
                      <span>Nhập danh sách tài khoản</span>
                      <Text type="secondary">({countLines(values.list)})</Text>
                    </Space>
                  }
                  validateStatus={touched.list && errors.list ? "error" : ""}
                  help={
                    touched.list && errors.list ? (errors.list as string) : ""
                  }
                  style={{ marginTop: 8 }}
                >
                  <Input.TextArea
                    name="list"
                    value={values.list}
                    onChange={(e) => setFieldValue("list", e.target.value)}
                    rows={8}
                    placeholder={`Ví dụ: ${exampleByFormat}\nMỗi dòng 1 tài khoản, các trường cách nhau bằng dấu |`}
                    disabled={loading}
                  />
                </Form.Item>

                {/* Định dạng nhập */}
                <Row align="middle" gutter={8} style={{ marginBottom: 8 }}>
                  <Col flex="0 0 120px">
                    <Text strong>Định dạng nhập:</Text>
                  </Col>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Col key={i}>
                      <Select
                        value={format[i] ?? "Empty"}
                        style={{ width: 100 }}
                        onChange={(v) => {
                          const cp = [...format];
                          cp[i] = v as FormatField;
                          setFormat(cp);
                        }}
                        options={fieldOptions}
                        disabled={loading}
                      />
                    </Col>
                  ))}
                </Row>

                <Text type="secondary">
                  Ví dụ theo định dạng hiện tại:&nbsp;
                  <code>{exampleByFormat}</code>
                </Text>

                <div style={{ marginTop: 12 }}>
                  <Button
                    type="primary"
                    block
                    htmlType="submit" // để Formik chạy validate + onSubmit
                    disabled={loading}
                  >
                    Thêm tài khoản
                  </Button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>
      <QrModal open={qrOpen} onClose={() => setQrOpen(false)} />
      <AccountModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
      />
      <AccountGpmModal
        open={accountGpmModalOpen}
        onClose={() => setAccountGpmModalOpen(false)}
      />
    </>
  );
};

export default ImportAccountsModal;
