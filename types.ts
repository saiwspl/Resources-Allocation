export enum ResourceType {
  PROGRAMMER = 'PROGRAMMER',
  QA = 'QA',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
}

export interface Resource {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  projectLeadId: string | null;
}

export interface Assignments {
  [projectId: string]: {
    [ResourceType.PROGRAMMER]: string[];
    [ResourceType.QA]: string[];
    [ResourceType.PROJECT_MANAGER]: string[];
  };
}
