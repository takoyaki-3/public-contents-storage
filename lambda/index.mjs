import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import jwt from 'jsonwebtoken';
import axios from "axios";

// 環境変数からS3バケットとAWS認証情報を読み込む
const BUCKET_NAME = process.env.BUCKET_NAME;
const REGION = process.env.REGION;

const UserName = process.env.UserName;

// 認証情報を使用してS3クライアントサービスオブジェクトを作成
const s3Client = new S3Client({
  region: REGION,
});

// Lambda関数のエクスポート
export const handler = async (event) => {
  console.log(JSON.stringify(event, null, 2));

  const user = await authorize(event);
  if (user?.user !== UserName) {
    return {
      statusCode: 401,
      body: JSON.stringify(user),
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    };
  }

  const params = {
    Bucket: BUCKET_NAME,
    Key: event.queryStringParameters.filename,
    ContentType: 'application/octet-stream', // コンテンツタイプを指定
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

// Google public keys URL
const GOOGLE_PUBLIC_KEYS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

// Cache Google's public keys
let cachedGooglePublicKeys = null;
let lastUpdatedTime = null;

// Authorize the request
export const authorize = async (event) => {
  const tokenStr = event?.headers?.authorization;

  // authorized by JWT token
  if (tokenStr?.startsWith('Bearer ')) {

    // Get the token from the Authorization header
    const token = tokenStr.split(' ')[1];

    try {
      // if the public key cache is uninitialized, expired, or updated more than an hour ago, get the public keys
      if (!cachedGooglePublicKeys || !lastUpdatedTime || (Date.now() - lastUpdatedTime) > 3600000) {
        const response = await axios.get(GOOGLE_PUBLIC_KEYS_URL, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        cachedGooglePublicKeys = response.data;
        lastUpdatedTime = Date.now();
      }

      // Get the kid from the token
      const unverifiedToken = jwt.decode(token, { complete: true });
      const kid = unverifiedToken?.header.kid;

      // Select the appropriate public key
      const publicKey = cachedGooglePublicKeys[kid];
      if (!publicKey) {
        throw new Error('Invalid token: kid not recognized');
      }

      // Verify the token
      const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

      const role = await checkUserRole(decoded.email);
      return {
        status: 'ok',
        isAuthorized: true,
        user: decoded.email,
        role: role ?? 'authenticatedUser',
        message: 'Authorized by JWT',
      };
    } catch (error) {
      console.error({error});
      // failed to verify the token or token is expired
      return {
        status: 'failed',
        isAuthorized: false,
        user: 'anonymous',
        role: 'anonymous',
        message: `Unauthorized: ${error.message}`,
      }
    }
  }

  // not authorized
  return {
    status: 'ok',
    isAuthorized: false,
    user: 'anonymous',
    role: 'anonymous',
    message: 'Unauthorized',
  }
}
