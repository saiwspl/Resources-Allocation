import React, { useState } from 'react';
import { Resource, Assignments, ResourceType } from '../types';
import DraggableResource from './DraggableResource';

interface ResourcePoolProps {
  programmers: Resource[];
  qas: Resource[];
  projectManagers: Resource[];
  assignments: Assignments;
  onDrop: (targetProjectId: string | null, targetResourceType: ResourceType) => (e: React.DragEvent<HTMLDivElement>) => void;
}

const DropZone: React.FC<{
    resourceType: ResourceType;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    children: React.ReactNode;
}> = ({ resourceType, onDrop, children }) => {
    const [isOver, setIsOver] = useState(false);
    const [justDropped, setJustDropped] = useState(false);
    
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
            setJustDropped(true);
            setTimeout(() => setJustDropped(false), 400); // Animation duration
        }
        setIsOver(false);
    };
    
    const ringColor = resourceType === ResourceType.PROGRAMMER
        ? 'ring-blue-500'
        : resourceType === ResourceType.QA
        ? 'ring-green-500'
        : 'ring-purple-500';

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-4 rounded-xl min-h-[200px] transition-all duration-200 ${
                isOver
                ? `ring-2 ring-offset-2 ring-offset-gray-800 ${ringColor} bg-gray-700/50`
                : 'bg-gray-800/50'
            } ${
                justDropped ? 'bg-green-500/25' : ''
            }`}
        >
            {children}
        </div>
    );
};

const ResourcePool: React.FC<ResourcePoolProps> = ({ programmers, qas, projectManagers, assignments, onDrop }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filterByName = (resource: Resource) => 
    resource.name.toLowerCase().includes(searchTerm.toLowerCase());

  const allProgrammers = programmers.filter(filterByName);
  const allQas = qas.filter(filterByName);
  const allPms = projectManagers.filter(filterByName);

  return (
    <aside className="lg:w-1/4 w-full bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-300">Resource Pool</h2>
      
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
          <h3 className="text-lg font-semibold mb-3 text-blue-400">Programmers ({programmers.length})</h3>
          <DropZone resourceType={ResourceType.PROGRAMMER} onDrop={onDrop(null, ResourceType.PROGRAMMER)}>
            {allProgrammers.length > 0 ? (
                allProgrammers.map(p => (
                <DraggableResource key={p.id} resource={p} type={ResourceType.PROGRAMMER} sourceProjectId={null} />
                ))
            ) : (
                <p className="text-gray-500 text-center pt-8">
                  {searchTerm ? 'No matches found.' : 'No programmers available.'}
                </p>
            )}
          </DropZone>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3 text-green-400">QA Engineers ({qas.length})</h3>
          <DropZone resourceType={ResourceType.QA} onDrop={onDrop(null, ResourceType.QA)}>
            {allQas.length > 0 ? (
                allQas.map(q => (
                <DraggableResource key={q.id} resource={q} type={ResourceType.QA} sourceProjectId={null} />
                ))
            ) : (
                 <p className="text-gray-500 text-center pt-8">
                   {searchTerm ? 'No matches found.' : 'No QA engineers available.'}
                 </p>
            )}
          </DropZone>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3 text-purple-400">Project Managers ({projectManagers.length})</h3>
          <DropZone resourceType={ResourceType.PROJECT_MANAGER} onDrop={onDrop(null, ResourceType.PROJECT_MANAGER)}>
            {allPms.length > 0 ? (
                allPms.map(p => (
                <DraggableResource key={p.id} resource={p} type={ResourceType.PROJECT_MANAGER} sourceProjectId={null} />
                ))
            ) : (
                 <p className="text-gray-500 text-center pt-8">
                   {searchTerm ? 'No matches found.' : 'No project managers available.'}
                 </p>
            )}
          </DropZone>
        </div>
      </div>
    </aside>
  );
};

export default ResourcePool;