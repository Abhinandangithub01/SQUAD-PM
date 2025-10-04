import React, { useState, useRef } from 'react';
import { 
  PaperClipIcon, 
  XMarkIcon, 
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useMutation } from '@tanstack/react-query';
import amplifyDataService from '../services/amplifyDataService';
import toast from 'react-hot-toast';

const FileUploader = ({ taskId, onUploadComplete, existingFiles = [] }) => {
  const [files, setFiles] = useState(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const iconClass = "h-6 w-6";
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return <PhotoIcon className={`${iconClass} text-blue-500`} />;
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(ext)) {
      return <FilmIcon className={`${iconClass} text-purple-500`} />;
    } else if (['pdf'].includes(ext)) {
      return <DocumentTextIcon className={`${iconClass} text-red-500`} />;
    } else if (['doc', 'docx', 'txt'].includes(ext)) {
      return <DocumentIcon className={`${iconClass} text-blue-600`} />;
    } else {
      return <DocumentIcon className={`${iconClass} text-gray-500`} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      // Upload to S3 via Amplify Storage
      const result = await amplifyDataService.storage.upload({
        file,
        path: `tasks/${taskId}/attachments/${file.name}`,
        onProgress: (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.round((progress.loaded / progress.total) * 100)
          }));
        }
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      return {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: result.url,
        uploaded_at: new Date().toISOString(),
      };
    },
    onSuccess: (uploadedFile) => {
      setFiles(prev => [...prev, uploadedFile]);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[uploadedFile.name];
        return newProgress;
      });
      toast.success(`${uploadedFile.name} uploaded successfully`);
      onUploadComplete?.(uploadedFile);
    },
    onError: (error, file) => {
      toast.error(`Failed to upload ${file.name}`);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });
    },
  });

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (selectedFiles.length === 0) return;

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = selectedFiles.filter(f => f.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed 10MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setUploading(true);

    // Upload files sequentially
    for (const file of selectedFiles) {
      await uploadMutation.mutateAsync(file);
    }

    setUploading(false);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = async (fileId) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    if (window.confirm(`Remove ${file.name}?`)) {
      // Delete from S3
      if (file.url) {
        await amplifyDataService.storage.delete(file.url);
      }
      
      setFiles(files.filter(f => f.id !== fileId));
      toast.success('File removed');
    }
  };

  const handleDownload = (file) => {
    if (file.url) {
      window.open(file.url, '_blank');
    } else if (file.file) {
      // Create download link for local file
      const url = URL.createObjectURL(file.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center cursor-pointer"
        >
          <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Click to upload or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            PDF, DOC, Images, Videos (max 10MB per file)
          </p>
        </label>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{fileName}</span>
                <span className="text-sm text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">
            Attachments ({files.length})
          </h4>
          
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all group"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIcon(file.name)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    {file.uploaded_at && (
                      <>
                        <span>•</span>
                        <span>{formatDateTime(file.uploaded_at)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleDownload(file)}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <ArrowUpTrayIcon className="h-4 w-4 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.id)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {files.length === 0 && Object.keys(uploadProgress).length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <PaperClipIcon className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm">No attachments yet</p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
