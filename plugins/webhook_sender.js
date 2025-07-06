// Webhook地址配置数组
const WEBHOOK_URLS = [
  // 在此添加webhook地址，例如：
  "http://192.168.55.100:3000/api/webhook/mail",
];

const axios = require("axios");

/**
 * 调用所有配置的webhook发送数据
 * @param {Object} data 要发送的数据对象
 */
async function sendToWebhooks(data) {
  if (!WEBHOOK_URLS || WEBHOOK_URLS.length === 0) {
    console.warn("没有配置webhook地址，跳过发送");
    return;
  }

  const requests = WEBHOOK_URLS.map((url) => {
    return axios
      .post(url, data, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .catch((error) => {
        console.error(`Webhook调用失败: ${url}`, error.message);
        return null;
      });
  });

  await Promise.all(requests);
}

module.exports = { sendToWebhooks };
