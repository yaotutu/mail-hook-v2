const WEBHOOK_URLS_MAP = [
  {
    receiverName: "yaotutu",
    url: "http://47.94.52.234:5000/api/webhook/mail",
  },
  {
    receiverName: "test",
    url: "http://192.168.55.100:3000/api/webhook/mail",
  },
  {
    receiverName: "public",
    url: "http://192.168.55.100:3000/api/webhook/mail",
  },
];

const axios = require("axios");

/**
 * 调用所有配置的webhook发送数据
 * @param {Object} data 要发送的数据对象
 */
async function sendToWebhooks(data, receiverName) {
  if (!WEBHOOK_URLS_MAP || WEBHOOK_URLS_MAP.length === 0) {
    console.warn("没有配置webhook地址，跳过发送");
    return;
  }

  if (receiverName) {
    const config = WEBHOOK_URLS_MAP.find(
      (item) => item.receiverName === receiverName
    );
    if (config) {
      try {
        const response = await axios.post(config.url, data, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log(
          `Webhook调用成功: ${config.url}`,
          `状态码: ${response.status}`
        );
        return response;
      } catch (error) {
        const errorMsg = error.response
          ? `状态码: ${error.response.status} 错误: ${error.response.data}`
          : `错误: ${error.message}`;
        console.error(`Webhook调用失败: ${config.url}`, errorMsg);
        return null;
      }
    } else {
      console.warn(`没有找到接收者 "${receiverName}" 对应的webhook地址`);
      return;
    }
  } else {
    const requests = WEBHOOK_URLS_MAP.map((config) =>
      axios
        .post(config.url, data, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          console.log(
            `Webhook调用成功: ${config.url}`,
            `状态码: ${response.status}`
          );
          return response;
        })
        .catch((error) => {
          const errorMsg = error.response
            ? `状态码: ${error.response.status} 错误: ${error.response.data}`
            : `错误: ${error.message}`;
          console.error(`Webhook调用失败: ${config.url}`, errorMsg);
          return null;
        })
    );
    await Promise.all(requests);
  }
}

module.exports = { sendToWebhooks };
