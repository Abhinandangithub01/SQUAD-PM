'use client';

import { useState, useEffect, useRef } from 'react';
import { attachmentService } from '@/services/attachmentService';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { 
  PaperclipIcon, 
  UploadIcon, 
  DownloadIcon, 
  Trash2Icon, 
  FileIcon,
  XIcon,
} from 'lucide-react';

interface AttachmentsSectionProps {
  taskId: string;
}

export default function AttachmentsSection({ taskId }: AttachmentsSectionProps) {
  const { user } = useAuthContext();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadAttachments();
  }, [taskId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const { data, error } = await attachmentService.getByTask(taskId);
      
      if (error) {
        toast.error(error);
        return;
      }

      setAttachments(data || []);
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast.error('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 50MB');
      return;
    }

    if (!user?.id) {
      toast.error('You must be logged in to upload files');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate progress (since uploadData doesn't provide progress callback in this version)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const { data, error } = await attachmentService.uploadFile({
        file,
        taskId,
        uploadedById: user.id,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        toast.error(error);
        return;
      }

      setAttachments([data, ...attachments]);
      toast.success('File uploaded successfully!');

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleDownload = async (attachment: any) => {
    try {
      if (attachment.downloadUrl) {
        window.open(attachment.downloadUrl, '_blank');
      } else {
        toast.error('Download URL not available');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (attachment: any) => {
    if (!confirm(`Are you sure you want to delete ${attachment.fileName}?`)) return;

    try {
      const { error } = await attachmentService.delete(attachment.id, attachment.fileUrl);

      if (error) {
        toast.error(error);
        return;
      }

      setAttachments(attachments.filter((a) => a.id !== attachment.id));
      toast.success('File deleted successfully!');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <PaperclipIcon className="w-5 h-5" />
          Attachments
        </h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          <UploadIcon className="w-4 h-4" />
          Upload File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Uploading...</span>
            <span className="text-sm text-blue-700">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <PaperclipIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No attachments yet.</p>
          <p className="text-sm mt-1">Upload files to share with your team.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              onDownload={handleDownload}
              onDelete={handleDelete}
              canDelete={attachment.uploadedById === user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AttachmentItem({ attachment, onDownload, onDelete, canDelete }: any) {
  const fileIcon = attachmentService.getFileIcon(attachment.fileType);
  const fileSize = attachmentService.formatFileSize(attachment.fileSize);

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="text-2xl flex-shrink-0">{fileIcon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {attachment.fileName}
          </p>
          <p className="text-xs text-gray-500">
            {fileSize} • {new Date(attachment.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onDownload(attachment)}
          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
          title="Download"
        >
          <DownloadIcon className="w-4 h-4" />
        </button>
        {canDelete && (
          <button
            onClick={() => onDelete(attachment)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2Icon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
