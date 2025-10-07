import React, { useState, useCallback } from 'react';
import { Resource, Project, Assignments, ResourceType } from './types';
import FileUpload from './components/FileUpload';
import ResourcePool from './components/ResourcePool';
import ProjectBoard from './components/ProjectBoard';

const STORAGE_KEY = 'resourceAllocatorState';

// TypeScript declaration for jsPDF and its autoTable plugin from CDN
declare const jspdf: any;

const App: React.FC = () => {
  const [programmers, setProgrammers] = useState<Resource[]>([]);
  const [qas, setQas] = useState<Resource[]>([]);
  const [projectManagers, setProjectManagers] = useState<Resource[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});

  const generateId = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

  const handleFileUpload = (content: string) => {
    try {
      const lines = content.trim().split('\n');
      const headerLine = lines.shift()?.trim().toLowerCase();
      if (!headerLine) throw new Error('CSV is empty or has no header.');

      const header = headerLine.split(',').map(h => h.trim());
      const requiredColumns = ['projects', 'programmers', 'qa', 'pm'];
      if (!requiredColumns.every(col => header.includes(col))) {
        throw new Error(`CSV must have the columns: ${requiredColumns.join(', ')}.`);
      }

      const projectIndex = header.indexOf('projects');
      const programmerIndex = header.indexOf('programmers');
      const qaIndex = header.indexOf('qa');
      const pmIndex = header.indexOf('pm');
      const leadIndex = header.indexOf('project_lead');

      const programmerNames = new Set<string>();
      const qaNames = new Set<string>();
      const pmNames = new Set<string>();
      
      lines.forEach(line => {
        if (!line.trim()) return;
        const values = line.split(',');
        if (values[programmerIndex]?.trim()) programmerNames.add(values[programmerIndex].trim());
        if (values[qaIndex]?.trim()) qaNames.add(values[qaIndex].trim());
        if (values[pmIndex]?.trim()) pmNames.add(values[pmIndex].trim());
      });

      const newProgrammers = Array.from(programmerNames).map(name => ({ id: generateId(name), name }));
      const newQas = Array.from(qaNames).map(name => ({ id: generateId(name), name }));
      const newPms = Array.from(pmNames).map(name => ({ id: generateId(name), name }));
      
      const programmerNameToIdMap = new Map(newProgrammers.map(p => [p.name, p.id]));
      
      const newProjects: Project[] = [];
      lines.forEach(line => {
        if (!line.trim()) return;
        const values = line.split(',');
        const projectName = values[projectIndex]?.trim();
        if (projectName) {
          const leadName = leadIndex > -1 ? values[leadIndex]?.trim() : null;
          const projectLeadId = leadName ? programmerNameToIdMap.get(leadName) || null : null;
          newProjects.push({ id: generateId(projectName), name: projectName, projectLeadId });
        }
      });
      
      setProgrammers(newProgrammers);
      setQas(newQas);
      setProjectManagers(newPms);
      setProjects(newProjects);

      const initialAssignments: Assignments = {};
      newProjects.forEach(project => {
        initialAssignments[project.id] = {
          [ResourceType.PROGRAMMER]: [],
          [ResourceType.QA]: [],
          [ResourceType.PROJECT_MANAGER]: [],
        };
      });
      setAssignments(initialAssignments);

    } catch (error) {
      console.error("Failed to parse CSV:", error);
      alert(`Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDrop = useCallback((
    targetProjectId: string | null,
    targetResourceType: ResourceType
  ) => {
    return (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const resourceId = e.dataTransfer.getData('resourceId');
      const resourceTypeStr = e.dataTransfer.getData('resourceType');
      const sourceProjectId = e.dataTransfer.getData('sourceProjectId');

      if (!resourceId || !resourceTypeStr) return;
      const resourceType = resourceTypeStr as ResourceType;

      if (resourceType !== targetResourceType) return;

      setAssignments(prev => {
        const newAssignments = JSON.parse(JSON.stringify(prev));

        // Dropping onto a project board adds the resource to that project.
        if (targetProjectId) {
          if (newAssignments[targetProjectId] && !newAssignments[targetProjectId][resourceType].includes(resourceId)) {
            newAssignments[targetProjectId][resourceType].push(resourceId);
          }
        } 
        // Dropping onto the resource pool from a project removes the resource from THAT project.
        else if (sourceProjectId && sourceProjectId !== 'unassigned') {
            if (newAssignments[sourceProjectId]) {
                newAssignments[sourceProjectId][resourceType] = newAssignments[sourceProjectId][resourceType].filter((id: string) => id !== resourceId);
            }
        }
        
        return newAssignments;
      });
    };
  }, []);

  const hasData = programmers.length > 0 || qas.length > 0 || projects.length > 0 || projectManagers.length > 0;

  const handleSave = () => {
    if (!hasData) {
      alert("No data to save.");
      return;
    }
    try {
      const stateToSave = {
        programmers,
        qas,
        projectManagers,
        projects,
        assignments,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      alert('State saved successfully!');
    } catch (error) {
      alert('Could not save state to localStorage.');
      console.error('Failed to save state:', error);
    }
  };

  const handleLoad = () => {
    const savedStateJSON = localStorage.getItem(STORAGE_KEY);
    if (savedStateJSON) {
      try {
        const savedState = JSON.parse(savedStateJSON);
        setProgrammers(savedState.programmers || []);
        setQas(savedState.qas || []);
        setProjectManagers(savedState.projectManagers || []);
        setProjects(savedState.projects || []);
        setAssignments(savedState.assignments || {});
        alert('State loaded successfully!');
      } catch (error) {
        alert('Failed to load saved state. The data might be corrupted.');
        console.error('Failed to parse saved state:', error);
      }
    } else {
      alert('No saved state found.');
    }
  };

  const handleExportPDF = () => {
    const resourceProjectCounts = new Map<string, number>();

    const allResourcesWithTypes = [
      ...programmers.map(r => ({ ...r, type: 'Programmer' as const })),
      ...qas.map(r => ({ ...r, type: 'QA Engineer' as const })),
      ...projectManagers.map(r => ({ ...r, type: 'Project Manager' as const })),
    ];

    allResourcesWithTypes.forEach(r => resourceProjectCounts.set(r.id, 0));

    Object.values(assignments).forEach(project => {
      Object.values(project).flat().forEach(resourceId => {
        resourceProjectCounts.set(resourceId, (resourceProjectCounts.get(resourceId) || 0) + 1);
      });
    });

    const unassignedResources = allResourcesWithTypes.filter(r => (resourceProjectCounts.get(r.id) || 0) === 0);

    if (unassignedResources.length > 0) {
      const proceed = window.confirm(
        `There are ${unassignedResources.length} completely unassigned resources. Do you still want to generate the PDF?`
      );
      if (!proceed) {
        return;
      }
    }

    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    
    const resourceMap = new Map<string, Resource>(
        allResourcesWithTypes.map((r): [string, Resource] => [r.id, { id: r.id, name: r.name }])
    );
    
    doc.setFontSize(18);
    doc.text('Project Resource Allocations', 14, 22);
    
    let lastFinalY = 30;

    projects.forEach(project => {
        const projectAssignments = assignments[project.id];
        if (!projectAssignments) return;

        const assignedPmResources = projectAssignments[ResourceType.PROJECT_MANAGER].map(id => resourceMap.get(id)).filter(Boolean) as Resource[];
        const pmName = assignedPmResources.length > 0 ? assignedPmResources[0].name : 'N/A';

        const projectLead = project.projectLeadId ? resourceMap.get(project.projectLeadId) : null;
        const leadName = projectLead ? projectLead.name : 'N/A';
        
        const assignedProgrammerResources = projectAssignments[ResourceType.PROGRAMMER].map(id => resourceMap.get(id)).filter(Boolean) as Resource[];
        const assignedQaResources = projectAssignments[ResourceType.QA].map(id => resourceMap.get(id)).filter(Boolean) as Resource[];

        if (lastFinalY > 250) { 
            doc.addPage();
            lastFinalY = 22;
        }

        doc.setFontSize(16);
        doc.setTextColor(41, 128, 185);
        doc.text(project.name, 14, lastFinalY);
        lastFinalY += 8;

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`Project Manager: ${pmName}`, 14, lastFinalY);
        lastFinalY += 6;
        doc.text(`Project Lead: ${leadName}`, 14, lastFinalY);
        lastFinalY += 4;

        const tableBody = [];
        const maxRows = Math.max(assignedProgrammerResources.length, assignedQaResources.length);

        for (let i = 0; i < maxRows; i++) {
            const programmer = assignedProgrammerResources[i]?.name || '';
            const qa = assignedQaResources[i]?.name || '';
            tableBody.push([programmer, qa]);
        }
        
        if (tableBody.length > 0) {
            doc.autoTable({
                head: [['Programmers', 'QA']],
                body: tableBody,
                startY: lastFinalY,
                headStyles: { fillColor: [74, 85, 104] },
                theme: 'striped',
            });
            lastFinalY = doc.autoTable.previous.finalY + 15;
        } else {
             doc.setFontSize(10);
             doc.setTextColor(150, 150, 150);
             doc.text('No programmers or QA assigned.', 14, lastFinalY + 5);
             lastFinalY += 15;
        }
    });

    const overUtilizedResources = allResourcesWithTypes
      .map(r => ({ ...r, count: resourceProjectCounts.get(r.id) || 0 }))
      .filter(r => r.count > 3)
      .sort((a, b) => b.count - a.count);

    if (overUtilizedResources.length > 0) {
      if (lastFinalY > 240) {
        doc.addPage();
        lastFinalY = 22;
      }
      doc.autoTable({
        head: [['Over-utilized Resources (> 3 Projects)', 'Role', 'Assignments']],
        body: overUtilizedResources.map(r => [r.name, r.type, r.count.toString()]),
        startY: lastFinalY,
        headStyles: { fillColor: [211, 84, 0] },
      });
      lastFinalY = doc.autoTable.previous.finalY;
    }

    if (unassignedResources.length > 0) {
      if (lastFinalY > 250) {
        doc.addPage();
        lastFinalY = 22;
      }
      doc.autoTable({
        head: [['Unassigned Resources', '']],
        body: unassignedResources.map(r => [r.type, r.name]),
        startY: lastFinalY + 10,
        headStyles: { fillColor: [231, 76, 60] },
      });
    }

    doc.save('project-allocations.pdf');
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8 flex items-center justify-center">
        <img src="https://res.cloudinary.com/dj3qmm2ys/image/upload/v1759687796/MIMICSsquare_aeycdw.png" alt="MIMICS Logo" className="h-14 w-14 mr-4" />
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-tight">Project Resource Allocator</h1>
          <p className="text-gray-400 mt-2 text-lg">Upload a CSV, then drag & drop to assign resources.</p>
        </div>
      </header>
      
      <div className="mb-8 p-6 bg-gray-800 rounded-2xl shadow-lg border border-gray-700 max-w-2xl mx-auto">
        <div className="mb-4">
            <FileUpload label="Upload New CSV" onFileUpload={handleFileUpload} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
                onClick={handleSave}
                disabled={!hasData}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-md hover:shadow-blue-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
            >
                Save State
            </button>
            <button
                onClick={handleLoad}
                className="bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-md hover:shadow-yellow-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-yellow-500"
            >
                Load State
            </button>
            <button
                onClick={handleExportPDF}
                disabled={!hasData}
                className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out shadow-md hover:shadow-green-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
            >
                Export to PDF
            </button>
        </div>
      </div>

      {hasData ? (
        <main className="flex flex-col lg:flex-row gap-8">
          <ResourcePool programmers={programmers} qas={qas} projectManagers={projectManagers} assignments={assignments} onDrop={handleDrop} />
          <ProjectBoard projects={projects} programmers={programmers} qas={qas} projectManagers={projectManagers} assignments={assignments} onDrop={handleDrop} />
        </main>
      ) : (
        <div className="text-center py-16 px-6 bg-gray-800 rounded-2xl shadow-lg border border-dashed border-gray-600">
          <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-white">No Data Loaded</h2>
          <p className="mt-1 text-gray-400">Please upload your CSV file or load a saved state to begin.</p>
        </div>
      )}
    </div>
  );
};

export default App;