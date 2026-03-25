import { useEffect, useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  getTaskGroups,
  createTaskGroup,
  updateTaskGroup,
  deleteTaskGroup,
  reorderTaskGroups,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
} from '../api/tasks';

const STATUS_CYCLE = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
const STATUS_LABEL = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
const STATUS_CLASS = {
  todo: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
};

function TaskItem({ task, projectId, groupId, onUpdate, onDelete, dragHandleProps, isDragging }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commitTitle() {
    setEditing(false);
    if (title.trim() === task.title) return;
    if (!title.trim()) { setTitle(task.title); return; }
    await updateTask(projectId, groupId, task.id, { title: title.trim() });
    onUpdate(task.id, { title: title.trim() });
  }

  async function cycleStatus() {
    const next = STATUS_CYCLE[task.status];
    await updateTask(projectId, groupId, task.id, { status: next });
    onUpdate(task.id, { status: next });
  }

  async function handleDelete() {
    if (!window.confirm('Delete this task?')) return;
    await deleteTask(projectId, groupId, task.id);
    onDelete(task.id);
  }

  return (
    <div className={`flex items-center gap-2 py-1.5 px-2 rounded group ${isDragging ? 'opacity-40' : ''}`}>
      <button
        {...dragHandleProps}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      <button
        onClick={cycleStatus}
        className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${STATUS_CLASS[task.status]}`}
        title="Click to advance status"
      >
        {STATUS_LABEL[task.status]}
      </button>
      {editing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setTitle(task.title); setEditing(false); } }}
          className="flex-1 text-sm border-b border-indigo-400 outline-none bg-transparent"
        />
      ) : (
        <span
          className={`flex-1 text-sm cursor-pointer hover:text-indigo-700 ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}
          onClick={() => setEditing(true)}
        >
          {task.title}
        </span>
      )}
      <button
        onClick={handleDelete}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs flex-shrink-0"
        aria-label="Delete task"
      >
        ✕
      </button>
    </div>
  );
}

function SortableTask({ task, projectId, groupId, onUpdate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `task-${task.id}`,
    data: { type: 'task', task, groupId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskItem
        task={task}
        projectId={projectId}
        groupId={groupId}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

function TaskGroupCard({ group, projectId, onUpdateGroup, onDeleteGroup, onAddTask, onUpdateTask, onDeleteTask, dragHandleProps, isDragging }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(group.title);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const titleRef = useRef(null);
  const newTaskRef = useRef(null);

  useEffect(() => {
    if (editingTitle) titleRef.current?.focus();
  }, [editingTitle]);

  useEffect(() => {
    if (addingTask) newTaskRef.current?.focus();
  }, [addingTask]);

  async function commitGroupTitle() {
    setEditingTitle(false);
    if (title.trim() === group.title) return;
    if (!title.trim()) { setTitle(group.title); return; }
    await updateTaskGroup(projectId, group.id, { title: title.trim() });
    onUpdateGroup(group.id, { title: title.trim() });
  }

  async function handleDeleteGroup() {
    if (!window.confirm(`Delete "${group.title}" and all its tasks?`)) return;
    await deleteTaskGroup(projectId, group.id);
    onDeleteGroup(group.id);
  }

  async function submitNewTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const task = await createTask(projectId, group.id, { title: newTaskTitle.trim() });
    onAddTask(group.id, task);
    setNewTaskTitle('');
  }

  const taskIds = group.tasks.map((t) => `task-${t.id}`);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${isDragging ? 'opacity-40' : ''}`}>
      {/* Group header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        <button
          {...dragHandleProps}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
          aria-label="Drag to reorder group"
        >
          ⠿
        </button>
        {editingTitle ? (
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitGroupTitle}
            onKeyDown={(e) => { if (e.key === 'Enter') commitGroupTitle(); if (e.key === 'Escape') { setTitle(group.title); setEditingTitle(false); } }}
            className="flex-1 font-semibold text-sm border-b border-indigo-400 outline-none bg-transparent"
          />
        ) : (
          <span
            className="flex-1 font-semibold text-sm text-gray-800 cursor-pointer hover:text-indigo-700"
            onClick={() => setEditingTitle(true)}
          >
            {group.title}
          </span>
        )}
        <span className="text-xs text-gray-400">{group.tasks.length}</span>
        <button
          onClick={handleDeleteGroup}
          className="text-red-400 hover:text-red-600 text-xs"
          aria-label="Delete group"
        >
          ✕
        </button>
      </div>

      {/* Tasks */}
      <div className="px-1 py-1">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {group.tasks.map((task) => (
            <SortableTask
              key={task.id}
              task={task}
              projectId={projectId}
              groupId={group.id}
              onUpdate={(id, patch) => onUpdateTask(group.id, id, patch)}
              onDelete={(id) => onDeleteTask(group.id, id)}
            />
          ))}
        </SortableContext>

        {/* Add task */}
        {addingTask ? (
          <form onSubmit={submitNewTask} className="flex items-center gap-2 px-2 py-1">
            <input
              ref={newTaskRef}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onBlur={() => { if (!newTaskTitle.trim()) setAddingTask(false); }}
              onKeyDown={(e) => { if (e.key === 'Escape') { setAddingTask(false); setNewTaskTitle(''); } }}
              placeholder="Task name…"
              className="flex-1 text-sm border-b border-gray-300 outline-none bg-transparent py-0.5"
            />
            <button type="submit" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Add</button>
            <button type="button" onClick={() => { setAddingTask(false); setNewTaskTitle(''); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
          </form>
        ) : (
          <button
            onClick={() => setAddingTask(true)}
            className="w-full text-left px-2 py-1 text-xs text-gray-400 hover:text-indigo-600"
          >
            + Add task
          </button>
        )}
      </div>
    </div>
  );
}

function SortableGroup({ group, projectId, onUpdateGroup, onDeleteGroup, onAddTask, onUpdateTask, onDeleteTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `group-${group.id}`,
    data: { type: 'group', group },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskGroupCard
        group={group}
        projectId={projectId}
        onUpdateGroup={onUpdateGroup}
        onDeleteGroup={onDeleteGroup}
        onAddTask={onAddTask}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

export default function TaskBoard({ projectId }) {
  const [groups, setGroups] = useState([]);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [activeItem, setActiveItem] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!projectId) return;
    getTaskGroups(projectId).then(setGroups);
  }, [projectId]);

  async function addGroup(e) {
    e.preventDefault();
    if (!newGroupTitle.trim()) return;
    const group = await createTaskGroup(projectId, { title: newGroupTitle.trim() });
    setGroups((prev) => [...prev, { ...group, tasks: [] }]);
    setNewGroupTitle('');
  }

  function handleUpdateGroup(id, patch) {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function handleDeleteGroup(id) {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  function handleAddTask(groupId, task) {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, tasks: [...g.tasks, task] } : g))
    );
  }

  function handleUpdateTask(groupId, taskId, patch) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) }
          : g
      )
    );
  }

  function handleDeleteTask(groupId, taskId) {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, tasks: g.tasks.filter((t) => t.id !== taskId) } : g
      )
    );
  }

  function handleDragStart(event) {
    setActiveItem(event.active.data.current);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveItem(null);
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData.type === 'group') {
      // Reorder groups
      const oldIdx = groups.findIndex((g) => `group-${g.id}` === active.id);
      const newIdx = groups.findIndex((g) => `group-${g.id}` === over.id);
      if (oldIdx === -1 || newIdx === -1) return;
      const reordered = arrayMove(groups, oldIdx, newIdx);
      setGroups(reordered);
      await reorderTaskGroups(projectId, reordered.map((g) => g.id));
    }

    if (activeData.type === 'task') {
      // Find source group
      const srcGroupId = activeData.groupId;
      const srcGroup = groups.find((g) => g.id === srcGroupId);
      if (!srcGroup) return;

      // Find target group (could be over a task or a group header)
      let dstGroupId = srcGroupId;
      if (overData?.type === 'task') dstGroupId = overData.groupId;
      if (overData?.type === 'group') dstGroupId = overData.group.id;

      if (srcGroupId === dstGroupId) {
        // Same-group reorder
        const group = groups.find((g) => g.id === srcGroupId);
        const oldIdx = group.tasks.findIndex((t) => `task-${t.id}` === active.id);
        const newIdx = group.tasks.findIndex((t) => `task-${t.id}` === over.id);
        if (oldIdx === -1 || newIdx === -1) return;
        const reordered = arrayMove(group.tasks, oldIdx, newIdx);
        setGroups((prev) =>
          prev.map((g) => (g.id === srcGroupId ? { ...g, tasks: reordered } : g))
        );
        await reorderTasks(projectId, srcGroupId, reordered.map((t) => t.id), srcGroupId);
      } else {
        // Cross-group move
        const task = srcGroup.tasks.find((t) => `task-${t.id}` === active.id);
        if (!task) return;
        const newSrcTasks = srcGroup.tasks.filter((t) => t.id !== task.id);
        const dstGroup = groups.find((g) => g.id === dstGroupId);
        const overTaskIdx = dstGroup.tasks.findIndex((t) => `task-${t.id}` === over.id);
        const newDstTasks = [...dstGroup.tasks];
        newDstTasks.splice(overTaskIdx >= 0 ? overTaskIdx : newDstTasks.length, 0, task);
        setGroups((prev) =>
          prev.map((g) => {
            if (g.id === srcGroupId) return { ...g, tasks: newSrcTasks };
            if (g.id === dstGroupId) return { ...g, tasks: newDstTasks };
            return g;
          })
        );
        await reorderTasks(projectId, srcGroupId, newDstTasks.map((t) => t.id), dstGroupId);
      }
    }
  }

  const groupIds = groups.map((g) => `group-${g.id}`);

  return (
    <div className="mt-10">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Groups</h3>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={groupIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {groups.map((group) => (
              <SortableGroup
                key={group.id}
                group={group}
                projectId={projectId}
                onUpdateGroup={handleUpdateGroup}
                onDeleteGroup={handleDeleteGroup}
                onAddTask={handleAddTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeItem?.type === 'group' && (
            <div className="bg-white rounded-lg border border-indigo-300 shadow-lg px-3 py-2 opacity-90">
              <span className="font-semibold text-sm">{activeItem.group.title}</span>
            </div>
          )}
          {activeItem?.type === 'task' && (
            <div className="bg-white rounded border border-indigo-300 shadow-lg px-2 py-1.5 opacity-90">
              <span className="text-sm">{activeItem.task.title}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add group */}
      <form onSubmit={addGroup} className="mt-4 flex gap-2">
        <input
          value={newGroupTitle}
          onChange={(e) => setNewGroupTitle(e.target.value)}
          placeholder="New group name…"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!newGroupTitle.trim()}
          className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-40"
        >
          Add group
        </button>
      </form>
    </div>
  );
}
