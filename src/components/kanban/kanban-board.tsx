"use client";

import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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
  const { getTasksForCurrentUser, updateTaskStatus, isLoading: dataIsLoading, tasks: allTasks } = useData();
  const { currentUser, isLoading: authIsLoading } = useAuth();
  const [columns, setColumns] = useState<Columns>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!currentUser || authIsLoading || dataIsLoading) return;

    const userTasks = getTasksForCurrentUser();
    
    const initialColumns: Columns = TASK_STATUS_COLUMNS.reduce((acc, status) => {
      acc[status] = { id: status, title: status, tasks: [] };
      return acc;
    }, {} as Columns);

    userTasks.forEach(task => {
      if (initialColumns[task.status]) {
        initialColumns[task.status].tasks.push(task);
      } else {
        // Handle tasks with unknown status if any, perhaps put them in "To Be Started"
        initialColumns["To Be Started"].tasks.push(task);
      }
    });
    
    // Sort tasks within each column by due date (soonest first)
    Object.values(initialColumns).forEach(column => {
      column.tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    });

    setColumns(initialColumns);

  }, [currentUser, allTasks, authIsLoading, dataIsLoading, getTasksForCurrentUser]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const startColumn = columns[source.droppableId];
    const finishColumn = columns[destination.droppableId];
    const task = startColumn.tasks.find(t => t.id === draggableId);

    if (!task) return;

    // Student restrictions
    if (currentUser?.role === 'student') {
      if (finishColumn.id === 'Done') {
        // Students cannot move tasks to 'Done'
        return;
      }
      if (startColumn.id === 'Submitted' || startColumn.id === 'Done') {
        // Students cannot move tasks back from 'Submitted' or 'Done'
        return;
      }
    }
    
    // Admin restrictions (can move anything except from 'Done' if they are not Master Admin, unless it's a task they submitted for themselves perhaps)
    // This logic can be expanded. For now, basic student restrictions are key.

    const newStartTasks = Array.from(startColumn.tasks);
    newStartTasks.splice(source.index, 1);

    const newFinishTasks = Array.from(finishColumn.tasks);
    newFinishTasks.splice(destination.index, 0, task);

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
    
    // If moved to a different column, update task status
    if (startColumn.id !== finishColumn.id) {
      task.status = finishColumn.id as TaskStatus;
      updateTaskStatus(draggableId, finishColumn.id as TaskStatus);
    }
    
    setColumns(newColumnsState);
  };

  if (!isClient || authIsLoading || dataIsLoading) {
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

  if (Object.keys(columns).length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground text-lg">No tasks assigned to you yet, or tasks are still loading.</p>
        <p className="text-sm text-muted-foreground">Try refreshing or check back later.</p>
      </div>
    );
  }


  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 auto-rows-fr">
        {TASK_STATUS_COLUMNS.map(columnId => {
          const column = columns[columnId];
          if (!column) return null; // Should not happen if columns are initialized correctly
          return (
            <KanbanColumn key={column.id} column={column} tasks={column.tasks} />
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;