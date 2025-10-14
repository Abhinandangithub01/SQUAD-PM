import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Rocket, Check, X } from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import toast from 'react-hot-toast';

const OrganizationSetupFlow = () => {
  const navigate = useNavigate();
  const { createOrganization, loading } = useOrganization();
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    industry: '',
    size: 'SMALL',
    plan: 'FREE',
  });

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
    'Manufacturing', 'Consulting', 'Marketing', 'Real Estate', 'Other'
  ];

  const sizes = [
    { value: 'SMALL', label: '1-10 employees', icon: '👥' },
    { value: 'MEDIUM', label: '11-50 employees', icon: '👨‍👩‍👧‍👦' },
    { value: 'LARGE', label: '51-200 employees', icon: '🏢' },
    { value: 'ENTERPRISE', label: '200+ employees', icon: '🏛️' },
  ];

  const plans = [
    { 
      value: 'FREE', 
      label: 'Free', 
      price: '$0',
      features: ['Up to 5 users', 'Up to 3 projects', 'Basic features', '1 GB storage'],
      maxUsers: 5,
      maxProjects: 3,
    },
    { 
      value: 'STARTER', 
      label: 'Starter', 
      price: '$29',
      features: ['Up to 20 users', 'Unlimited projects', 'Advanced features', '10 GB storage'],
      maxUsers: 20,
      maxProjects: 999,
    },
    { 
      value: 'PROFESSIONAL', 
      label: 'Professional', 
      price: '$99',
      features: ['Up to 100 users', 'Unlimited projects', 'All features', '100 GB storage', 'Priority support'],
      maxUsers: 100,
      maxProjects: 999,
    },
    { 
      value: 'ENTERPRISE', 
      label: 'Enterprise', 
      price: 'Custom',
      features: ['Unlimited users', 'Unlimited projects', 'All features', '1 TB storage', '24/7 support', 'Custom integrations'],
      maxUsers: 999,
      maxProjects: 999,
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate slug from name
      ...(name === 'name' && { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug) {
      toast.error('Please fill in all required fields');
      return;
    }

    const result = await createOrganization(formData);
    
    if (result.success) {
      toast.success('Organization created successfully!');
      navigate('/dashboard');
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Welcome to ProjectHub!</h1>
            <button
              onClick={handleSkip}
              className="text-white/80 hover:text-white text-sm flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Skip for now
            </button>
          </div>
          <p className="text-blue-100">Let's set up your organization in just a few steps</p>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-4 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s ? 'bg-white text-blue-600' : 'bg-blue-500/30 text-white/60'
                } font-semibold transition-all`}>
                  {step > s ? <Check className="h-5 w-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-white' : 'bg-blue-500/30'
                  } transition-all`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Organization Details</h2>
                  <p className="text-gray-600">Tell us about your organization</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Acme Corporation"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Slug *
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 text-sm mr-2">projecthub.com/</span>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="acme-corp"
                    pattern="[a-z0-9-]+"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Only lowercase letters, numbers, and hyphens</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of your organization..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select an industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Team Size */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Team Size</h2>
                  <p className="text-gray-600">How many people are in your organization?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sizes.map(size => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, size: size.value }))}
                    className={`p-6 border-2 rounded-xl transition-all ${
                      formData.size === size.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">{size.icon}</div>
                    <div className="font-semibold text-gray-900">{size.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Choose Plan */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Rocket className="h-8 w-8 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
                  <p className="text-gray-600">Start with a 14-day free trial</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.map(plan => (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, plan: plan.value }))}
                    className={`p-6 border-2 rounded-xl transition-all text-left ${
                      formData.plan === plan.value
                        ? 'border-blue-600 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{plan.label}</h3>
                      <span className="text-2xl font-bold text-blue-600">{plan.price}</span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
              >
                ← Back
              </button>
            )}
            
            <div className="flex-1" />
            
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && (!formData.name || !formData.slug)}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Continue →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Rocket className="h-5 w-5" />
                    Create Organization
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizationSetupFlow;
