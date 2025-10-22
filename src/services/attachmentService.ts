/**
 * Attachment Service
 * Handles all file attachment operations with S3
 */

import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface UploadFileInput {
  file: File;
  taskId: string;
  uploadedById: string;
}

export const attachmentService = {
  /**
   * Upload file to S3 and create attachment record
   */
  async uploadFile(input: UploadFileInput) {
    try {
      const { file, taskId, uploadedById } = input;
      
      // Generate unique file key
      const timestamp = Date.now();
      const fileKey = `attachments/${taskId}/${timestamp}-${file.name}`;

      // Upload to S3
      const uploadResult = await uploadData({
        key: fileKey,
        data: file,
        options: {
          contentType: file.type,
        },
      }).result;

      // Get the file URL
      const urlResult = await getUrl({
        key: fileKey,
        options: {
          expiresIn: 3600, // 1 hour
        },
      });

      // Create attachment record in DynamoDB
      const { data, errors } = await client.models.Attachment.create({
        taskId,
        fileName: file.name,
        fileUrl: fileKey, // Store the S3 key, not the signed URL
        fileSize: file.size,
        fileType: file.type,
        uploadedById,
      });

      if (errors) {
        // If DB creation fails, try to delete the uploaded file
        await remove({ key: fileKey }).catch(console.error);
        throw new Error(errors[0].message);
      }

      return { 
        data: {
          ...data,
          downloadUrl: urlResult.url.toString(),
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to upload file' 
      };
    }
  },

  /**
   * Get attachments by task
   */
  async getByTask(taskId: string) {
    try {
      const { data, errors } = await client.models.Attachment.list({
        filter: { taskId: { eq: taskId } },
      });

      if (errors) {
        throw new Error(errors[0].message);
      }

      // Generate download URLs for each attachment
      const attachmentsWithUrls = await Promise.all(
        (data || []).map(async (attachment) => {
          try {
            const urlResult = await getUrl({
              key: attachment.fileUrl,
              options: {
                expiresIn: 3600, // 1 hour
              },
            });

            return {
              ...attachment,
              downloadUrl: urlResult.url.toString(),
            };
          } catch (error) {
            console.error('Error generating URL for attachment:', error);
            return {
              ...attachment,
              downloadUrl: null,
            };
          }
        })
      );

      return { data: attachmentsWithUrls, error: null };
    } catch (error) {
      console.error('Error getting attachments:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to get attachments' 
      };
    }
  },

  /**
   * Delete attachment
   */
  async delete(id: string, fileKey: string) {
    try {
      // Delete from S3
      await remove({ key: fileKey });

      // Delete from DynamoDB
      const { data, errors } = await client.models.Attachment.delete({ id });

      if (errors) {
        throw new Error(errors[0].message);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error deleting attachment:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to delete attachment' 
      };
    }
  },

  /**
   * Get download URL for attachment
   */
  async getDownloadUrl(fileKey: string) {
    try {
      const urlResult = await getUrl({
        key: fileKey,
        options: {
          expiresIn: 3600, // 1 hour
        },
      });

      return { url: urlResult.url.toString(), error: null };
    } catch (error) {
      console.error('Error getting download URL:', error);
      return { 
        url: null, 
        error: error instanceof Error ? error.message : 'Failed to get download URL' 
      };
    }
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Get file icon based on file type
   */
  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📽️';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📎';
  },
};
