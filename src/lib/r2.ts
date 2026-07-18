import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME || 'orvynos-crm';
const s3Endpoint = process.env.R2_ENDPOINT; // Supports Backblaze B2 endpoints

const isR2Configured = !!(accountId && accessKeyId && secretAccessKey);

let s3Client: S3Client | null = null;
if (isR2Configured) {
  s3Client = new S3Client({
    region: s3Endpoint ? (accountId || 'us-east-1') : 'auto',
    endpoint: s3Endpoint || `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
    },
  });
}

/**
 * Uploads a file (Buffer) to the configured storage provider.
 * Falls back to local filesystem (under public/ directory) if R2 is not configured.
 * @returns The key (storage path) of the uploaded file.
 */
export async function uploadToStorage(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (isR2Configured && s3Client) {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    });
    await s3Client.send(command);
    return key;
  } else {
    const localPath = path.join(process.cwd(), 'public', key);
    const dir = path.dirname(localPath);
    
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(localPath, buffer);
    
    console.log(`[Local Storage Fallback] Saved file to: ${localPath}`);
    return key;
  }
}

/**
 * Returns a downloadable URL for a given file key.
 * If R2 is configured, generates a secure presigned URL.
 * If not, returns a local relative server URL.
 */
export async function getStorageUrl(key: string): Promise<string> {
  if (isR2Configured && s3Client) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } else {
    return `/${key}`;
  }
}

/**
 * Downloads the raw file buffer from the configured storage provider.
 * Used to stream cached PDFs directly to the browser without a redirect.
 */
export async function getFromStorage(key: string): Promise<Buffer> {
  if (isR2Configured && s3Client) {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const response = await s3Client.send(command);
    const stream = response.Body;
    if (!stream) throw new Error('Empty response body from storage');
    
    // Convert the readable stream to a Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } else {
    const localPath = path.join(process.cwd(), 'public', key);
    return await fs.promises.readFile(localPath);
  }
}
