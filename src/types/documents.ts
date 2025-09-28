import { z } from 'zod';

// User document schema
export const UserDocument = z.object({
  id: z.string().optional(),
  user_id: z.string(),
  title: z.string(),
  type: z.enum(['contract', 'id', 'other']),
  file_url: z.string(), // Storage URL after sync
  file_name: z.string(),
  file_size: z.number().optional(),
  mime_type: z.string().optional(),
  uploaded_by_user_id: z.string(),
  created_at: z.string(),
  expires_at: z.string().optional(),
  updated_at: z.string(),
});

export type UserDocumentT = z.infer<typeof UserDocument>;

// Document form data
export const DocumentFormData = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['contract', 'id', 'other']),
  expires_at: z.string().optional(),
});

export type DocumentFormDataT = z.infer<typeof DocumentFormData>;

// Document upload data
export const DocumentUploadData = z.object({
  uri: z.string(),
  name: z.string(),
  type: z.string().optional(),
  size: z.number().optional(),
});

export type DocumentUploadDataT = z.infer<typeof DocumentUploadData>;

// Document type labels
export const DOCUMENT_TYPE_LABELS = {
  contract: 'Contract',
  id: 'Identification',
  other: 'Other',
} as const;

// Document type descriptions
export const DOCUMENT_TYPE_DESCRIPTIONS = {
  contract: 'Tenancy agreement or contract documents',
  id: 'Identity verification documents',
  other: 'Other supporting documents',
} as const;

// Document type icons
export const DOCUMENT_TYPE_ICONS = {
  contract: 'document-text',
  id: 'card',
  other: 'folder',
} as const;

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  'application/pdf': { extension: 'pdf', icon: 'document-text', color: '#ef4444' },
  'image/jpeg': { extension: 'jpg', icon: 'image', color: '#22c55e' },
  'image/png': { extension: 'png', icon: 'image', color: '#22c55e' },
  'image/webp': { extension: 'webp', icon: 'image', color: '#22c55e' },
  'application/msword': { extension: 'doc', icon: 'document', color: '#3b82f6' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { 
    extension: 'docx', 
    icon: 'document', 
    color: '#3b82f6' 
  },
} as const;

// Get file info from MIME type
export const getFileInfo = (mimeType: string) => {
  return SUPPORTED_FILE_TYPES[mimeType as keyof typeof SUPPORTED_FILE_TYPES] || {
    extension: 'file',
    icon: 'document',
    color: '#6b7280',
  };
};

// Get file size display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if file is image
export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/');
};

// Check if file is PDF
export const isPdfFile = (mimeType: string): boolean => {
  return mimeType === 'application/pdf';
};

// Document status based on expiry
export const getDocumentStatus = (expiresAt?: string): 'valid' | 'expiring' | 'expired' => {
  if (!expiresAt) return 'valid';
  
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  if (expiryDate < now) return 'expired';
  if (expiryDate < thirtyDaysFromNow) return 'expiring';
  return 'valid';
};

// Get status color
export const getDocumentStatusColor = (status: 'valid' | 'expiring' | 'expired'): string => {
  switch (status) {
    case 'valid':
      return '#22c55e'; // green
    case 'expiring':
      return '#eab308'; // yellow
    case 'expired':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
};

// Document validation rules
export const validateDocumentUpload = (file: DocumentUploadDataT): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size && file.size > maxSize) {
    errors.push('File size must be less than 10MB');
  }
  
  // Check file type
  const supportedTypes = Object.keys(SUPPORTED_FILE_TYPES);
  if (file.type && !supportedTypes.includes(file.type)) {
    errors.push('File type not supported. Please use PDF, JPG, PNG, or DOC files.');
  }
  
  // Check file name
  if (!file.name || file.name.trim().length === 0) {
    errors.push('File name is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};