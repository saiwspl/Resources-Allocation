import React, { useState, useMemo } from 'react';
import { Resource, Assignments, ResourceType, Project } from '../types';
import DraggableResource from './DraggableResource';

interface ResourcePoolProps {
  programmers: Resource[];
  qas: Resource[];
  projectManagers: Resource[];
  projectLeads: Resource[];
  assignments: Assignments;
  onDrop: (target: { projectId: string | null; type: ResourceType }) => (e: React.DragEvent<HTMLDivElement>) => void;
  resourceProjectCounts: Map<string, number>;
}

const DropZone: React.FC<{
    resourceType: ResourceType;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    children: React.ReactNode;
}> = ({ resourceType, onDrop, children }) => {
    const [isOver, setIsOver] = useState(false);
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const draggedType = e.dataTransfer.getData('resourceType');
        if (draggedType === resourceType) {
            e.dataTransfer.dropEffect = 'move';
            setIsOver(true);
        } else {
            e.dataTransfer.dropEffect = 'none';
        }
    };

    const handleDragLeave = () => setIsOver(false);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const draggedType = e.dataTransfer.getData('resourceType');
        if (draggedType === resourceType) {
            onDrop(e);
        }
        setIsOver(false);
    };
    
    const ringColor = {
        [ResourceType.PROGRAMMER]: 'ring-blue-500',
        [ResourceType.QA]: 'ring-green-500',
        [ResourceType.PROJECT_MANAGER]: 'ring-purple-500',
        [ResourceType.PROJECT_LEAD]: 'ring-yellow-500'
    }[resourceType];

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-4 rounded-xl min-h-[150px] transition-all duration-200 space-y-2 ${
                isOver
                ? `ring-2 ring-offset-2 ring-offset-gray-800 ${ringColor} bg-gray-700/50`
                : 'bg-gray-800/50'
            }`}
        >
            {children}
        </div>
    );
};

const ResourcePool: React.FC<ResourcePoolProps> = ({ programmers, qas, projectManagers, projectLeads, assignments, onDrop, resourceProjectCounts }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const unassignedResources = useMemo(() => {
    const assignedIds = new Set(
        Object.values(assignments).flatMap(projectAssignments => 
            Object.values(projectAssignments).flat()
        )
    );
    
    const filterByName = (r: Resource) => r.name.toLowerCase().includes(searchTerm.toLowerCase());

    return {
      programmers: programmers.filter(r => !assignedIds.has(r.id) && filterByName(r)),
      qas: qas.filter(r => !assignedIds.has(r.id) && filterByName(r)),
      projectManagers: projectManagers.filter(r => !assignedIds.has(r.id) && filterByName(r)),
      projectLeads: projectLeads.filter(r => !assignedIds.has(r.id) && filterByName(r)),
    };
  }, [programmers, qas, projectManagers, projectLeads, assignments, searchTerm]);

  return (
    <aside className="lg:w-1/3 w-full bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-300">Unassigned Resources</h2>
      
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label="Search unassigned resources"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3 text-purple-400">Project Managers ({unassignedResources.projectManagers.length})</h3>
          <DropZone resourceType={ResourceType.PROJECT_MANAGER} onDrop={onDrop({ projectId: null, type: ResourceType.PROJECT_MANAGER })}>
             {unassignedResources.projectManagers.map(p => <DraggableResource key={p.id} resource={p} type={ResourceType.PROJECT_MANAGER} sourceProjectId={null} projectCount={resourceProjectCounts.get(p.id) || 0} />)}
          </DropZone>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3 text-yellow-400">Project Leads ({unassignedResources.projectLeads.length})</h3>
          <DropZone resourceType={ResourceType.PROJECT_LEAD} onDrop={onDrop({ projectId: null, type: ResourceType.PROJECT_LEAD })}>
             {unassignedResources.projectLeads.map(p => <DraggableResource key={p.id} resource={p} type={ResourceType.PROJECT_LEAD} sourceProjectId={null} projectCount={resourceProjectCounts.get(p.id) || 0} />)}
          </DropZone>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3 text-blue-400">Programmers ({unassignedResources.programmers.length})</h3>
          <DropZone resourceType={ResourceType.PROGRAMMER} onDrop={onDrop({ projectId: null, type: ResourceType.PROGRAMMER })}>
            {unassignedResources.programmers.map(p => <DraggableResource key={p.id} resource={p} type={ResourceType.PROGRAMMER} sourceProjectId={null} projectCount={resourceProjectCounts.get(p.id) || 0} />)}
          </DropZone>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3 text-green-400">QA Engineers ({unassignedResources.qas.length})</h3>
          <DropZone resourceType={ResourceType.QA} onDrop={onDrop({ projectId: null, type: ResourceType.QA })}>
            {unassignedResources.qas.map(q => <DraggableResource key={q.id} resource={q} type={ResourceType.QA} sourceProjectId={null} projectCount={resourceProjectCounts.get(q.id) || 0} />)}
          </DropZone>
        </div>
      </div>
    </aside>
  );
};

export default ResourcePool;
