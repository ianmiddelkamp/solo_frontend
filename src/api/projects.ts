import { apiFetch } from './index';
import type { Project } from '../types';

export const getProjects = () => apiFetch<Project[]>('/projects');
export const getProject = (id: number) => apiFetch<Project>(`/projects/${id}`);
export const createProject = (data: Partial<Project>) => apiFetch<Project>('/projects', { method: 'POST', body: JSON.stringify({ project: data }) });
export const updateProject = (id: number, data: Partial<Project>) => apiFetch<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify({ project: data }) });
export const deleteProject = (id: number) => apiFetch(`/projects/${id}`, { method: 'DELETE' });
