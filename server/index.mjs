import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import https from 'https';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));

// 配置 CORS - 支持所有来源
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  maxAge: 3600,
}));

// 添加额外的CORS响应头 - 确保浏览器接受跨域请求
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Max-Age', '3600');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Translation service initialization
let translationConfigured = false;

// Initialize translation service
function initTranslationService() {
  try {
    const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
    const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;

    if (!secretId || !secretKey) {
      console.warn('⚠️  Tencent Cloud credentials not found in environment variables');
      return false;
    }

    translationConfigured = true;
    console.log('✅ Tencent Cloud translation service configured');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize translation service:', error.message);
    return false;
  }
}

// 腾讯云 API 签名
function getTCSign(secretKey, payload, timestamp, date) {
  const service = 'tmt';
  const host = 'tmt.tencentcloudapi.com';
  const algorithm = 'TC3-HMAC-SHA256';
  const action = 'TextTranslate';
  const version = '2018-03-21';

  // 步骤1：计算规范请求字符串
  const hashedPayload = crypto.createHash('sha256').update(payload).digest('hex');
  const canonicalRequest = `POST\n/\n\ncontent-type:application/json\nhost:${host}\n\ncontent-type;host\n${hashedPayload}`;

  // 步骤2：计算字符串待签名
  const hashedRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const credentialScope = `${date}/${service}/tc3_request`;
  const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedRequest}`;

  // 步骤3：计算签名
  const secretDate = crypto.createHmac('sha256', `TC3${secretKey}`).update(date).digest();
  const secretService = crypto.createHmac('sha256', secretDate).update(service).digest();
  const secretSigning = crypto.createHmac('sha256', secretService).update('tc3_request').digest();
  const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex');

  return signature;
}

// 腾讯云 API 请求
async function callTencentCloudAPI(params) {
  return new Promise((resolve, reject) => {
    const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
    const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;

    const payload = JSON.stringify(params);
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date().toISOString().split('T')[0];

    const signature = getTCSign(secretKey, payload, timestamp, date);
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
        'X-TC-Region': process.env.TENCENT_CLOUD_REGION || 'ap-beijing',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.Response && result.Response.Error) {
            reject(new Error(result.Response.Error.Message || 'API Error'));
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

// Single text translation endpoint
app.post('/api/translate', async (req, res) => {
  try {
    if (!translationConfigured) {
      return res.status(503).json({
        error: 'Translation service is not configured. Please set TENCENT_CLOUD_SECRET_ID and TENCENT_CLOUD_SECRET_KEY environment variables.',
      });
    }

    const { text, sourceLanguage, targetLanguage } = req.body;

    if (!text || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        error: 'Missing required fields: text, sourceLanguage, targetLanguage',
      });
    }

    const params = {
      SourceText: text,
      Source: sourceLanguage === 'auto' ? 'auto' : sourceLanguage,
      Target: targetLanguage,
      ProjectId: parseInt(process.env.TENCENT_CLOUD_PROJECT_ID || '0', 10),
    };

    const result = await callTencentCloudAPI(params);

    res.json({
      translatedText: result.TargetText || '',
      sourceLanguage,
      targetLanguage,
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      error: error.message || 'Translation failed',
    });
  }
});

// Batch translation endpoint
app.post('/api/translate/batch', async (req, res) => {
  try {
    if (!translationConfigured) {
      return res.status(503).json({
        error: 'Translation service is not configured.',
      });
    }

    const { texts, sourceLanguage, targetLanguage } = req.body;

    if (!Array.isArray(texts) || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        error: 'Missing required fields: texts (array), sourceLanguage, targetLanguage',
      });
    }

    const translatedTexts = await Promise.all(
      texts.map(async (text) => {
        const params = {
          SourceText: text,
          Source: sourceLanguage === 'auto' ? 'auto' : sourceLanguage,
          Target: targetLanguage,
          ProjectId: parseInt(process.env.TENCENT_CLOUD_PROJECT_ID || '0', 10),
        };

        const result = await callTencentCloudAPI(params);
        return result.TargetText || '';
      })
    );

    res.json({
      translatedTexts,
      sourceLanguage,
      targetLanguage,
    });
  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({
      error: error.message || 'Batch translation failed',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    translationServiceAvailable: translationConfigured,
  });
});

// Start server
initTranslationService();
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📝 Translation API: http://0.0.0.0:${PORT}/api/translate`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/api/health`);
});
