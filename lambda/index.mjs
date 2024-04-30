import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 環境変数からS3バケットとAWS認証情報を読み込む
const BUCKET_NAME = process.env.BUCKET_NAME;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION;

// 認証情報を使用してS3クライアントサービスオブジェクトを作成
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  }
});

// Lambda関数のエクスポート
export const handler = async (event) => {
  console.log(JSON.stringify(event, null, 2));

  const params = {
    Bucket: BUCKET_NAME,
    Key: event.queryStringParameters.filename,
    ContentType: 'application/octet-stream', // コンテンツタイプを指定
    ACL: 'public-read', // アクセス制御リストを設定
  };

  // PutObjectCommandオブジェクトの作成
  const command = new PutObjectCommand(params);

  try {
    // 署名付きURLの生成、有効期限を300秒（5分）に設定
    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    return {
      statusCode: 200,
      body: JSON.stringify({ uploadUrl: url }),
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create signed URL', details: err.message })
    };
  }
};
