export interface Bucket {
  name: string;
}

export interface FileMetadata {
  id: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  bucketName: string;
  uploadedAt: string;
}

export interface PresignedUrlResult {
  url: string;
  expiresAt: string;
}

export interface UploadResult {
  file: FileMetadata;
}

export interface ApiProblem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
}