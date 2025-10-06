import { uploadData, getUrl, remove, list } from 'aws-amplify/storage';

/**
 * Service for handling file uploads to AWS S3
 */
export const uploadService = {
  /**
   * Upload a file to S3
   * @param {File} file - The file to upload
   * @param {string} folder - The folder path in S3
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async uploadFile(file, folder = 'uploads') {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${folder}/${timestamp}-${sanitizedName}`;

      console.log('Uploading file:', fileName);

      // Upload to S3
      const result = await uploadData({
        path: fileName,
        data: file,
        options: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
          },
        },
      }).result;

      console.log('Upload successful:', result);

      // Get the file URL
      const url = await this.getFileUrl(result.path);

      return {
        success: true,
        data: {
          key: result.path,
          url: url,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        },
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload file',
      };
    }
  },

  /**
   * Get a signed URL for a file
   * @param {string} key - The S3 key/path
   * @returns {Promise<string|null>}
   */
  async getFileUrl(key) {
    try {
      const result = await getUrl({
        path: key,
        options: {
          expiresIn: 3600, // URL expires in 1 hour
        },
      });
      return result.url.toString();
    } catch (error) {
      console.error('Get URL error:', error);
      return null;
    }
  },

  /**
   * Delete a file from S3
   * @param {string} key - The S3 key/path
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteFile(key) {
    try {
      await remove({ path: key });
      console.log('File deleted:', key);
      return { success: true };
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete file',
      };
    }
  },

  /**
   * List files in a folder
   * @param {string} folder - The folder path
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  async listFiles(folder = 'uploads') {
    try {
      const result = await list({
        path: folder,
      });

      const files = await Promise.all(
        result.items.map(async (item) => ({
          key: item.path,
          size: item.size,
          lastModified: item.lastModified,
          url: await this.getFileUrl(item.path),
        }))
      );

      return {
        success: true,
        data: files,
      };
    } catch (error) {
      console.error('List files error:', error);
      return {
        success: false,
        error: error.message || 'Failed to list files',
      };
    }
  },

  /**
   * Upload avatar image
   * @param {File} file - The avatar image file
   * @param {string} userId - The user ID
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async uploadAvatar(file, userId) {
    try {
      // Validate image file
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate size (max 5MB for avatars)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Avatar size exceeds 5MB limit');
      }

      return await this.uploadFile(file, `avatars/${userId}`);
    } catch (error) {
      console.error('Avatar upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload avatar',
      };
    }
  },

  /**
   * Upload task attachment
   * @param {File} file - The attachment file
   * @param {string} taskId - The task ID
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async uploadTaskAttachment(file, taskId) {
    return await this.uploadFile(file, `tasks/${taskId}/attachments`);
  },

  /**
   * Upload chat file
   * @param {File} file - The chat file
   * @param {string} channelId - The channel ID
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async uploadChatFile(file, channelId) {
    return await this.uploadFile(file, `chat/${channelId}/files`);
  },
};

export default uploadService;
