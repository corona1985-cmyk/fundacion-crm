const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl: getS3SignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Storage: GCSStorage } = require('@google-cloud/storage');

/**
 * Cloud Storage Service Abstraction Layer (AWS S3, Google Cloud Storage & Local Fallback)
 */
class StorageService {
  constructor() {
    this.provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
    this.s3Client = null;
    this.gcsStorage = null;

    this.initClients();
  }

  initClients() {
    if (this.provider === 's3' && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
      this.s3Bucket = process.env.S3_BUCKET_NAME || 'crm-becas-documents';
    } else if (this.provider === 'gcs' && (process.env.GCS_KEY_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      this.gcsStorage = new GCSStorage({
        projectId: process.env.GCS_PROJECT_ID,
        keyFilename: process.env.GCS_KEY_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS
      });
      this.gcsBucketName = process.env.GCS_BUCKET_NAME || 'crm-becas-documents';
    } else {
      // Fallback to local storage if credentials are missing or provider === 'local'
      this.provider = 'local';
      this.localDir = path.join(__dirname, '../../uploads/documents');
      if (!fs.existsSync(this.localDir)) {
        fs.mkdirSync(this.localDir, { recursive: true });
      }
    }
  }

  getProvider() {
    return this.provider;
  }

  /**
   * Upload file buffer or stream to cloud bucket / local disk
   */
  async uploadFile({ buffer, key, mimetype }) {
    if (this.provider === 's3' && this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype
      });
      await this.s3Client.send(command);
      return { key, provider: 's3' };
    }

    if (this.provider === 'gcs' && this.gcsStorage) {
      const bucket = this.gcsStorage.bucket(this.gcsBucketName);
      const file = bucket.file(key);
      await file.save(buffer, {
        contentType: mimetype,
        resumable: false
      });
      return { key, provider: 'gcs' };
    }

    // Local Disk Fallback
    const filePath = path.join(this.localDir, path.basename(key));
    await fs.promises.writeFile(filePath, buffer);
    return { key: path.basename(key), provider: 'local' };
  }

  /**
   * Delete file from cloud bucket or local disk
   */
  async deleteFile(key) {
    if (!key) return false;

    if (this.provider === 's3' && this.s3Client) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: this.s3Bucket,
          Key: key
        });
        await this.s3Client.send(command);
        return true;
      } catch (err) {
        console.error('Error deleting file from S3:', err.message);
        return false;
      }
    }

    if (this.provider === 'gcs' && this.gcsStorage) {
      try {
        const bucket = this.gcsStorage.bucket(this.gcsBucketName);
        await bucket.file(key).delete();
        return true;
      } catch (err) {
        console.error('Error deleting file from GCS:', err.message);
        return false;
      }
    }

    // Local Disk Fallback
    const filePath = path.join(this.localDir, path.basename(key));
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }

  /**
   * Generate secure presigned URL for file download/viewing
   */
  async getSignedUrl(key, expiresInSeconds = 3600) {
    if (!key) return null;

    if (this.provider === 's3' && this.s3Client) {
      try {
        const command = new GetObjectCommand({
          Bucket: this.s3Bucket,
          Key: key
        });
        return await getS3SignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
      } catch (err) {
        console.error('Error generating S3 presigned URL:', err.message);
        return null;
      }
    }

    if (this.provider === 'gcs' && this.gcsStorage) {
      try {
        const bucket = this.gcsStorage.bucket(this.gcsBucketName);
        const [url] = await bucket.file(key).getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + expiresInSeconds * 1000
        });
        return url;
      } catch (err) {
        console.error('Error generating GCS presigned URL:', err.message);
        return null;
      }
    }

    // Local Storage URL
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/uploads/documents/${path.basename(key)}`;
  }
}

module.exports = new StorageService();
