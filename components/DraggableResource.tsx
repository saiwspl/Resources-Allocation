import React from 'react';
import { Resource, ResourceType } from '../types';

interface DraggableResourceProps {
  resource: Resource;
  type: ResourceType;
  sourceProjectId: string | null;
  projectCount: number;
}

const DraggableResource: React.FC<DraggableResourceProps> = ({ resource, type, sourceProjectId, projectCount }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('resourceId', resource.id);
    e.dataTransfer.setData('resourceType', type);
    e.dataTransfer.setData('sourceProjectId', sourceProjectId || 'unassigned');
    e.currentTarget.classList.add('opacity-50', 'scale-105');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50', 'scale-105');
  };
  
  const bgColor = {
    [ResourceType.PROGRAMMER]: 'bg-blue-900/50 border-blue-500',
    [ResourceType.QA]: 'bg-green-900/50 border-green-500',
    [ResourceType.PROJECT_MANAGER]: 'bg-purple-900/50 border-purple-500',
    [ResourceType.PROJECT_LEAD]: 'bg-yellow-900/50 border-yellow-500'
  }[type];


  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`flex items-center p-3 rounded-lg cursor-grab active:cursor-grabbing shadow-md border ${bgColor} hover:bg-gray-600 transition-all duration-200`}
    >
      <p className="flex-grow font-medium text-white truncate">{resource.name}</p>
      {projectCount > 1 && (
        <span className="ml-2 flex-shrink-0 bg-cyan-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-gray-800">
          {projectCount}
        </span>
      )}
    </div>
  );
};

export default DraggableResource;
