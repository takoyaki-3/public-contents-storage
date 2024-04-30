import { S3Client, PutObjectCommand, getSignedUrl } from "@aws-sdk/client-s3";

// Load Environment Variables for S3 bucket and AWS credentials
const BUCKET_NAME = process.env.BUCKET_NAME;
const AWS_ACCESS_KEY_ID = process.env.ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
const AWS_SESSION_TOKEN = process.env.SESSION_TOKEN;
const AWS_REGION = process.env.REGION;

// Create an S3 client service object with credentials
const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
    sessionToken: AWS_SESSION_TOKEN // Include this only if you are using temporary credentials
  }
});

export const handler = async (event) => {
  console.log(JSON.stringify(event, null, 2));

  const params = {
    Bucket: BUCKET_NAME,
    Key: event.queryStringParameters.filename,
    Expires: 60 * 5, // The signed URL expiration time
    ContentType: 'application/octet-stream',
    ACL: 'public-read',
  };

  // Put Object Command
  const command = new PutObjectCommand(params);

  try {
    // Create a presigned URL
    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // expiresIn is in seconds
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
