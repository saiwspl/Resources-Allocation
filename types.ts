export enum ResourceType {
  PROGRAMMER = 'PROGRAMMER',
  QA = 'QA',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  PROJECT_LEAD = 'PROJECT_LEAD',
}

export interface Resource {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
}

export interface Assignments {
  [projectId: string]: {
    [ResourceType.PROGRAMMER]: string[];
    [ResourceType.QA]: string[];
    [ResourceType.PROJECT_MANAGER]: string[];
    [ResourceType.PROJECT_LEAD]: string[];
  };
}
