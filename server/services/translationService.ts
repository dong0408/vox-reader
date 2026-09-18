import TencentCloudSDKException from "tencentcloud-sdk-nodejs/tencentcloud/common/exception/tencent_cloud_sdk_exception";
import { Client } from "tencentcloud-sdk-nodejs/tencentcloud/tmt/v20180321/client";
import {
  TextTranslateRequest,
} from "tencentcloud-sdk-nodejs/tencentcloud/tmt/v20180321/models";

export class TencentTranslationService {
  private client: Client;
  private projectId: number;

  constructor(secretId: string, secretKey: string, region: string = 'ap-beijing', projectId: number = 0) {
    const credential = {
      secretId,
      secretKey,
    };
    this.client = new Client({ credential, region });
    this.projectId = projectId;
  }

  async translate(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<string> {
    try {
      const req = new TextTranslateRequest();
      req.SourceText = text;
      req.Source = sourceLanguage === 'auto' ? 'auto' : sourceLanguage;
      req.Target = targetLanguage;
      req.ProjectId = this.projectId;

      const resp = await this.client.TextTranslate(req);
      return resp.TargetText || '';
    } catch (err) {
      if (err instanceof TencentCloudSDKException) {
        throw new Error(`Tencent Cloud API Error: ${err.message}`);
      }
      throw err;
    }
  }

  async batchTranslate(
    texts: string[],
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<string[]> {
    try {
      const results = await Promise.all(
        texts.map(text => this.translate(text, sourceLanguage, targetLanguage))
      );
      return results;
    } catch (err) {
      throw new Error(`Batch translation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
}
