import React, { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { 
  ArrowLeftIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  LinkIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PresentationChartBarIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import { uploadData, getUrl, list, remove } from 'aws-amplify/storage';
import { useAuth } from '../contexts/AuthContext';
import { formatFileSize, getFileIcon, formatDate } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Avatar from '../components/Avatar';
import toast from 'react-hot-toast';

const Files = () => {
  const { projectId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const queryClient = useQueryClient();

  const { user } = useAuth();

  // Fetch files from S3
  const { data: filesData, isLoading, refetch } = useQuery({
    queryKey: ['files', 'project', projectId, searchQuery, typeFilter],
    queryFn: async () => {
      try {
        // List files from S3
        const result = await list({
          prefix: `projects/${projectId}/files/`,
        });
        
        // Transform S3 items to file objects
        const files = await Promise.all(
          (result.items || []).map(async (item) => {
            const url = await getUrl({ key: item.key });
            return {
              id: item.key,
              name: item.key.split('/').pop(),
              size: item.size,
              type: item.key.split('.').pop(),
              uploaded_at: item.lastModified,
              uploaded_by: user?.username,
              url: url.url.toString(),
            };
          })
        );
        
        // Apply filters
        let filteredFiles = files;
        if (searchQuery) {
          filteredFiles = files.filter(f => 
            f.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        if (typeFilter) {
          filteredFiles = filteredFiles.filter(f => f.type === typeFilter);
        }
        
        return { files: filteredFiles };
      } catch (error) {
        console.error('Error fetching files:', error);
        return { files: [] };
      }
    },
    enabled: !!projectId,
  });

  // Upload files mutation to S3
  const uploadFilesMutation = useMutation({
    mutationFn: async (files) => {
      const uploadPromises = files.map(async (file) => {
        try {
          // Upload to S3
          const result = await uploadData({
            key: `projects/${projectId}/files/${Date.now()}-${file.name}`,
            data: file,
            options: {
              contentType: file.type,
            }
          }).result;
          
          return result;
        } catch (error) {
          console.error('Upload error:', error);
          throw error;
        }
      });
      
      return Promise.all(uploadPromises);
    },
    onSuccess: () => {
      refetch(); // Refresh file list
      toast.success('Files uploaded successfully to S3');
    },
    onError: (error) => {
      toast.error('Failed to upload files: ' + error.message);
    },
  });

  // Delete file mutation from S3
  const deleteFileMutation = useMutation({
    mutationFn: async (fileKey) => {
      await remove({ key: fileKey });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['files', 'project', projectId]);
      toast.success('File deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete file');
    },
  });

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      uploadFilesMutation.mutate(acceptedFiles);
    }
  }, [uploadFilesMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleSelectFile = (fileId) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === filesData?.files?.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filesData?.files?.map(file => file.id) || []));
    }
  };

  const handleDeleteFile = (fileId, fileName) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      deleteFileMutation.mutate(fileId);
    }
  };

  const handleDownloadFile = (fileId, fileName) => {
    const link = document.createElement('a');
    link.href = `/api/files/${fileId}/download`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={`/projects/${projectId}`}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Files & Attachments</h1>
            <p className="text-gray-600">Manage project files and documents</p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop files here, or click to select files'
          }
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Maximum file size: 10MB
        </p>
        {uploadFilesMutation.isLoading && (
          <div className="mt-4">
            <LoadingSpinner size="sm" />
            <p className="text-sm text-gray-600 mt-2">Uploading files...</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="w-full sm:w-80 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input min-w-[120px]"
          >
            <option value="">All Types</option>
            <option value="image">Images</option>
            <option value="application">Documents</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
          </select>
          <button className="btn-outline flex items-center px-8 whitespace-nowrap min-w-[140px]">
            <FunnelIcon className="h-4 w-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedFiles.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary-900">
              {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button className="btn-outline btn-sm">
                <LinkIcon className="h-4 w-4 mr-2" />
                Link to Task
              </button>
              <button className="btn-danger btn-sm">
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedFiles(new Set())}
                className="btn-outline btn-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files Grid/List */}
      <div className="card">
        {filesData?.files && filesData.files.length > 0 ? (
          <>
            {/* Table Header */}
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedFiles.size === filesData.files.length && filesData.files.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 mr-4"
                />
                <div className="grid grid-cols-12 gap-4 w-full text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-2">Uploaded By</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-1">Actions</div>
                </div>
              </div>
            </div>

            {/* Files List */}
            <div className="divide-y divide-gray-200">
              {filesData.files.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  isSelected={selectedFiles.has(file.id)}
                  onSelect={() => handleSelectFile(file.id)}
                  onDownload={() => handleDownloadFile(file.id, file.original_name)}
                  onDelete={() => handleDeleteFile(file.id, file.original_name)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchQuery || typeFilter ? 'No files found' : 'No files uploaded'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || typeFilter
                ? 'Try adjusting your search or filters'
                : 'Upload your first file to get started'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to render file icons
const renderFileIcon = (iconType) => {
  const iconClass = "h-6 w-6";
  switch (iconType) {
    case 'photo':
      return <PhotoIcon className={`${iconClass} text-green-500`} />;
    case 'video':
      return <VideoCameraIcon className={`${iconClass} text-red-500`} />;
    case 'music':
      return <MusicalNoteIcon className={`${iconClass} text-purple-500`} />;
    case 'pdf':
      return <DocumentIcon className={`${iconClass} text-red-600`} />;
    case 'document-text':
      return <DocumentTextIcon className={`${iconClass} text-blue-500`} />;
    case 'chart':
      return <ChartBarIcon className={`${iconClass} text-green-600`} />;
    case 'presentation':
      return <PresentationChartBarIcon className={`${iconClass} text-orange-500`} />;
    case 'archive':
      return <ArchiveBoxIcon className={`${iconClass} text-yellow-600`} />;
    default:
      return <DocumentIcon className={`${iconClass} text-gray-500`} />;
  }
};

const FileRow = ({ file, isSelected, onSelect, onDownload, onDelete }) => {
  const fileIconType = getFileIcon(file.mime_type);

  return (
    <div className={`px-6 py-4 hover:bg-gray-50 ${isSelected ? 'bg-primary-50' : ''}`}>
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="rounded border-gray-300 mr-4"
        />
        <div className="grid grid-cols-12 gap-4 w-full items-center">
          {/* Name */}
          <div className="col-span-5 flex items-center space-x-3">
            <div className="flex-shrink-0">{renderFileIcon(fileIconType)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.original_name}
              </p>
              <p className="text-xs text-gray-500">{file.mime_type}</p>
            </div>
          </div>

          {/* Size */}
          <div className="col-span-2">
            <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
          </div>

          {/* Uploaded By */}
          <div className="col-span-2">
            <div className="flex items-center space-x-2">
              <div className="text-sm text-gray-900">{file.uploaded_by_name}</div>
            </div>
          </div>

          {/* Date */}
          <div className="col-span-2">
            <p className="text-sm text-gray-500">{formatDate(file.created_at)}</p>
          </div>

          {/* Actions */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={onDownload}
                className="p-1 text-gray-400 hover:text-primary-600 rounded"
                title="Download"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 text-gray-400 hover:text-red-600 rounded"
                title="Delete"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Tasks */}
      {file.linked_tasks > 0 && (
        <div className="mt-2 ml-12">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            <LinkIcon className="h-3 w-3 mr-1" />
            Linked to {file.linked_tasks} task{file.linked_tasks !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default Files;
