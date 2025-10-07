import React, { useState } from 'react';
import { Project, Resource, Assignments, ResourceType } from '../types';
import DraggableResource from './DraggableResource';

interface ProjectCardProps {
  project: Project;
  assignedProgrammers: Resource[];
  assignedQas: Resource[];
  assignedPms: Resource[];
  resourceMap: Map<string, Resource>;
  onDrop: (targetProjectId: string | null, targetResourceType: ResourceType) => (e: React.DragEvent<HTMLDivElement>) => void;
}

const DropColumn: React.FC<{
    title: string;
    resourceType: ResourceType;
    projectId: string;
    assignedResources: Resource[];
    onDrop: (targetProjectId: string | null, targetResourceType: ResourceType) => (e: React.DragEvent<HTMLDivElement>) => void;
}> = ({ title, resourceType, projectId, assignedResources, onDrop }) => {
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
            onDrop(projectId, resourceType)(e);
            setJustDropped(true);
            setTimeout(() => setJustDropped(false), 400);
        }
        setIsOver(false);
    };

    const highlightRingColor = resourceType === ResourceType.PROGRAMMER 
        ? 'ring-blue-500' 
        : resourceType === ResourceType.QA
        ? 'ring-green-500'
        : 'ring-purple-500';

    const highlightBgColor = resourceType === ResourceType.PROGRAMMER 
        ? 'bg-blue-900/20' 
        : resourceType === ResourceType.QA
        ? 'bg-green-900/20'
        : 'bg-purple-900/20';
    
    const textColor = resourceType === ResourceType.PROGRAMMER 
        ? 'text-blue-400' 
        : resourceType === ResourceType.QA
        ? 'text-green-400'
        : 'text-purple-400';

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 p-4 rounded-lg bg-gray-900/50 border-2 border-dashed border-gray-700 transition-all duration-200 min-h-[150px] ${
                isOver 
                ? `border-solid ${highlightRingColor} ${highlightBgColor} ring-2 ring-offset-gray-900`
                : ''
            } ${
                justDropped ? 'bg-green-500/25' : ''
            }`}
        >
            <h4 className={`font-semibold mb-3 ${textColor}`}>{title} ({assignedResources.length})</h4>
            {assignedResources.length > 0 ? (
                assignedResources.map(resource => (
                    <DraggableResource key={resource.id} resource={resource} type={resourceType} sourceProjectId={projectId} />
                ))
            ) : (
                 <p className="text-gray-500 text-sm text-center pt-8">Drop here</p>
            )}
        </div>
    );
};


const ProjectCard: React.FC<ProjectCardProps> = ({ project, assignedProgrammers, assignedQas, assignedPms, resourceMap, onDrop }) => {
  const projectLead = project.projectLeadId ? resourceMap.get(project.projectLeadId) : undefined;
  const projectManager = assignedPms.length > 0 ? assignedPms[0] : undefined;
  
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
      <h3 className="text-xl font-bold mb-2 text-cyan-400">{project.name}</h3>

      <div className="mb-4 space-y-1">
        <p className="text-sm text-gray-400 flex items-baseline">
            <span className="font-semibold text-gray-300 w-20 flex-shrink-0">Lead:</span>
            {projectLead ? (
                <span className="truncate">{projectLead.name}</span>
            ) : (
                <span className="text-yellow-500 italic">Not Assigned</span>
            )}
        </p>
        <p className="text-sm text-gray-400 flex items-baseline">
            <span className="font-semibold text-gray-300 w-20 flex-shrink-0">Manager:</span>
            {projectManager ? (
                <span className="truncate">{projectManager.name}</span>
            ) : (
                <span className="text-yellow-500 italic">Not Assigned</span>
            )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DropColumn 
            title="Programmers"
            resourceType={ResourceType.PROGRAMMER}
            projectId={project.id}
            assignedResources={assignedProgrammers}
            onDrop={onDrop}
        />
        <DropColumn 
            title="QA Engineers"
            resourceType={ResourceType.QA}
            projectId={project.id}
            assignedResources={assignedQas}
            onDrop={onDrop}
        />
        <DropColumn 
            title="Project Manager"
            resourceType={ResourceType.PROJECT_MANAGER}
            projectId={project.id}
            assignedResources={assignedPms}
            onDrop={onDrop}
        />
      </div>
    </div>
  );
};


interface ProjectBoardProps {
  projects: Project[];
  programmers: Resource[];
  qas: Resource[];
  projectManagers: Resource[];
  assignments: Assignments;
  onDrop: (targetProjectId: string | null, targetResourceType: ResourceType) => (e: React.DragEvent<HTMLDivElement>) => void;
}

const ProjectBoard: React.FC<ProjectBoardProps> = ({ projects, programmers, qas, projectManagers, assignments, onDrop }) => {
  const resourceMap = new Map<string, Resource>([
    ...programmers.map((p): [string, Resource] => [p.id, p]),
    ...qas.map((q): [string, Resource] => [q.id, q]),
    ...projectManagers.map((pm): [string, Resource] => [pm.id, pm]),
  ]);

  return (
    <section className="flex-1">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-300">Projects</h2>
      <div className="space-y-6">
        {projects.length > 0 ? (
          projects.map(project => {
            const projectAssignments = assignments[project.id];
            const assignedProgrammers = projectAssignments?.[ResourceType.PROGRAMMER].map(id => resourceMap.get(id)).filter((p): p is Resource => !!p) || [];
            const assignedQas = projectAssignments?.[ResourceType.QA].map(id => resourceMap.get(id)).filter((q): q is Resource => !!q) || [];
            const assignedPms = projectAssignments?.[ResourceType.PROJECT_MANAGER].map(id => resourceMap.get(id)).filter((pm): pm is Resource => !!pm) || [];

            return (
              <ProjectCard
                key={project.id}
                project={project}
                assignedProgrammers={assignedProgrammers}
                assignedQas={assignedQas}
                assignedPms={assignedPms}
                resourceMap={resourceMap}
                onDrop={onDrop}
              />
            );
          })
        ) : (
          <div className="text-center py-12 px-6 bg-gray-800 rounded-2xl shadow-lg border border-dashed border-gray-700">
            <h3 className="text-xl font-semibold text-white">No Projects Loaded</h3>
            <p className="mt-1 text-gray-400">Upload a projects CSV to start assigning resources.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectBoard;