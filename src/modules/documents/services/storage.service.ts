import "server-only";
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AppError } from "@/shared/errors/app-error";
function config() {
 const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
 if (!R2_ACCOUNT_ID || !/^[a-f\d]{32}$/i.test(R2_ACCOUNT_ID) || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) throw new AppError("DEPENDENCY_UNAVAILABLE", "Document storage is not configured", 503);
 return { client: new S3Client({ region: "auto", endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY }, maxAttempts: 2 }), bucket: R2_BUCKET_NAME };
}
export class StorageService {
 static async uploadUrl(key: string, mime: string, size: number) { const { client, bucket } = config(); return getSignedUrl(client, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: mime, ContentLength: size }), { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) }); }
 static async verifyAndSeal(uploadKey: string, objectKey: string, mime: string, size: number) {
  const { client, bucket } = config();
  try {
   const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: uploadKey }));
   if (head.ContentLength !== size || head.ContentType !== mime || !head.ETag) throw new AppError("VALIDATION_ERROR", "Uploaded file metadata does not match the upload intent");
   // Copy with ETag precondition to an immutable key: an unexpired PUT URL cannot overwrite a finalized document.
   await client.send(new CopyObjectCommand({ Bucket: bucket, Key: objectKey, CopySource: `${bucket}/${uploadKey}`, CopySourceIfMatch: head.ETag, MetadataDirective: "REPLACE", ContentType: mime, ContentDisposition: "attachment" }));
   const sealed = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
   if (sealed.ContentLength !== size || sealed.ContentType !== mime) throw new AppError("VALIDATION_ERROR", "File verification failed");
  } catch (error) { if (error instanceof AppError) throw error; throw new AppError("MEDIA_NOT_READY", "Upload could not be verified; retry after uploading", 409); }
 }
 static async accessUrl(key: string) { const { client, bucket } = config(); return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: "attachment" }), { expiresIn: 60 }); }
 static async remove(key: string) { const { client, bucket } = config(); await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })); }
}
