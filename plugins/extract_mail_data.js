// plugins/extract_mail_data.js

const { simpleParser } = require("mailparser");
const { sendToWebhooks } = require("./webhook_sender");

exports.register = function () {
  this.loginfo("🧩 extract_mail_data 插件注册成功");
  this.register_hook("data_post", "extract_mail_data");
};

// ✅ 转发人邮箱提取工具函数
function extractRealForwarder(envelopeFrom) {
  if (!envelopeFrom) return "";

  // 网易邮箱（163.com / 126.com）
  const neteaseMatch = envelopeFrom.match(/^auto_([^+]+)\+/);
  if (neteaseMatch && neteaseMatch[1]) {
    return `${neteaseMatch[1]}@163.com`;
  }

  // Gmail（creo+xxx@gmail.com）
  const gmailMatch = envelopeFrom.match(/^([^+]+)\+[^@]+@gmail\.com$/);
  if (gmailMatch && gmailMatch[1]) {
    return `${gmailMatch[1]}@gmail.com`;
  }

  // 一般自定义域（yaotutu+public@yaotutu.top）
  const normalMatch = envelopeFrom.match(/^(.+?)\+[^@]+@(.+)$/);
  if (normalMatch && normalMatch[1] && normalMatch[2]) {
    return `${normalMatch[1]}@${normalMatch[2]}`;
  }

  // fallback
  return envelopeFrom;
}

exports.extract_mail_data = function (next, connection) {
  const transaction = connection.transaction;
  if (!transaction) return next();

  const message_stream = transaction.message_stream;
  if (!message_stream) {
    this.logwarn("没有有效的 message_stream");
    return next();
  }

  simpleParser(message_stream, (err, parsed) => {
    if (err) {
      this.logerror("邮件解析失败: " + err.message);
      return next();
    }

    const timestamp = Date.now();

    // 原始 envelope-from
    const envelopeFrom = String(transaction.mail_from?.address() || "");

    const mailData = {
      // ✅ 经过智能解析的中间转发人邮箱（比如 zhaoyafeng1995@163.com）
      senderPhone: extractRealForwarder(envelopeFrom),

      // ✅ 原始邮件头 From（真实发件人，比如 noreply@xdaforums.com）
      originalFrom: String(parsed.from?.value?.[0]?.address || ""),

      // ✅ 邮件正文内容
      smsContent: String(parsed.text || ""),

      // ✅ 接收时间戳
      smsReceivedAt: timestamp,

      // ✅ 从头部尝试获取更详细的转发链路信息（可选）
      forwardedFrom:
        parsed.headers.get("x-forwarded-for") ||
        parsed.headers.get("delivered-to") ||
        parsed.headers.get("received"),
    };

    this.loginfo("📦 提取的邮件数据:", mailData);

    // ✅ 异步发送 Webhook，不阻塞主流程
    sendToWebhooks(mailData).catch((err) => {
      this.logerror("Webhook发送失败:", err.message);
    });

    next();
  });
};
