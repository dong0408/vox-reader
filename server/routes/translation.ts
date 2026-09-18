import express, { Router, Request, Response } from 'express';
import { TencentTranslationService } from '../services/translationService';

const router = Router();

// Get credentials from environment variables
const secretId = process.env.TENCENT_CLOUD_SECRET_ID;
const secretKey = process.env.TENCENT_CLOUD_SECRET_KEY;
const region = process.env.TENCENT_CLOUD_REGION || 'ap-beijing';
const projectId = parseInt(process.env.TENCENT_CLOUD_PROJECT_ID || '0', 10);

// Initialize translation service if credentials are provided
let translationService: TencentTranslationService | null = null;

if (secretId && secretKey) {
  translationService = new TencentTranslationService(secretId, secretKey, region, projectId);
} else {
  console.warn('Warning: Tencent Cloud credentials not found. Translation API will not work.');
}

// Single text translation endpoint
router.post('/translate', async (req: Request, res: Response) => {
  try {
    if (!translationService) {
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

    const translatedText = await translationService.translate(
      text,
      sourceLanguage,
      targetLanguage,
    );

    res.json({
      translatedText,
      sourceLanguage,
      targetLanguage,
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Translation failed',
    });
  }
});

// Batch translation endpoint
router.post('/translate/batch', async (req: Request, res: Response) => {
  try {
    if (!translationService) {
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

    const translatedTexts = await translationService.batchTranslate(
      texts,
      sourceLanguage,
      targetLanguage,
    );

    res.json({
      translatedTexts,
      sourceLanguage,
      targetLanguage,
    });
  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Batch translation failed',
    });
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    translationServiceAvailable: !!translationService,
  });
});

export default router;
