import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app);

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
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storage, `${folder}/${timestamp}_${sanitizedFilename}`);
    
    console.log(`📤 Uploading attachment to Firebase Storage: ${sanitizedFilename} (${(content.length / 1024 / 1024).toFixed(2)} MB)`);
    
    // Upload file to Firebase Storage
    const uploadResult = await uploadBytes(storageRef, content, {
      contentType: contentType,
      customMetadata: {
        originalFilename: filename,
        uploadedAt: new Date().toISOString(),
        fileSize: content.length.toString()
      }
    });
    
    // Get download URL
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    
    const attachmentId = `att_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    const storedAttachment: StoredAttachment = {
      id: attachmentId,
      filename: filename,
      contentType: contentType,
      size: content.length,
      storageUrl: uploadResult.ref.fullPath,
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
    console.log(`📥 Downloading attachment from storage: ${storageUrl}`);
    
    const storageRef = ref(storage, storageUrl);
    const downloadUrl = await getDownloadURL(storageRef);
    
    // Fetch the file content
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
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
    const storageRef = ref(storage, storageUrl);
    const { deleteObject } = await import('firebase/storage');
    await deleteObject(storageRef);
    console.log(`🗑️ Deleted attachment from storage: ${storageUrl}`);
  } catch (error) {
    console.error('❌ Error deleting attachment from storage:', error);
    // Don't throw here - deletion errors shouldn't break the main flow
  }
}