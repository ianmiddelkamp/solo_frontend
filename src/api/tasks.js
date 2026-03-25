import { apiFetch } from './index';

const base = (projectId) => `/projects/${projectId}/task_groups`;

export const getTaskGroups = (projectId) =>
  apiFetch(base(projectId));

export const createTaskGroup = (projectId, data) =>
  apiFetch(base(projectId), { method: 'POST', body: JSON.stringify({ task_group: data }) });

export const updateTaskGroup = (projectId, id, data) =>
  apiFetch(`${base(projectId)}/${id}`, { method: 'PATCH', body: JSON.stringify({ task_group: data }) });

export const deleteTaskGroup = (projectId, id) =>
  apiFetch(`${base(projectId)}/${id}`, { method: 'DELETE' });

export const reorderTaskGroups = (projectId, ids) =>
  apiFetch(`${base(projectId)}/reorder`, { method: 'PATCH', body: JSON.stringify({ ids }) });

const tasksBase = (projectId, groupId) => `${base(projectId)}/${groupId}/tasks`;

export const createTask = (projectId, groupId, data) =>
  apiFetch(tasksBase(projectId, groupId), { method: 'POST', body: JSON.stringify({ task: data }) });

export const updateTask = (projectId, groupId, id, data) =>
  apiFetch(`${tasksBase(projectId, groupId)}/${id}`, { method: 'PATCH', body: JSON.stringify({ task: data }) });

export const deleteTask = (projectId, groupId, id) =>
  apiFetch(`${tasksBase(projectId, groupId)}/${id}`, { method: 'DELETE' });

export const reorderTasks = (projectId, groupId, ids, targetGroupId) =>
  apiFetch(`${tasksBase(projectId, groupId)}/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ ids, target_group_id: targetGroupId }),
  });
