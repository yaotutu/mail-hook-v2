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
  if (!transaction) return next(); // 没有 transaction，直接跳过

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
    // 这里 parsed 就是解析后的邮件对象
    // this.loginfo("邮件主题: " + parsed.subject);
    // this.loginfo("发件人: " + JSON.stringify(parsed.from));
    // this.loginfo("正文: " + parsed.text);

    const timestamp = Date.now();
    this.loginfo("邮件接收时间戳: " + timestamp);

    const mailData = {
      senderPhone: String(
        parsed.from?.value?.[0]?.address || parsed.from?.text || ""
      ),
      smsContent: String(parsed.text || ""),
      smsReceivedAt: Date.now(), // 直接使用数字时间戳
    };
    this.loginfo("提取的邮件数据:", {
      senderPhone: mailData.senderPhone,
      smsContent: mailData.smsContent,
      smsReceivedAt: mailData.smsReceivedAt,
    });

    // 异步发送webhook，不影响主流程
    sendToWebhooks(mailData).catch((err) => {
      this.logerror("Webhook发送失败:", err.message);
    });

    // 继续邮件流程
    next();
  });
};
