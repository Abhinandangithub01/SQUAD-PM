import React, { useState } from 'react';
import { 
  SwatchIcon,
  PhotoIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

const ThemeSettings = ({ isOpen, onClose }) => {
  const { currentTheme, themes, customBranding, changeTheme, updateBranding } = useTheme();
  const [brandingForm, setBrandingForm] = useState(customBranding);

  const handleThemeChange = (themeName) => {
    changeTheme(themeName);
    toast.success(`Theme changed to ${themes[themeName].name}`);
  };

  const handleBrandingSubmit = (e) => {
    e.preventDefault();
    updateBranding(brandingForm);
    toast.success('Branding updated successfully!');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBrandingForm(prev => ({
          ...prev,
          logo: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <SwatchIcon className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">Theme & Branding</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Theme Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Theme</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    currentTheme === key
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Theme Preview */}
                  <div className="space-y-2">
                    <div className="flex space-x-1">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.primary[500] }}
                      />
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.accent }}
                      />
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.background }}
                      />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{theme.name}</p>
                  </div>
                  
                  {currentTheme === key && (
                    <div className="absolute top-2 right-2">
                      <CheckIcon className="h-4 w-4 text-primary-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Branding */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Branding</h3>
            <form onSubmit={handleBrandingSubmit} className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BuildingOfficeIcon className="h-4 w-4 inline mr-2" />
                  Company Name
                </label>
                <input
                  type="text"
                  value={brandingForm.companyName}
                  onChange={(e) => setBrandingForm(prev => ({
                    ...prev,
                    companyName: e.target.value
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Your Company Name"
                />
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PhotoIcon className="h-4 w-4 inline mr-2" />
                  Company Logo
                </label>
                <div className="flex items-center space-x-4">
                  {brandingForm.logo && (
                    <img
                      src={brandingForm.logo}
                      alt="Company Logo"
                      className="h-12 w-12 object-contain rounded-lg border border-gray-200"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a logo (PNG, JPG, SVG recommended)
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                  {brandingForm.logo ? (
                    <img
                      src={brandingForm.logo}
                      alt="Logo"
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-primary-100 rounded flex items-center justify-center">
                      <BuildingOfficeIcon className="h-5 w-5 text-primary-600" />
                    </div>
                  )}
                  <span className="font-semibold text-gray-900">
                    {brandingForm.companyName}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
