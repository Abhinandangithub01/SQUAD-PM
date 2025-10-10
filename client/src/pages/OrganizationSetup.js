import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Rocket, Check } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import toast from 'react-hot-toast';

const OrganizationSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
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
      features: ['Up to 5 users', 'Up to 3 projects', 'Basic features'],
      maxUsers: 5,
      maxProjects: 3,
    },
    { 
      value: 'STARTER', 
      label: 'Starter', 
      price: '$29',
      features: ['Up to 20 users', 'Unlimited projects', 'Advanced features'],
      maxUsers: 20,
      maxProjects: 999,
    },
    { 
      value: 'PROFESSIONAL', 
      label: 'Professional', 
      price: '$99',
      features: ['Up to 100 users', 'Unlimited projects', 'Premium features', 'Priority support'],
      maxUsers: 100,
      maxProjects: 999,
    },
    { 
      value: 'ENTERPRISE', 
      label: 'Enterprise', 
      price: 'Custom',
      features: ['Unlimited users', 'Unlimited projects', 'All features', '24/7 support', 'Custom integrations'],
      maxUsers: 999999,
      maxProjects: 999999,
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
    
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    
    try {
      const client = generateClient();
      const user = await getCurrentUser();
      
      const selectedPlan = plans.find(p => p.value === formData.plan);
      
      // Create organization
      const { data: organization } = await client.models.Organization.create({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        industry: formData.industry,
        size: formData.size,
        plan: formData.plan,
        ownerId: user.userId,
        billingEmail: user.signInDetails?.loginId,
        maxUsers: selectedPlan.maxUsers,
        maxProjects: selectedPlan.maxProjects,
        isActive: true,
        settings: JSON.stringify({
          theme: 'light',
          notifications: true,
        }),
      });

      // Create organization member for owner
      await client.models.OrganizationMember.create({
        organizationId: organization.id,
        userId: user.userId,
        role: 'OWNER',
        joinedAt: new Date().toISOString(),
      });

      // Create user profile if doesn't exist
      try {
        await client.models.UserProfile.create({
          email: user.signInDetails?.loginId,
          firstName: formData.name.split(' ')[0] || 'User',
          lastName: formData.name.split(' ')[1] || '',
          role: 'ADMIN',
          isActive: true,
          lastLoginAt: new Date().toISOString(),
        });
      } catch (error) {
        // Profile might already exist
        console.log('User profile may already exist:', error);
      }

      toast.success('Organization created successfully!');
      navigate('/modern-dashboard');
      
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                } transition-all`}>
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-20 h-1 ${step > s ? 'bg-indigo-600' : 'bg-gray-200'} transition-all`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 px-4">
            <span className="text-sm text-gray-600">Company Info</span>
            <span className="text-sm text-gray-600">Team Size</span>
            <span className="text-sm text-gray-600">Choose Plan</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
              {step === 1 && <Building2 className="w-8 h-8 text-indigo-600" />}
              {step === 2 && <Users className="w-8 h-8 text-indigo-600" />}
              {step === 3 && <Rocket className="w-8 h-8 text-indigo-600" />}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 1 && 'Create Your Organization'}
              {step === 2 && 'Tell Us About Your Team'}
              {step === 3 && 'Choose Your Plan'}
            </h1>
            <p className="text-gray-600">
              {step === 1 && 'Let\'s start by setting up your company profile'}
              {step === 2 && 'Help us understand your team size'}
              {step === 3 && 'Select the plan that fits your needs'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Company Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Acme Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Slug * (URL-friendly name)
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 text-sm mr-2">squadpm.com/</span>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      required
                      pattern="[a-z0-9-]+"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="acme-inc"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select industry</option>
                    {industries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Tell us about your company..."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Team Size */}
            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sizes.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, size: size.value }))}
                    className={`p-6 border-2 rounded-xl text-left transition-all ${
                      formData.size === size.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="text-4xl mb-2">{size.icon}</div>
                    <div className="font-semibold text-gray-900">{size.label}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 3: Choose Plan */}
            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan) => (
                  <button
                    key={plan.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, plan: plan.value }))}
                    className={`p-6 border-2 rounded-xl text-left transition-all ${
                      formData.plan === plan.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{plan.label}</h3>
                      <span className="text-2xl font-bold text-indigo-600">{plan.price}</span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`${step === 1 ? 'ml-auto' : ''} px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? 'Creating...' : step === 3 ? 'Create Organization' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrganizationSetup;
