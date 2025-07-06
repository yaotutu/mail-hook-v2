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
  {
    receiverName: "sj",
    url: "http://192.168.55.100:3000/api/webhook/mail",
  },
];

const axios = require("axios");

/**
 * 调用所有配置的webhook发送数据
 * @param {Object} data 要发送的数据对象
 */
async function sendToWebhooks(data, receiverName) {
  console.log(
    `[${new Date().toISOString()}] 开始处理webhook请求`,
    receiverName ? `接收者: ${receiverName}` : "批量发送"
  );

  if (!WEBHOOK_URLS_MAP || WEBHOOK_URLS_MAP.length === 0) {
    console.warn("没有配置webhook地址，跳过发送");
    return;
  }

  if (receiverName) {
    console.log(`正在查找接收者 ${receiverName} 的webhook配置`);
    const config = WEBHOOK_URLS_MAP.find(
      (item) => item.receiverName === receiverName
    );
    if (config) {
      console.log(
        `找到接收者 ${receiverName} 的webhook配置，URL: ${config.url}`
      );
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
    console.log(`开始批量发送到 ${WEBHOOK_URLS_MAP.length} 个webhook`);
    const requests = WEBHOOK_URLS_MAP.map((config) => {
      console.log(`准备发送到 ${config.receiverName} (${config.url})`);
      return axios
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
        });
    });

    const results = await Promise.all(requests);
    const successCount = results.filter((r) => r !== null).length;
    console.log(
      `批量发送完成，成功 ${successCount}/${WEBHOOK_URLS_MAP.length}`
    );
  }
  console.log("webhook处理完成");
}

module.exports = { sendToWebhooks };
