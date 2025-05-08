"use client";

import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import KanbanColumn from './kanban-column';
import { useData } from '@/hooks/use-data';
import { useAuth } from '@/hooks/use-auth';
import type { Task, TaskStatus } from '@/types';
import { TASK_STATUS_COLUMNS } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface Columns {
  [key: string]: {
    id: TaskStatus;
    title: string;
    tasks: Task[];
  };
}

const KanbanBoard: React.FC = () => {
  const { getTasksForCurrentUser, updateTaskStatus, isLoading: dataIsLoading, tasks: allTasks, fetchTasks } = useData();
  const { currentUser, isLoading: authIsLoading } = useAuth();
  const [columns, setColumns] = useState<Columns>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    if (currentUser) {
      fetchTasks(); // Fetch tasks when current user is available
    }
  }, [currentUser, fetchTasks]);


  useEffect(() => {
    if (!currentUser || authIsLoading || dataIsLoading || !allTasks) return;

    const userTasks = getTasksForCurrentUser();
    
    const initialColumns: Columns = TASK_STATUS_COLUMNS.reduce((acc, status) => {
      acc[status] = { id: status, title: status, tasks: [] };
      return acc;
    }, {} as Columns);

    userTasks.forEach(task => {
      if (initialColumns[task.status]) {
        initialColumns[task.status].tasks.push(task);
      } else {
        initialColumns["To Be Started"].tasks.push(task);
      }
    });
    
    Object.values(initialColumns).forEach(column => {
      column.tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    });

    setColumns(initialColumns);

  }, [currentUser, allTasks, authIsLoading, dataIsLoading, getTasksForCurrentUser]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const startColumn = columns[source.droppableId];
    const finishColumn = columns[destination.droppableId];
    const task = startColumn.tasks.find(t => t.id === draggableId);

    if (!task) return;

    if (currentUser?.role === 'student') {
      if (finishColumn.id === 'Done') return;
      if (startColumn.id === 'Submitted' || startColumn.id === 'Done') return;
    }
    
    // Optimistic UI update
    const newStartTasks = Array.from(startColumn.tasks);
    newStartTasks.splice(source.index, 1);

    const newFinishTasks = Array.from(finishColumn.tasks);
    const movedTask = { ...task, status: finishColumn.id as TaskStatus };
    newFinishTasks.splice(destination.index, 0, movedTask);

    const newColumnsState = {
      ...columns,
      [source.droppableId]: {
        ...startColumn,
        tasks: newStartTasks,
      },
      [destination.droppableId]: {
        ...finishColumn,
        tasks: newFinishTasks,
      },
    };
    setColumns(newColumnsState);
    
    // Call API to update task status
    try {
      await updateTaskStatus(draggableId, finishColumn.id as TaskStatus);
    } catch (error) {
      // Revert UI if API call fails
      setColumns(columns); 
    }
  };

  if (!isClient || authIsLoading || (dataIsLoading && Object.keys(columns).length === 0)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {TASK_STATUS_COLUMNS.map(status => (
          <div key={status} className="p-4 bg-muted/50 rounded-lg shadow">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-24 w-full mb-2 rounded-md" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (Object.keys(columns).length === 0 && !dataIsLoading) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground text-lg">No tasks assigned to you yet.</p>
        <p className="text-sm text-muted-foreground">Try refreshing or check back later.</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 auto-rows-fr">
        {TASK_STATUS_COLUMNS.map(columnId => {
          const column = columns[columnId];
          if (!column) return null; 
          return (
            <KanbanColumn key={column.id} column={column} tasks={column.tasks} />
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
