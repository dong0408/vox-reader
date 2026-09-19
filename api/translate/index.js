'use strict';
const crypto = require('crypto');
const https = require('https');

// 腾讯云翻译 API
async function callTencentCloudAPI(secretId, secretKey, params) {
  return new Promise((resolve, reject) => {
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
            reject(new Error(result.Response.Error.Message));
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
  });
}

const getCORSHeaders = () => ({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
});

exports.main_handler = async (event, context) => {
  // 处理 OPTIONS 预检请求
  if (event.httpMethod === 'OPTIONS' || event.requestContext?.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCORSHeaders(),
      body: '',
    };
  }

  try {
    // 获取腾讯云凭证（从环境变量）
    const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
    const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;

    if (!secretId || !secretKey) {
      return {
        statusCode: 503,
        headers: getCORSHeaders(),
        body: JSON.stringify({ error: 'Credentials not configured' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { text, sourceLanguage, targetLanguage } = body;

    if (!text || !sourceLanguage || !targetLanguage) {
      return {
        statusCode: 400,
        headers: getCORSHeaders(),
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const params = {
      SourceText: text,
      Source: sourceLanguage === 'auto' ? 'auto' : sourceLanguage,
      Target: targetLanguage,
      ProjectId: 0,
    };

    const result = await callTencentCloudAPI(secretId, secretKey, params);

    return {
      statusCode: 200,
      headers: getCORSHeaders(),
      body: JSON.stringify({
        translatedText: result.TargetText || '',
        sourceLanguage,
        targetLanguage,
      })
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      statusCode: 500,
      headers: getCORSHeaders(),
      body: JSON.stringify({ error: error.message })
    };
  }
};
