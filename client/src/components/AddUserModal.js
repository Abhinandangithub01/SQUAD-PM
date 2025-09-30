import React, { useState } from 'react';
import {
  Modal,
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  PasswordInput,
} from '@mantine/core';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import {
  UserIcon,
  EnvelopeIcon,
  KeyIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const AddUserModal = ({ opened, onClose, onSubmit }) => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'member',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'member', label: 'Member' },
    { value: 'viewer', label: 'Viewer' },
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Error adding user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'member',
    });
    setErrors({});
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <MantineProvider>
      <Modal
        opened={opened}
        onClose={handleClose}
        title="Add New User"
        size="md"
        centered
      >
        <Stack gap="md">
          <Group grow>
            <TextInput
              label="First Name"
              placeholder="John"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              error={errors.first_name}
              leftSection={<UserIcon className="h-4 w-4" />}
              required
            />
            <TextInput
              label="Last Name"
              placeholder="Doe"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              error={errors.last_name}
              leftSection={<UserIcon className="h-4 w-4" />}
              required
            />
          </Group>

          <TextInput
            label="Email"
            placeholder="john.doe@example.com"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            leftSection={<EnvelopeIcon className="h-4 w-4" />}
            required
          />

          <PasswordInput
            label="Password"
            placeholder="Enter password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            error={errors.password}
            leftSection={<KeyIcon className="h-4 w-4" />}
            required
          />

          <Select
            label="Role"
            placeholder="Select role"
            value={formData.role}
            onChange={(value) => handleChange('role', value)}
            data={roles}
            leftSection={<BriefcaseIcon className="h-4 w-4" />}
            required
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={isSubmitting}
            >
              Add User
            </Button>
          </Group>
        </Stack>
      </Modal>
    </MantineProvider>
  );
};

export default AddUserModal;
