import React from 'react';
import { Resource, ResourceType } from '../types';

interface DraggableResourceProps {
  resource: Resource;
  type: ResourceType;
  sourceProjectId: string | null;
}

const DraggableResource: React.FC<DraggableResourceProps> = ({ resource, type, sourceProjectId }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('resourceId', resource.id);
    e.dataTransfer.setData('resourceType', type);
    e.dataTransfer.setData('sourceProjectId', sourceProjectId || 'unassigned');
    e.currentTarget.classList.add('opacity-50', 'scale-105');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50', 'scale-105');
  };
  
  const bgColor = type === ResourceType.PROGRAMMER 
    ? 'bg-blue-900/50 border-blue-500' 
    : type === ResourceType.QA 
    ? 'bg-green-900/50 border-green-500' 
    : 'bg-purple-900/50 border-purple-500';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`p-3 mb-2 rounded-lg cursor-grab active:cursor-grabbing shadow-md border ${bgColor} hover:bg-gray-600 transition-all duration-200`}
    >
      <p className="font-medium text-white truncate">{resource.name}</p>
    </div>
  );
};

export default DraggableResource;
