# Cloudinary Media Storage Setup

**Status:** Code implemented; credentials and a live smoke test are pending.

The gallery and guest invitation upload files directly from the browser using short-lived fields signed by the application server. Assets are uploaded as `authenticated`, cannot be overwritten, and are verified against the original upload intent before MongoDB marks them complete. The API secret never enters browser code.

## 1. Create and configure Cloudinary

1. Create a Cloudinary account at <https://cloudinary.com/users/register_free>.
2. Open **Console Settings > API Keys** (the exact dashboard label can change).
3. Copy the product environment's **Cloud name**, **API key**, and **API secret**.
4. Do not create an unsigned upload preset. This application creates authenticated signatures on its server.

Add these values to root `.env.local` for local development:

```dotenv
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Use the same variable names in the production hosting dashboard and redeploy. Never prefix the secret with `NEXT_PUBLIC_` and never commit `.env.local`.

## 2. Verify locally

Restart the app after changing environment variables:

```bash
npm run dev
```

Then open a wedding workspace and upload a small JPEG from **Gallery & Media Vault**. Verify that:

1. the upload-intent request returns HTTP 201;
2. the browser POST to `api.cloudinary.com` succeeds;
3. the completion request returns HTTP 200;
4. the Cloudinary Media Library contains an authenticated asset below `weddings/<weddingId>/media/`;
5. the gallery can load its short-lived access URL.

Test a browser-compatible MP4 only with a Premium wedding because the application's Free plan intentionally blocks video and audio.

## 3. Current limits and behavior

- Supported images: JPEG, PNG, WebP, GIF, and HEIC, up to 10 MiB per file.
- Supported video: MP4, WebM, and MOV, up to 100 MiB per file.
- Supported audio: MP3, M4A, OGG, and WAV, up to 100 MiB per file.
- PDF is supported by the storage policy, although the Documents screen currently stores metadata and does not yet implement binary document upload.
- Member uploads are immediately approved. Guest uploads remain pending until an organiser approves them.
- The integration uses single-request uploads. Multipart/resumable uploads, thumbnails, and adaptive video streaming are not implemented.
- Existing unprefixed object keys are treated as legacy R2 records. Keep the four `R2_*` variables while those records exist, or migrate/delete those assets before removing the variables.

Cloudinary Free quotas apply to the entire Cloudinary account, not to each wedding or user. Monitor usage in the Cloudinary console. See the official [upload documentation](https://cloudinary.com/documentation/upload_images), [signature guidance](https://cloudinary.com/documentation/signatures), and [plan comparison](https://cloudinary.com/pricing/compare-plans).

## 4. Production checklist

- Store all three Cloudinary values as encrypted hosting secrets.
- Confirm `.env.local` remains ignored by Git.
- Keep Cloudinary's product environment restricted to trusted team members.
- Verify image upload, guest moderation, access, and deletion in production.
- Set usage notifications in Cloudinary and monitor the shared Free-plan credits.

