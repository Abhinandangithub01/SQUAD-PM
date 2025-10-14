/**
 * Two-Factor Authentication Settings Component
 */

import React, { useState, useEffect } from 'react';
import {
  updateMFAPreference,
  setUpTOTP,
  verifyTOTPSetup,
  fetchMFAPreference,
} from 'aws-amplify/auth';
import QRCode from 'qrcode';

export default function TwoFactorAuth() {
  const [mfaPreference, setMfaPreference] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(null); // 'sms' or 'totp'
  const [totpCode, setTotpCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadMFAPreference();
  }, []);

  const loadMFAPreference = async () => {
    try {
      setLoading(true);
      const preference = await fetchMFAPreference();
      setMfaPreference(preference);
    } catch (err) {
      console.error('Error loading MFA preference:', err);
      setError('Failed to load 2FA settings');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableSMS = async () => {
    try {
      setLoading(true);
      setError('');
      await updateMFAPreference({ sms: 'PREFERRED' });
      setSuccess('SMS 2FA enabled successfully!');
      await loadMFAPreference();
      setSetupMode(null);
    } catch (err) {
      console.error('Error enabling SMS MFA:', err);
      setError(err.message || 'Failed to enable SMS 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTOTPSetup = async () => {
    try {
      setLoading(true);
      setError('');
      const totpSetupDetails = await setUpTOTP();
      const secret = totpSetupDetails.sharedSecret;
      setTotpSecret(secret);

      // Generate QR code
      const otpauthUrl = `otpauth://totp/ProjectHub:${totpSetupDetails.username}?secret=${secret}&issuer=ProjectHub`;
      const qrCode = await QRCode.toDataURL(otpauthUrl);
      setQrCodeUrl(qrCode);
      setSetupMode('totp');
    } catch (err) {
      console.error('Error setting up TOTP:', err);
      setError(err.message || 'Failed to start TOTP setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTOTP = async () => {
    try {
      setLoading(true);
      setError('');
      await verifyTOTPSetup({ code: totpCode });
      await updateMFAPreference({ totp: 'PREFERRED' });
      setSuccess('Authenticator app enabled successfully!');
      await loadMFAPreference();
      setSetupMode(null);
      setTotpCode('');
    } catch (err) {
      console.error('Error verifying TOTP:', err);
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setLoading(true);
      setError('');
      await updateMFAPreference({ sms: 'DISABLED', totp: 'DISABLED' });
      setSuccess('2FA disabled successfully');
      await loadMFAPreference();
    } catch (err) {
      console.error('Error disabling MFA:', err);
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !setupMode) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Two-Factor Authentication</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {!setupMode && (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-semibold mb-2">Current Status</h3>
            <div className="flex items-center">
              {mfaPreference?.enabled ? (
                <>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Enabled
                  </span>
                  <span className="ml-3 text-gray-600">
                    {mfaPreference.preferred === 'SMS' && 'SMS Authentication'}
                    {mfaPreference.preferred === 'TOTP' && 'Authenticator App'}
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Disabled
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">SMS Authentication</h4>
                  <p className="text-sm text-gray-600">
                    Receive verification codes via text message
                  </p>
                </div>
                <button
                  onClick={handleEnableSMS}
                  disabled={loading || mfaPreference?.preferred === 'SMS'}
                  className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mfaPreference?.preferred === 'SMS' ? 'Enabled' : 'Enable'}
                </button>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Authenticator App</h4>
                  <p className="text-sm text-gray-600">
                    Use an app like Google Authenticator or Authy
                  </p>
                </div>
                <button
                  onClick={handleStartTOTPSetup}
                  disabled={loading || mfaPreference?.preferred === 'TOTP'}
                  className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mfaPreference?.preferred === 'TOTP' ? 'Enabled' : 'Setup'}
                </button>
              </div>
            </div>
          </div>

          {mfaPreference?.enabled && (
            <div className="pt-4 border-t">
              <button
                onClick={handleDisable2FA}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Disable 2FA
              </button>
            </div>
          )}
        </div>
      )}

      {setupMode === 'totp' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Setup Authenticator App</h3>
            <p className="text-sm text-gray-600 mb-6">
              Scan this QR code with your authenticator app
            </p>
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-4" />
            )}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-xs text-gray-600 mb-2">Or enter this code manually:</p>
              <code className="text-sm font-mono bg-white px-3 py-2 rounded border">
                {totpSecret}
              </code>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter verification code from your app
            </label>
            <input
              type="text"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              placeholder="000000"
              maxLength="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleVerifyTOTP}
              disabled={loading || totpCode.length !== 6}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
            <button
              onClick={() => {
                setSetupMode(null);
                setTotpCode('');
                setQrCodeUrl('');
              }}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">Why enable 2FA?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Adds an extra layer of security to your account</li>
          <li>• Protects against unauthorized access</li>
          <li>• Required for certain enterprise features</li>
        </ul>
      </div>
    </div>
  );
}
