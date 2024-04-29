import { S3Client, PutObjectCommand, getSignedUrl } from "@aws-sdk/client-s3";

// Create an S3 client service object
const s3Client = new S3Client({});

// Load Environment Variables
const BUCKET_NAME = process.env.BUCKET_NAME;

export const handler = async (event) => {
  console.log(JSON.stringify(event, null, 2));

  const params = {
    Bucket: BUCKET_NAME,
    Key: event.queryStringParameters.filename,
    Expires: 60 * 5,
    ContentType: 'application/octet-stream',
    ACL: 'public-read',
  };

  // Put Object Command
  const command = new PutObjectCommand(params);

  try {
    // Create a presigned URL
    const url = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // expiresInは秒単位
    return {
      statusCode: 200,
      body: JSON.stringify({ uploadUrl: url }),
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create signed URL' })
    };
  }
};
