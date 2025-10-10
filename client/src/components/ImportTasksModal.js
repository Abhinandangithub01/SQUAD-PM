import React, { useState, useCallback } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { uploadData } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';

const ImportTasksModal = ({ isOpen, onClose, projectId, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      if (!validTypes.includes(selectedFile.type) && 
          !selectedFile.name.endsWith('.xlsx') && 
          !selectedFile.name.endsWith('.xls') &&
          !selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a valid Excel file (.xlsx, .xls, or .csv)');
        return;
      }

      setFile(selectedFile);
      setImportResults(null);
      setShowResults(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      setUploading(true);

      // Upload file to S3 using Amplify Storage
      const fileKey = `imports/${projectId}/${Date.now()}_${file.name}`;
      
      const result = await uploadData({
        key: fileKey,
        data: file,
        options: {
          contentType: file.type,
        }
      }).result;

      console.log('File uploaded to S3:', result);

      setUploading(false);
      setImporting(true);

      // Call the GraphQL mutation to import tasks
      const client = generateClient();
      
      const importResult = await client.graphql({
        query: `
          mutation ImportTasks($projectId: ID!, $fileKey: String!) {
            importTasksFromExcel(projectId: $projectId, fileKey: $fileKey) {
              success
              failed
              errors {
                row
                error
                taskName
              }
              createdTasks {
                id
                title
                status
                priority
              }
            }
          }
        `,
        variables: {
          projectId: projectId,
          fileKey: result.key
        }
      });

      setImporting(false);
      const data = importResult.data.importTasksFromExcel;
      setImportResults(data);
      setShowResults(true);

      if (data.success > 0) {
        toast.success(`Successfully imported ${data.success} tasks!`);
        if (onImportComplete) {
          onImportComplete(data);
        }
      }

      if (data.failed > 0) {
        toast.error(`Failed to import ${data.failed} tasks`);
      }

    } catch (error) {
      console.error('Import error:', error);
      setUploading(false);
      setImporting(false);
      toast.error(error.message || 'Failed to import tasks');
    }
  };

  const downloadTemplate = () => {
    // Create a sample Excel template
    const templateData = [
      {
        'Task Name': 'Sample Task',
        'Owner': 'John Doe',
        'Custom Status': 'To Do',
        'Tags': 'Development, Backend',
        'Start Date': '2024-01-01',
        'Due Date': '2024-01-15',
        'Duration': '40',
        'Priority': 'High',
        'Created By': 'Admin User',
        '% Completed': '0',
        'Completion Date': '',
        'Work Hours': '0',
        'Billing Type': 'Billable',
        'Description': 'This is a sample task description'
      }
    ];

    // Convert to CSV
    const headers = Object.keys(templateData[0]);
    const csvContent = [
      headers.join(','),
      templateData.map(row => headers.map(header => `"${row[header]}"`).join(',')).join('\n')
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'task_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Template downloaded!');
  };

  const handleClose = () => {
    setFile(null);
    setImportResults(null);
    setShowResults(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Import Tasks from Excel</h2>
                <p className="text-sm text-gray-500">Upload your Zoho Projects export file</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!showResults ? (
              <>
                {/* Instructions */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Import Instructions:</h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Download the template or use your Zoho Projects export</li>
                    <li>Ensure your Excel file has the required columns</li>
                    <li>Upload the file and click "Import Tasks"</li>
                    <li>Review the import results</li>
                  </ol>
                </div>

                {/* Template Download */}
                <div className="mb-6">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Template</span>
                  </button>
                </div>

                {/* Required Columns */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Required Columns:</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Task Name</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Owner</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Custom Status</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Priority</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Due Date</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Tags</span>
                    </div>
                  </div>
                </div>

                {/* File Upload */}
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  {file ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">
                        {isDragActive
                          ? 'Drop the file here'
                          : 'Drag and drop your Excel file here, or click to browse'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports .xlsx, .xls, and .csv files
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Import Results */
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">
                        Successfully imported {importResults.success} tasks
                      </p>
                      {importResults.failed > 0 && (
                        <p className="text-sm text-green-700">
                          {importResults.failed} tasks failed to import
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {importResults.errors && importResults.errors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900 mb-2">Import Errors:</p>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {importResults.errors.map((error, index) => (
                            <div key={index} className="text-sm text-red-800">
                              <span className="font-medium">Row {error.row}:</span> {error.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {importResults.createdTasks && importResults.createdTasks.length > 0 && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="font-medium text-gray-900 mb-3">Imported Tasks:</p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {importResults.createdTasks.slice(0, 10).map((task, index) => (
                        <div key={index} className="text-sm text-gray-700 flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{task.title}</span>
                        </div>
                      ))}
                      {importResults.createdTasks.length > 10 && (
                        <p className="text-sm text-gray-500 italic">
                          And {importResults.createdTasks.length - 10} more...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
            {!showResults ? (
              <>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                  disabled={uploading || importing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!file || uploading || importing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
                >
                  {uploading || importing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{uploading ? 'Uploading...' : 'Importing...'}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Import Tasks</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportTasksModal;
