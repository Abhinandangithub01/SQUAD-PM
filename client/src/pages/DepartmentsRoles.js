import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import toast from 'react-hot-toast';

const DepartmentsRoles = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [expandedDepts, setExpandedDepts] = useState({});
  const [organizationId, setOrganizationId] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const client = generateClient();
      const user = await getCurrentUser();

      // Get user's organization
      const { data: memberships } = await client.models.OrganizationMember.list({
        filter: { userId: { eq: user.userId } }
      });

      if (!memberships || memberships.length === 0) {
        toast.error('No organization found');
        setLoading(false);
        return;
      }

      const orgId = memberships[0].organizationId;
      setOrganizationId(orgId);

      // Fetch departments
      const { data: depts } = await client.models.Department.list({
        filter: { organizationId: { eq: orgId } }
      });

      // Fetch roles for each department
      const deptsWithRoles = await Promise.all(
        (depts || []).map(async (dept) => {
          const { data: roles } = await client.models.DepartmentRole.list({
            filter: { departmentId: { eq: dept.id } }
          });
          return {
            ...dept,
            roles: roles || []
          };
        })
      );

      setDepartments(deptsWithRoles);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (deptId) => {
    setExpandedDepts(prev => ({
      ...prev,
      [deptId]: !prev[deptId]
    }));
  };

  const getLevelBadgeColor = (level) => {
    const colors = {
      JUNIOR: 'bg-gray-100 text-gray-800',
      MID: 'bg-blue-100 text-blue-800',
      SENIOR: 'bg-purple-100 text-purple-800',
      LEAD: 'bg-indigo-100 text-indigo-800',
      MANAGER: 'bg-green-100 text-green-800',
      DIRECTOR: 'bg-yellow-100 text-yellow-800',
      VP: 'bg-orange-100 text-orange-800',
      C_LEVEL: 'bg-red-100 text-red-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Departments & Roles</h1>
              <p className="text-gray-600 mt-1">Manage organizational structure and roles</p>
            </div>
            <button
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Department
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Departments</p>
                <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {departments.reduce((sum, dept) => sum + dept.roles.length, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Departments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {departments.filter(d => d.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Departments List */}
        <div className="space-y-4">
          {departments.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No departments found</p>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Create First Department
              </button>
            </div>
          ) : (
            departments.map((dept) => (
              <div key={dept.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Department Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleDepartment(dept.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      {expandedDepts[dept.id] ? (
                        <ChevronDownIcon className="h-5 w-5 text-gray-400 mr-3" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-gray-400 mr-3" />
                      )}
                      <div className="flex items-center">
                        <div className="p-2 bg-indigo-100 rounded-lg mr-4">
                          <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                          <p className="text-sm text-gray-600">{dept.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        {dept.code}
                      </span>
                      <span className="text-sm text-gray-600">
                        {dept.roles.length} roles
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        dept.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Roles List */}
                {expandedDepts[dept.id] && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Roles in {dept.name}</h4>
                      <button className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center">
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Role
                      </button>
                    </div>

                    {dept.roles.length === 0 ? (
                      <p className="text-gray-500 text-sm">No roles defined</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dept.roles.map((role) => (
                          <div
                            key={role.id}
                            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-medium text-gray-900 text-sm">{role.name}</h5>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelBadgeColor(role.level)}`}>
                                {role.level.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">{role.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartmentsRoles;
