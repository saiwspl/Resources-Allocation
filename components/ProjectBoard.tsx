import React, { useState, useMemo } from 'react';
import { Project, Resource, Assignments, ResourceType } from '../types';
import DraggableResource from './DraggableResource';

const DropColumn: React.FC<{
    title: string;
    resourceType: ResourceType;
    assignedResources: Resource[];
    projectId: string;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    resourceProjectCounts: Map<string, number>;
    className?: string;
}> = ({ title, resourceType, assignedResources, projectId, onDrop, resourceProjectCounts, className = '' }) => {
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
        onDrop(e);
        setIsOver(false);
    };

    const styleMap = {
        [ResourceType.PROGRAMMER]: { ring: 'ring-blue-500', bg: 'bg-blue-900/20', text: 'text-blue-400' },
        [ResourceType.QA]: { ring: 'ring-green-500', bg: 'bg-green-900/20', text: 'text-green-400' },
        [ResourceType.PROJECT_MANAGER]: { ring: 'ring-purple-500', bg: 'bg-purple-900/20', text: 'text-purple-400' },
        [ResourceType.PROJECT_LEAD]: { ring: 'ring-yellow-500', bg: 'bg-yellow-900/20', text: 'text-yellow-400' }
    };
    
    const { ring, bg, text } = styleMap[resourceType];

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col flex-1 p-4 rounded-lg bg-gray-900/50 border-2 border-dashed border-gray-700 transition-all duration-200 ${className} ${
                isOver ? `border-solid ${ring} ${bg}` : ''
            }`}
        >
            <h4 className={`font-semibold mb-3 flex-shrink-0 ${text}`}>{title} ({assignedResources.length})</h4>
            <div className="space-y-2 overflow-y-auto">
                {assignedResources.map(resource => (
                    <DraggableResource key={resource.id} resource={resource} type={resourceType} sourceProjectId={projectId} projectCount={resourceProjectCounts.get(resource.id) || 0} />
                ))}
            </div>
        </div>
    );
};

interface ProjectCardProps {
  project: Project;
  assignments: Assignments[string];
  resourceMap: Map<string, Resource>;
  onDrop: (target: { projectId: string | null; type: ResourceType }) => (e: React.DragEvent<HTMLDivElement>) => void;
  resourceProjectCounts: Map<string, number>;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, assignments, resourceMap, onDrop, resourceProjectCounts }) => {

  const getAssignedResources = (type: ResourceType): Resource[] => {
    return assignments[type].map(id => resourceMap.get(id)).filter((r): r is Resource => !!r);
  };

  const totalResources = Object.values(assignments).flat().length;

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-cyan-400 flex items-center justify-between">
        <span>{project.name}</span>
        <span className="text-sm font-medium bg-gray-700 text-cyan-300 rounded-full px-3 py-1">
          Total Resources: {totalResources}
        </span>
      </h3>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DropColumn 
                title="Project Managers"
                resourceType={ResourceType.PROJECT_MANAGER}
                assignedResources={getAssignedResources(ResourceType.PROJECT_MANAGER)}
                onDrop={onDrop({ projectId: project.id, type: ResourceType.PROJECT_MANAGER })}
                projectId={project.id}
                resourceProjectCounts={resourceProjectCounts}
                className="min-h-[120px]"
            />
            <DropColumn 
                title="Project Leads"
                resourceType={ResourceType.PROJECT_LEAD}
                assignedResources={getAssignedResources(ResourceType.PROJECT_LEAD)}
                onDrop={onDrop({ projectId: project.id, type: ResourceType.PROJECT_LEAD })}
                projectId={project.id}
                resourceProjectCounts={resourceProjectCounts}
                className="min-h-[120px]"
            />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <DropColumn 
                title="Programmers"
                resourceType={ResourceType.PROGRAMMER}
                assignedResources={getAssignedResources(ResourceType.PROGRAMMER)}
                onDrop={onDrop({ projectId: project.id, type: ResourceType.PROGRAMMER })}
                projectId={project.id}
                resourceProjectCounts={resourceProjectCounts}
                className="min-h-[200px]"
            />
            <DropColumn 
                title="QA Engineers"
                resourceType={ResourceType.QA}
                assignedResources={getAssignedResources(ResourceType.QA)}
                onDrop={onDrop({ projectId: project.id, type: ResourceType.QA })}
                projectId={project.id}
                resourceProjectCounts={resourceProjectCounts}
                className="min-h-[200px]"
            />
        </div>
      </div>
    </div>
  );
};


interface ProjectBoardProps {
  projects: Project[];
  programmers: Resource[];
  qas: Resource[];
  projectManagers: Resource[];
  projectLeads: Resource[];
  assignments: Assignments;
  onDrop: (target: { projectId: string | null; type: ResourceType }) => (e: React.DragEvent<HTMLDivElement>) => void;
  resourceProjectCounts: Map<string, number>;
}

const ProjectBoard: React.FC<ProjectBoardProps> = ({ projects, programmers, qas, projectManagers, projectLeads, assignments, onDrop, resourceProjectCounts }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const resourceMap = new Map<string, Resource>([
    ...programmers.map((p): [string, Resource] => [p.id, p]),
    ...qas.map((q): [string, Resource] => [q.id, q]),
    ...projectManagers.map((pm): [string, Resource] => [pm.id, pm]),
    ...projectLeads.map((pl): [string, Resource] => [pl.id, pl]),
  ]);

  const filteredProjects = useMemo(() => {
    if (!searchTerm) {
      return projects;
    }
    return projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projects, searchTerm]);

  return (
    <section className="flex-1">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-300">Projects</h2>
      
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label="Search projects"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      <div className="space-y-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map(project => {
            const projectAssignments = assignments[project.id];
            if (!projectAssignments) return null;

            return (
              <ProjectCard
                key={project.id}
                project={project}
                assignments={projectAssignments}
                resourceMap={resourceMap}
                onDrop={onDrop}
                resourceProjectCounts={resourceProjectCounts}
              />
            );
          })
        ) : (
          <div className="text-center py-12 px-6 bg-gray-800 rounded-2xl shadow-lg border border-dashed border-gray-700">
            <h3 className="text-xl font-semibold text-white">
              {projects.length > 0 ? 'No Projects Found' : 'No Projects Loaded'}
            </h3>
            <p className="mt-1 text-gray-400">
              {projects.length > 0 ? 'Try a different search term.' : 'Upload a projects CSV to start assigning resources.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectBoard;