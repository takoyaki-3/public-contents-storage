import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import jwt from 'jsonwebtoken';
import axios from "axios";

// Load the S3 bucket and user name from environment variables
const BUCKET_NAME = process.env.BUCKET_NAME;
const REGION = process.env.REGION;
const UserName = process.env.USER_NAME;

// Create an S3 client service object with authentication information
const s3Client = new S3Client({
  region: REGION,
});

// Lambda handler function
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

  // Get the current time in UTC and convert it to Japan time (UTC+9)
  const now = new Date();
  const japanTimeOffset = now.getTime() + (now.getTimezoneOffset() * 60000) + (9 * 3600000);
  const japanDate = new Date(japanTimeOffset);

  // Year, month, and day of the Japan time
  const year = japanDate.getFullYear(); // 年を取得
  const month = (japanDate.getMonth() + 1).toString().padStart(2, '0'); // 月を取得し、2桁にする
  const day = japanDate.getDate().toString().padStart(2, '0'); // 日を取得し、2桁にする

  // Get the filename from the query string
  const filename = event.queryStringParameters.filename;

  // Set the parameters for the PutObjectCommand
  const params = {
    Bucket: BUCKET_NAME,
    Key: `${year}/${month}${day}/${filename}`, // ファイルパスを指定
    ContentType: 'application/octet-stream', // コンテンツタイプを指定
  };

  // Create a PutObjectCommand object
  const command = new PutObjectCommand(params);

  try {
    // Create a signed URL for the PutObjectCommand
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
  const tokenStr = event?.headers?.Authorization;

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

      return {
        status: 'ok',
        isAuthorized: true,
        user: decoded.email,
        message: 'Authorized by JWT',
      };
    } catch (error) {
      console.error({error});
      // failed to verify the token or token is expired
      return {
        status: 'failed',
        isAuthorized: false,
        user: 'anonymous',
        message: `Unauthorized: ${error.message}`,
      }
    }
  }

  // not authorized
  return {
    status: 'ok',
    isAuthorized: false,
    user: 'anonymous',
    message: 'Unauthorized',
  }
}
