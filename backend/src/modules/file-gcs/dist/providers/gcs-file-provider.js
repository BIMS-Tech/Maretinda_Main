"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GCSFileProvider = void 0;
const utils_1 = require("@medusajs/framework/utils");
const storage_1 = require("@google-cloud/storage");
const crypto_1 = require("crypto");
class GCSFileProvider extends utils_1.AbstractFileProviderService {
    constructor(_deps, _options) {
        super();
        this.isReady = false;
        const projectId = process.env.GCS_PROJECT_ID;
        const bucketName = process.env.GCS_BUCKET_NAME;
        if (!projectId || !bucketName) {
            console.warn("[file-gcs] Missing GCS_PROJECT_ID or GCS_BUCKET_NAME — file provider disabled");
            this.bucketName = "";
            return;
        }
        this.bucketName = bucketName;
        this.cdnUrl = process.env.GCS_CDN_URL;
        const storageConfig = { projectId };
        if (process.env.GCS_CREDENTIALS) {
            try {
                storageConfig.credentials = JSON.parse(process.env.GCS_CREDENTIALS);
            }
            catch {
                console.error("[file-gcs] Failed to parse GCS_CREDENTIALS JSON");
            }
        }
        else if (process.env.GCS_KEY_FILE) {
            storageConfig.keyFilename = process.env.GCS_KEY_FILE;
        }
        const storage = new storage_1.Storage(storageConfig);
        this.bucket = storage.bucket(bucketName);
        this.isReady = true;
        console.log("[file-gcs] GCS file provider initialized:", { projectId, bucketName });
    }
    async toBuffer(content) {
        if (Buffer.isBuffer(content))
            return content;
        if (typeof content === "string")
            return Buffer.from(content, "base64");
        return new Promise((resolve, reject) => {
            const chunks = [];
            const stream = content;
            stream.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
            stream.on("end", () => resolve(Buffer.concat(chunks)));
            stream.on("error", reject);
        });
    }
    buildGCSPath(filename, access) {
        const timestamp = Date.now();
        const random = (0, crypto_1.randomBytes)(4).toString("hex");
        const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 80);
        const folder = access === "private" ? "private" : "public";
        return `medusa/${folder}/${timestamp}-${random}-${sanitized}`;
    }
    publicUrl(key) {
        if (this.cdnUrl)
            return `${this.cdnUrl.replace(/\/$/, "")}/${key}`;
        return `https://storage.googleapis.com/${this.bucketName}/${key}`;
    }
    async upload(file) {
        if (!this.isReady)
            throw new Error("[file-gcs] GCS not configured");
        const buffer = await this.toBuffer(file.content);
        const key = this.buildGCSPath(file.filename, file.access || "public");
        const gcsFile = this.bucket.file(key);
        await gcsFile.save(buffer, {
            metadata: {
                contentType: file.mimeType,
                cacheControl: "public, max-age=31536000",
            },
        });
        if ((file.access || "public") === "public") {
            await gcsFile.makePublic();
        }
        return { key, url: this.publicUrl(key) };
    }
    async delete(file) {
        if (!this.isReady)
            return;
        try {
            await this.bucket.file(file.fileKey).delete();
        }
        catch (err) {
            // Ignore "not found" errors
            if (err?.code !== 404)
                throw err;
        }
    }
    async getPresignedDownloadUrl(fileData) {
        if (!this.isReady)
            throw new Error("[file-gcs] GCS not configured");
        const [url] = await this.bucket.file(fileData.fileKey).getSignedUrl({
            version: "v4",
            action: "read",
            expires: Date.now() + 3600 * 1000, // 1 hour
        });
        return url;
    }
}
exports.GCSFileProvider = GCSFileProvider;
GCSFileProvider.identifier = "gcs";
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2NzLWZpbGUtcHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcHJvdmlkZXJzL2djcy1maWxlLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUF1RTtBQUV2RSxtREFBK0M7QUFDL0MsbUNBQW9DO0FBR3BDLE1BQWEsZUFBZ0IsU0FBUSxtQ0FBMkI7SUFROUQsWUFBWSxLQUFVLEVBQUUsUUFBYTtRQUNuQyxLQUFLLEVBQUUsQ0FBQTtRQUhELFlBQU8sR0FBWSxLQUFLLENBQUE7UUFLOUIsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLENBQUE7UUFDNUMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUE7UUFFOUMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1lBQzlCLE9BQU8sQ0FBQyxJQUFJLENBQUMsK0VBQStFLENBQUMsQ0FBQTtZQUM3RixJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQTtZQUNwQixPQUFNO1FBQ1IsQ0FBQztRQUVELElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFBO1FBQzVCLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUE7UUFFckMsTUFBTSxhQUFhLEdBQVEsRUFBRSxTQUFTLEVBQUUsQ0FBQTtRQUV4QyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDaEMsSUFBSSxDQUFDO2dCQUNILGFBQWEsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFBO1lBQ3JFLENBQUM7WUFBQyxNQUFNLENBQUM7Z0JBQ1AsT0FBTyxDQUFDLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFBO1lBQ2xFLENBQUM7UUFDSCxDQUFDO2FBQU0sSUFB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