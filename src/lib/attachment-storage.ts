import { bucket } from './firebase-admin';

export interface StoredAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  storageUrl: string;
  downloadUrl: string;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Store a large file in Firebase Storage and return reference info
 */
export async function storeAttachmentFile(
  filename: string,
  content: Buffer,
  contentType: string,
  folder: string = 'email-attachments'
): Promise<StoredAttachment> {
  try {
    if (!bucket) {
      throw new Error('Firebase Storage not initialized');
    }

    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${folder}/${timestamp}_${sanitizedFilename}`;
    const file = bucket.file(storagePath);
    
    console.log(`📤 Uploading attachment to Firebase Storage: ${sanitizedFilename} (${(content.length / 1024 / 1024).toFixed(2)} MB)`);
    
    // Upload file to Firebase Storage using Admin SDK
    await file.save(content, {
      metadata: {
        contentType: contentType,
        metadata: {
          originalFilename: filename,
          uploadedAt: new Date().toISOString(),
          fileSize: content.length.toString()
        }
      }
    });
    
    // Get download URL with 7-day expiration (you can adjust this)
    const [downloadUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    const attachmentId = `att_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    const storedAttachment: StoredAttachment = {
      id: attachmentId,
      filename: filename,
      contentType: contentType,
      size: content.length,
      storageUrl: storagePath,
      downloadUrl: downloadUrl,
      createdAt: new Date(),
      // Set expiration to 30 days from now (optional cleanup)
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };
    
    console.log(`✅ Attachment uploaded successfully: ${attachmentId}`);
    console.log(`🔗 Download URL: ${downloadUrl}`);
    
    return storedAttachment;
    
  } catch (error) {
    console.error('❌ Error uploading attachment to storage:', error);
    throw new Error(`Failed to upload attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download an attachment from Firebase Storage
 */
export async function downloadAttachmentFile(storageUrl: string): Promise<Buffer> {
  try {
    if (!bucket) {
      throw new Error('Firebase Storage not initialized');
    }

    console.log(`📥 Downloading attachment from storage: ${storageUrl}`);
    
    const file = bucket.file(storageUrl);
    const [buffer] = await file.download();
    
    console.log(`✅ Downloaded attachment: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    return buffer;
    
  } catch (error) {
    console.error('❌ Error downloading attachment from storage:', error);
    throw new Error(`Failed to download attachment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete an attachment from Firebase Storage
 */
export async function deleteAttachmentFile(storageUrl: string): Promise<void> {
  try {
    if (!bucket) {
      console.warn('Firebase Storage not initialized - cannot delete attachment');
      return;
    }

    const file = bucket.file(storageUrl);
    await file.delete();
    console.log(`🗑️ Deleted attachment from storage: ${storageUrl}`);
  } catch (error) {
    console.error('❌ Error deleting attachment from storage:', error);
    // Don't throw here - deletion errors shouldn't break the main flow
  }
}