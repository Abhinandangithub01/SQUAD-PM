import React, { useState } from 'react';
import {
  Table,
  ScrollArea,
  UnstyledButton,
  Group,
  Text,
  TextInput,
  rem,
  Badge,
  Avatar as MantineAvatar,
  Menu,
  ActionIcon,
  Select,
  Button,
} from '@mantine/core';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import {
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';

const UsersTable = ({ users = [], onUpdateUser, onDeleteUser, onInviteUser }) => {
  const { isDarkMode } = useTheme();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  const setSorting = (field) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
  };

  const sortData = (data) => {
    if (!sortBy) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle nested properties
      if (sortBy === 'name') {
        aValue = `${a.first_name} ${a.last_name}`.toLowerCase();
        bValue = `${b.first_name} ${b.last_name}`.toLowerCase();
      }

      if (reverseSortDirection) {
        return bValue > aValue ? 1 : -1;
      }

      return aValue > bValue ? 1 : -1;
    });
  };

  const filterData = (data, search) => {
    const query = search.toLowerCase().trim();
    return data.filter((item) =>
      `${item.first_name} ${item.last_name} ${item.email}`.toLowerCase().includes(query)
    );
  };

  const filteredData = filterData(users, search);
  const sortedData = sortData(filteredData);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'project_manager':
        return 'blue';
      case 'member':
        return 'green';
      case 'viewer':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'project_manager':
        return 'Project Manager';
      case 'member':
        return 'Member';
      case 'viewer':
        return 'Viewer';
      default:
        return role;
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const Th = ({ children, reversed, sorted, onSort }) => {
    const Icon = sorted ? (reversed ? ChevronUpIcon : ChevronDownIcon) : null;
    return (
      <Table.Th>
        <UnstyledButton onClick={onSort} className="w-full">
          <Group justify="space-between">
            <Text fw={500} fz="sm">
              {children}
            </Text>
            {Icon && (
              <Icon className="h-4 w-4" />
            )}
          </Group>
        </UnstyledButton>
      </Table.Th>
    );
  };

  const rows = sortedData.map((user) => (
    <Table.Tr key={user.id}>
      <Table.Td>
        <Group gap="sm">
          <MantineAvatar
            size={40}
            radius="xl"
            color={getRoleBadgeColor(user.role)}
          >
            {getInitials(user.first_name, user.last_name)}
          </MantineAvatar>
          <div>
            <Text fz="sm" fw={500}>
              {user.first_name} {user.last_name}
            </Text>
            <Text fz="xs" c="dimmed">
              {user.email}
            </Text>
          </div>
        </Group>
      </Table.Td>

      <Table.Td>
        <Badge
          color={getRoleBadgeColor(user.role)}
          variant="light"
          size="sm"
        >
          {getRoleLabel(user.role)}
        </Badge>
      </Table.Td>

      <Table.Td>
        <Text fz="sm">{user.project_count || 0}</Text>
      </Table.Td>

      <Table.Td>
        <Text fz="sm">{user.assigned_tasks || 0}</Text>
      </Table.Td>

      <Table.Td>
        <Badge
          color={user.is_active ? 'green' : 'red'}
          variant="light"
          size="sm"
          leftSection={
            user.is_active ? (
              <CheckCircleIcon className="h-3 w-3" />
            ) : (
              <XCircleIcon className="h-3 w-3" />
            )
          }
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </Table.Td>

      <Table.Td>
        <Text fz="xs" c="dimmed">
          {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
        </Text>
      </Table.Td>

      <Table.Td>
        <Group gap={4} justify="flex-end">
          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <EllipsisVerticalIcon className="h-4 w-4" />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>Actions</Menu.Label>
              <Menu.Item
                leftSection={<PencilIcon className="h-4 w-4" />}
                onClick={() => onUpdateUser(user)}
              >
                Edit User
              </Menu.Item>
              <Menu.Item
                leftSection={
                  user.is_active ? (
                    <XCircleIcon className="h-4 w-4" />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4" />
                  )
                }
                onClick={() => onUpdateUser({ ...user, is_active: !user.is_active })}
              >
                {user.is_active ? 'Deactivate' : 'Activate'}
              </Menu.Item>
              <Menu.Item
                leftSection={<EnvelopeIcon className="h-4 w-4" />}
                onClick={() => window.location.href = `mailto:${user.email}`}
              >
                Send Email
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<TrashIcon className="h-4 w-4" />}
                onClick={() => onDeleteUser(user)}
              >
                Delete User
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <MantineProvider>
      <div>
        {/* Header */}
        <Group justify="space-between" mb="md">
          <TextInput
            placeholder="Search by name or email"
            leftSection={<MagnifyingGlassIcon className="h-4 w-4" />}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            style={{ flex: 1, maxWidth: 400 }}
          />
          <Button
            leftSection={<EnvelopeIcon className="h-4 w-4" />}
            onClick={onInviteUser}
          >
            Invite User
          </Button>
        </Group>

        {/* Table */}
        <ScrollArea>
          <Table
            horizontalSpacing="md"
            verticalSpacing="sm"
            miw={800}
            highlightOnHover
            striped
          >
            <Table.Thead>
              <Table.Tr>
                <Th
                  sorted={sortBy === 'name'}
                  reversed={reverseSortDirection}
                  onSort={() => setSorting('name')}
                >
                  User
                </Th>
                <Th
                  sorted={sortBy === 'role'}
                  reversed={reverseSortDirection}
                  onSort={() => setSorting('role')}
                >
                  Role
                </Th>
                <Th
                  sorted={sortBy === 'project_count'}
                  reversed={reverseSortDirection}
                  onSort={() => setSorting('project_count')}
                >
                  Projects
                </Th>
                <Th
                  sorted={sortBy === 'assigned_tasks'}
                  reversed={reverseSortDirection}
                  onSort={() => setSorting('assigned_tasks')}
                >
                  Tasks
                </Th>
                <Th
                  sorted={sortBy === 'is_active'}
                  reversed={reverseSortDirection}
                  onSort={() => setSorting('is_active')}
                >
                  Status
                </Th>
                <Th
                  sorted={sortBy === 'last_login'}
                  reversed={reverseSortDirection}
                  onSort={() => setSorting('last_login')}
                >
                  Last Login
                </Th>
                <Table.Th style={{ textAlign: 'right' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.length > 0 ? (
                rows
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text fw={500} ta="center" c="dimmed">
                      No users found
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {/* Footer */}
        <Group justify="space-between" mt="md">
          <Text fz="sm" c="dimmed">
            Showing {rows.length} of {users.length} users
          </Text>
        </Group>
      </div>
    </MantineProvider>
  );
};

export default UsersTable;
