// extract_mail_data

// documentation via: haraka -c /Users/yaotutu/Desktop/code/mail-hook-v2 -h plugins/extract_mail_data

// Put your plugin code here
// type: `haraka -h Plugins` for documentation on how to create a plugin
// plugins/extract_mail_data.js

const { simpleParser } = require("mailparser");
const { sendToWebhooks } = require("./webhook_sender");

exports.register = function () {
  this.loginfo("🧩 extract_mail_data 插件注册成功");
  this.register_hook("data_post", "extract_mail_data");
};

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

    const mailData = {
      // ✅ 改这里：拿到发起 SMTP 投递的邮箱（转发者）
      senderPhone: String(transaction.mail_from?.address() || ""),

      // 💌 原始发件人（可选：用于分析）
      originalFrom: String(parsed.from?.value?.[0]?.address || ""),

      // ✅ 邮件正文
      smsContent: String(parsed.text || ""),

      // ✅ 时间戳
      smsReceivedAt: timestamp,

      // ✅ 可以尝试从头部进一步提取路径（可选）
      forwardedFrom:
        parsed.headers.get("x-forwarded-for") ||
        parsed.headers.get("delivered-to") ||
        parsed.headers.get("received"),
    };

    this.loginfo("📦 提取的邮件数据:", mailData);

    sendToWebhooks(mailData).catch((err) => {
      this.logerror("Webhook发送失败:", err.message);
    });

    next();
  });
};
