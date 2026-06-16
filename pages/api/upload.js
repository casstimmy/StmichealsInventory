import multiparty from "multiparty";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { mongooseConnect } from "@/lib/mongodb";
import { authMiddleware, isStaff } from "@/lib/auth-middleware";

const FULL_IMAGE_WIDTH = 1000;
const THUMB_IMAGE_WIDTH = 320;
const FULL_IMAGE_QUALITY = 76;
const THUMB_IMAGE_QUALITY = 64;
const IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";

function getS3Config() {
  const config = {
    bucketName: String(process.env.S3_BUCKET_NAME || "").trim(),
    region: String(process.env.S3_REGION || "").trim(),
    accessKeyId: String(process.env.S3_ACCESS_KEY || "").trim(),
    secretAccessKey: String(process.env.S3_SECRET_ACCESS_KEY || "").trim(),
    publicBaseUrl: String(process.env.S3_PUBLIC_BASE_URL || "").trim().replace(/\/$/, ""),
  };

  const missing = [
    ["S3_BUCKET_NAME", config.bucketName],
    ["S3_REGION", config.region],
    ["S3_ACCESS_KEY", config.accessKeyId],
    ["S3_SECRET_ACCESS_KEY", config.secretAccessKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  return { config, missing };
}

function getS3PublicUrl({ bucketName, region, publicBaseUrl }, key) {
  const encodedKey = encodeURIComponent(key);
  if (publicBaseUrl) return `${publicBaseUrl}/${encodedKey}`;
  return `https://${bucketName}.s3.${region}.amazonaws.com/${encodedKey}`;
}

function createOptimizedImageBuffer(filePath, width, quality) {
  return sharp(filePath, { animated: false })
    .rotate()
    .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 5, smartSubsample: true })
    .toBuffer();
}

export default async function ImageHandler(req, res) {
  const authError = authMiddleware(req, res);
  if (authError) return authError;
  if (!isStaff(req)) {
    return res.status(403).json({ error: "Insufficient permissions" });
  }

  try {
    const { config: s3Config, missing } = getS3Config();
    if (missing.length > 0) {
      return res.status(500).json({
        error: "S3 upload configuration is incomplete",
        missing,
      });
    }

    await mongooseConnect();

    const form = new multiparty.Form();
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (error, fields, files) => (error ? reject(error) : resolve({ fields, files })));
    });

    const client = new S3Client({
      region: s3Config.region,
      credentials: {
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      },
    });

    const links = [];
    const failedUploads = [];
    const uploadedFiles = Array.isArray(files.file) ? files.file : files.file ? [files.file] : [];

    if (uploadedFiles.length === 0) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    // Process all files in parallel
    await Promise.all(
      uploadedFiles.map(async (file) => {
        const timestamp = Date.now() + Math.floor(Math.random() * 1000);

        try {
          // Create full and thumb buffers in parallel
          const [fullBuffer, thumbBuffer] = await Promise.all([
            createOptimizedImageBuffer(file.path, FULL_IMAGE_WIDTH, FULL_IMAGE_QUALITY),
            createOptimizedImageBuffer(file.path, THUMB_IMAGE_WIDTH, THUMB_IMAGE_QUALITY),
          ]);

          const ext = "webp";
          const fullKey = `${timestamp}.${ext}`;
          const thumbKey = `${timestamp}_thumb.${ext}`;
          const contentType = "image/webp";

          // Upload both buffers in parallel
          await Promise.all([
            client.send(
              new PutObjectCommand({
                Bucket: s3Config.bucketName,
                Key: fullKey,
                Body: fullBuffer,
                ACL: "public-read",
                ContentType: contentType,
                CacheControl: IMAGE_CACHE_CONTROL,
              })
            ),
            client.send(
              new PutObjectCommand({
                Bucket: s3Config.bucketName,
                Key: thumbKey,
                Body: thumbBuffer,
                ACL: "public-read",
                ContentType: contentType,
                CacheControl: IMAGE_CACHE_CONTROL,
              })
            ),
          ]);

          links.push({
            full: getS3PublicUrl(s3Config, fullKey),
            thumb: getS3PublicUrl(s3Config, thumbKey),
          });
        } catch (err) {
          console.error("Upload failed for file:", file.originalFilename, err);
          failedUploads.push(file.originalFilename);
        }
      })
    );

    res.status(200).json({
      message: "Upload finished",
      links,
      failedUploads: failedUploads.length ? failedUploads : null,
      fields,
    });
  } catch (err) {
    console.error("Error during file upload:", err);
    res.status(500).json({ error: "File upload failed" });
  }
}

export const config = {
  api: { bodyParser: false },
};

