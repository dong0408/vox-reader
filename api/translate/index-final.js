'use strict';
const crypto = require('crypto');
const https = require('https');

/**
 * 腾讯云云函数 - 翻译 API
 *
 * 环境变量要求：
 * - TENCENT_CLOUD_SECRET_ID
 * - TENCENT_CLOUD_SECRET_KEY
 */

async function callTencentCloudAPI(secretId, secretKey, params) {
  return new Promise((resolve, reject) => {
    try {
      const payload = JSON.stringify(params);
      const timestamp = Math.floor(Date.now() / 1000);
      const date = new Date().toISOString().split('T')[0];

      // 计算签名
      const hashedPayload = crypto.createHash('sha256').update(payload).digest('hex');
      const canonicalRequest = `POST\n/\n\ncontent-type:application/json\nhost:tmt.tencentcloudapi.com\n\ncontent-type;host\n${hashedPayload}`;
      const hashedRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
      const credentialScope = `${date}/tmt/tc3_request`;
      const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${hashedRequest}`;

      const secretDate = crypto.createHmac('sha256', `TC3${secretKey}`).update(date).digest();
      const secretService = crypto.createHmac('sha256', secretDate).update('tmt').digest();
      const secretSigning = crypto.createHmac('sha256', secretService).update('tc3_request').digest();
      const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex');

      const authorization = `TC3-HMAC-SHA256 Credential=${secretId}/${date}/tmt/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`;

      const options = {
        hostname: 'tmt.tencentcloudapi.com',
        port: 443,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorization,
          'Host': 'tmt.tencentcloudapi.com',
          'X-TC-Action': 'TextTranslate',
          'X-TC-Timestamp': timestamp.toString(),
          'X-TC-Version': '2018-03-21',
          'X-TC-Region': 'ap-beijing',
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.Response && result.Response.Error) {
              reject(new Error(`[${result.Response.Error.Code}] ${result.Response.Error.Message}`));
            } else {
              resolve(result.Response);
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    } catch (error) {
      reject(error);
    }
  });
}

exports.main_handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // 解析请求
    let body = {};
    if (typeof event.body === 'string') {
      body = JSON.parse(event.body);
    } else {
      body = event.body || {};
    }

    const { text, sourceLanguage, targetLanguage } = body;

    console.log('Request params:', { text: text?.substring(0, 50), sourceLanguage, targetLanguage });

    // 验证参数
    if (!text || !sourceLanguage || !targetLanguage) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Missing required fields: text, sourceLanguage, targetLanguage' })
      };
    }

    // 获取凭证
    const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
    const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;

    if (!secretId || !secretKey) {
      console.error('Missing credentials');
      return {
        statusCode: 503,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Server misconfigured: credentials not found' })
      };
    }

    // 调用腾讯云翻译 API
    const params = {
      SourceText: text,
      Source: sourceLanguage === 'auto' ? 'auto' : sourceLanguage,
      Target: targetLanguage,
      ProjectId: 0,
    };

    console.log('Calling Tencent Cloud API...');
    const result = await callTencentCloudAPI(secretId, secretKey, params);
    console.log('Translation result:', result.TargetText?.substring(0, 50));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        translatedText: result.TargetText || '',
        sourceLanguage,
        targetLanguage,
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: error.message || 'Internal server error',
        type: error.constructor.name
      })
    };
  }
};
