'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';
import { SearchIcon, FolderIcon, CheckSquareIcon, UserIcon, XIcon } from 'lucide-react';

export default function GlobalSearch() {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({
    projects: [],
    tasks: [],
    users: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Close search when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    // Open search with Cmd+K or Ctrl+K
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      
      // Close with Escape
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      performSearch(query);
    } else {
      setResults({ projects: [], tasks: [], users: [] });
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true);
      const lowerQuery = searchQuery.toLowerCase();

      // Search projects
      const { data: allProjects } = await projectService.list();
      const filteredProjects = (allProjects || []).filter((project) =>
        project.name.toLowerCase().includes(lowerQuery) ||
        project.description?.toLowerCase().includes(lowerQuery)
      ).slice(0, 5);

      // Search tasks
      const { data: allTasks } = await taskService.list();
      const filteredTasks = (allTasks || []).filter((task) =>
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description?.toLowerCase().includes(lowerQuery)
      ).slice(0, 5);

      // Search users
      const { data: allUsers } = await userService.list();
      const filteredUsers = (allUsers || []).filter((user) =>
        user.firstName?.toLowerCase().includes(lowerQuery) ||
        user.lastName?.toLowerCase().includes(lowerQuery) ||
        user.email?.toLowerCase().includes(lowerQuery)
      ).slice(0, 5);

      setResults({
        projects: filteredProjects,
        tasks: filteredTasks,
        users: filteredUsers,
      });
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (type: string, id: string) => {
    setIsOpen(false);
    setQuery('');
    
    if (type === 'project') {
      router.push(`/dashboard/projects/${id}`);
    } else if (type === 'task') {
      router.push(`/dashboard/tasks/${id}`);
    } else if (type === 'user') {
      // Navigate to user profile or team page
      router.push('/dashboard/team');
    }
  };

  const totalResults = results.projects.length + results.tasks.length + results.users.length;

  return (
    <div className="flex-1 max-w-2xl" ref={searchRef}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search projects, tasks, or team members... (⌘K)"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute mt-2 w-full max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Searching...</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="p-8 text-center">
              <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No results found for "{query}"</p>
              <p className="text-sm text-gray-500 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="py-2">
              {/* Projects */}
              {results.projects.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Projects
                  </div>
                  {results.projects.map((project: any) => (
                    <button
                      key={project.id}
                      onClick={() => handleResultClick('project', project.id)}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left"
                    >
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: project.color || '#3B82F6' }}
                      >
                        <FolderIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {project.name}
                        </p>
                        {project.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Tasks */}
              {results.tasks.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Tasks
                  </div>
                  {results.tasks.map((task: any) => (
                    <button
                      key={task.id}
                      onClick={() => handleResultClick('task', task.id)}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left"
                    >
                      <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <CheckSquareIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Users */}
              {results.users.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Team Members
                  </div>
                  {results.users.map((user: any) => (
                    <button
                      key={user.id}
                      onClick={() => handleResultClick('user', user.id)}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-semibold">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <span className="text-xs text-gray-500">{user.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getPriorityColor(priority: string) {
  const colors = {
    LOW: 'bg-gray-100 text-gray-600',
    MEDIUM: 'bg-blue-100 text-blue-600',
    HIGH: 'bg-orange-100 text-orange-600',
    URGENT: 'bg-red-100 text-red-600',
  };
  return colors[priority as keyof typeof colors] || colors.MEDIUM;
}
