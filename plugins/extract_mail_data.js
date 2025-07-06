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

    // ✅ 获取 SMTP envelope 发件人
    const envelopeFrom = String(transaction.mail_from?.address() || "");

    // ✅ 获取 SMTP envelope 收件人（你自己的 public@yaotutu.top）
    const rcpt = transaction.rcpt_to?.[0];
    const receiverName = rcpt?.user || ""; // ← 你要的 "public"

    const mailData = {
      receiverName, // ✅ 加上这个字段

      senderPhone: extractRealForwarder(envelopeFrom),
      originalFrom: String(parsed.from?.value?.[0]?.address || ""),
      smsContent: String(parsed.text || ""),
      smsReceivedAt: timestamp,
      forwardedFrom:
        parsed.headers.get("x-forwarded-for") ||
        parsed.headers.get("delivered-to") ||
        parsed.headers.get("received"),
    };

    this.loginfo("📦 提取的邮件数据:", mailData);

    sendToWebhooks(mailData, receiverName).catch((err) => {
      this.logerror("Webhook发送失败:", err.message);
    });

    next();
  });
};
