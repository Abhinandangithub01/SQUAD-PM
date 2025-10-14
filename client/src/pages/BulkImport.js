/**
 * Bulk Import Page
 * Import tasks from CSV or JSON
 */

import React, { useState } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { useAuth } from '../contexts/AuthContext';

export default function BulkImport() {
  const { organization } = useOrganization();
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const tasks = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const task = {};
      
      headers.forEach((header, index) => {
        task[header] = values[index] || '';
      });

      if (task.title) {
        tasks.push(task);
      }
    }

    return tasks;
  };

  const handleImport = async () => {
    if (!file || !projectId) {
      setError('Please select a file and project');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const text = await file.text();
      let tasks;

      if (format === 'csv') {
        tasks = parseCSV(text);
      } else {
        tasks = JSON.parse(text);
      }

      // Call bulk import Lambda
      const response = await fetch('/api/bulkTaskImport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks,
          organizationId: organization.id,
          projectId,
          createdById: user.id,
          format,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import tasks');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'title,description,status,priority,assignedToId,dueDate,estimatedHours,tags\n' +
      'Example Task 1,Task description,TODO,HIGH,,2025-12-31,8,"tag1,tag2"\n' +
      'Example Task 2,Another task,IN_PROGRESS,MEDIUM,,2025-11-30,4,tag3';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'task_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bulk Import Tasks</h1>
        <p className="mt-2 text-gray-600">Import multiple tasks from CSV or JSON files</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {results && (
        <div className="mb-6 p-6 bg-white shadow rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Import Results</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{results.summary?.total || 0}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{results.summary?.success || 0}</div>
              <div className="text-sm text-gray-600">Success</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600">{results.summary?.failed || 0}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>

          {results.results?.failed?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-red-700 mb-2">Failed Imports:</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.results.failed.map((item, index) => (
                  <div key={index} className="p-3 bg-red-50 rounded text-sm">
                    <div className="font-medium">{item.data?.title || 'Unknown'}</div>
                    <div className="text-red-600">{item.error}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Format
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="mr-2"
                />
                CSV
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="json"
                  checked={format === 'json'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="mr-2"
                />
                JSON
              </label>
            </div>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Project *
            </label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter project ID"
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept={format === 'csv' ? '.csv' : '.json'}
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  {file ? file.name : `Click to upload ${format.toUpperCase()} file`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  or drag and drop
                </p>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={loading || !file || !projectId}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Importing...' : 'Import Tasks'}
            </button>
            <button
              onClick={downloadTemplate}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-3">Import Instructions</h4>
        
        <div className="space-y-3 text-sm text-blue-800">
          <div>
            <h5 className="font-semibold mb-1">CSV Format:</h5>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>First row must contain column headers</li>
              <li>Required column: <code className="bg-blue-100 px-1 rounded">title</code></li>
              <li>Optional columns: description, status, priority, assignedToId, dueDate, estimatedHours, tags</li>
              <li>Status values: TODO, IN_PROGRESS, DONE</li>
              <li>Priority values: LOW, MEDIUM, HIGH, URGENT</li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold mb-1">JSON Format:</h5>
            <pre className="bg-blue-100 p-3 rounded text-xs overflow-x-auto">
{`[
  {
    "title": "Task 1",
    "description": "Description",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2025-12-31",
    "estimatedHours": 8
  }
]`}
            </pre>
          </div>

          <div>
            <h5 className="font-semibold mb-1">Tips:</h5>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Download the template to see the correct format</li>
              <li>Maximum 1000 tasks per import</li>
              <li>Tasks are processed in batches of 25</li>
              <li>Failed imports will be reported with error details</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
