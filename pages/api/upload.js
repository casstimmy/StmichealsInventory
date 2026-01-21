import multiparty from "multiparty";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { mongooseConnect } from "@/lib/mongodb";

const S3BucketName = "image-bucket-admin";

export default async function ImageHandler(req, res) {
  try {
    await mongooseConnect();

    const form = new multiparty.Form();
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (error, fields, files) => (error ? reject(error) : resolve({ fields, files })));
    });

    const client = new S3Client({
      region: "eu-west-2",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    const links = [];
    const failedUploads = [];

    // Process all files in parallel
    await Promise.all(
      files.file.map(async (file) => {
        const timestamp = Date.now() + Math.floor(Math.random() * 1000);

        try {
          const metadata = await sharp(file.path).metadata();
          const format = metadata.format === "png" ? "png" : "jpeg";
          const ext = format === "png" ? "png" : "jpeg";

          // Create full and thumb buffers in parallel
          const [fullBuffer, thumbBuffer] = await Promise.all([
            sharp(file.path)
              .resize({ width: 1200, withoutEnlargement: true })[format]({ quality: 85 })
              .toBuffer(),
            sharp(file.path)
              .resize({ width: 400, withoutEnlargement: true })[format]({ quality: 70 })
              .toBuffer(),
          ]);

          const fullKey = `${timestamp}.${ext}`;
          const thumbKey = `${timestamp}_thumb.${ext}`;

          // Upload both buffers in parallel
          await Promise.all([
            client.send(
              new PutObjectCommand({
                Bucket: S3BucketName,
                Key: fullKey,
                Body: fullBuffer,
                ACL: "public-read",
                ContentType: `image/${ext}`,
              })
            ),
            client.send(
              new PutObjectCommand({
                Bucket: S3BucketName,
                Key: thumbKey,
                Body: thumbBuffer,
                ACL: "public-read",
                ContentType: `image/${ext}`,
              })
            ),
          ]);

          links.push({
            full: `https://${S3BucketName}.s3.amazonaws.com/${fullKey}`,
            thumb: `https://${S3BucketName}.s3.amazonaws.com/${thumbKey}`,
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

