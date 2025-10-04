import React, { useEffect, useRef } from 'react';
import { BoltIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const DependencyGraph = ({ tasks = [], currentTaskId }) => {
  const canvasRef = useRef(null);

  // Build dependency tree
  const buildDependencyTree = () => {
    const currentTask = tasks.find(t => t.id === currentTaskId);
    if (!currentTask) return { upstream: [], downstream: [] };

    // Upstream: Tasks that block current task
    const upstream = (currentTask.dependencies || [])
      .map(depId => tasks.find(t => t.id === depId))
      .filter(Boolean);

    // Downstream: Tasks blocked by current task
    const downstream = tasks.filter(t => 
      (t.dependencies || []).includes(currentTaskId)
    );

    return { upstream, downstream, current: currentTask };
  };

  const { upstream, downstream, current } = buildDependencyTree();

  useEffect(() => {
    if (!canvasRef.current || !current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw connections
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;

    // Draw upstream connections
    upstream.forEach((task, index) => {
      const y = 50 + index * 60;
      ctx.beginPath();
      ctx.moveTo(150, y);
      ctx.lineTo(250, height / 2);
      ctx.stroke();
    });

    // Draw downstream connections
    downstream.forEach((task, index) => {
      const y = 50 + index * 60;
      ctx.beginPath();
      ctx.moveTo(450, height / 2);
      ctx.lineTo(550, y);
      ctx.stroke();
    });
  }, [upstream, downstream, current]);

  if (!current) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BoltIcon className="h-16 w-16 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No task selected</p>
      </div>
    );
  }

  if (upstream.length === 0 && downstream.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BoltIcon className="h-16 w-16 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No dependencies</p>
        <p className="text-xs mt-1">This task has no blocking or blocked tasks</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual Graph */}
      <div className="relative bg-gray-50 rounded-xl p-6 border border-gray-200">
        <canvas
          ref={canvasRef}
          width={700}
          height={400}
          className="w-full"
        />
        
        {/* Task Nodes */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Upstream (Blocking) */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 space-y-4">
            {upstream.map((task, index) => (
              <div
                key={task.id}
                className="bg-red-100 border-2 border-red-400 rounded-lg p-3 w-32 pointer-events-auto cursor-pointer hover:shadow-md transition-all"
                style={{ transform: `translateY(${(index - upstream.length / 2) * 60}px)` }}
              >
                <p className="text-xs font-semibold text-red-800 truncate">{task.title}</p>
                <p className="text-[10px] text-red-600">Blocks this</p>
              </div>
            ))}
          </div>

          {/* Current Task */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="bg-blue-100 border-2 border-blue-500 rounded-lg p-4 w-40 pointer-events-auto shadow-lg">
              <p className="text-sm font-bold text-blue-900 truncate">{current.title}</p>
              <p className="text-xs text-blue-700">Current Task</p>
            </div>
          </div>

          {/* Downstream (Blocked) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 space-y-4">
            {downstream.map((task, index) => (
              <div
                key={task.id}
                className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 w-32 pointer-events-auto cursor-pointer hover:shadow-md transition-all"
                style={{ transform: `translateY(${(index - downstream.length / 2) * 60}px)` }}
              >
                <p className="text-xs font-semibold text-yellow-800 truncate">{task.title}</p>
                <p className="text-[10px] text-yellow-600">Blocked by this</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* List View */}
      <div className="grid grid-cols-2 gap-4">
        {/* Blocking Tasks */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <BoltIcon className="h-4 w-4 mr-1 text-red-500" />
            Blocking ({upstream.length})
          </h4>
          {upstream.length > 0 ? (
            <div className="space-y-2">
              {upstream.map(task => (
                <div key={task.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Status: <span className="font-medium">{task.status}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No blocking tasks</p>
          )}
        </div>

        {/* Blocked Tasks */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <ArrowRightIcon className="h-4 w-4 mr-1 text-yellow-500" />
            Blocked By This ({downstream.length})
          </h4>
          {downstream.length > 0 ? (
            <div className="space-y-2">
              {downstream.map(task => (
                <div key={task.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Status: <span className="font-medium">{task.status}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">Not blocking any tasks</p>
          )}
        </div>
      </div>

      {/* Warning if blocked */}
      {upstream.some(t => t.status !== 'DONE') && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <BoltIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">Task is blocked</p>
            <p className="text-xs text-red-700 mt-1">
              {upstream.filter(t => t.status !== 'DONE').length} blocking task(s) must be completed first
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DependencyGraph;
