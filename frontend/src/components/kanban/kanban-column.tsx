"use client";

import React from 'react';
import { Draggable } from '@hello-pangea/dnd'; // Droppable is imported in kanban-board.tsx
import TaskCard from './task-card';
import type { Task, TaskStatus } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Droppable } from '@hello-pangea/dnd';


interface KanbanColumnProps {
  column: {
    id: TaskStatus;
    title: string;
  };
  tasks: Task[];
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, tasks }) => {
  return (
    <div className="flex flex-col bg-muted/50 rounded-lg shadow-md h-full min-h-[300px]">
      <h2 className="p-4 text-lg font-semibold text-foreground border-b border-border sticky top-0 bg-muted/80 backdrop-blur-sm rounded-t-lg z-10">
        {column.title} ({tasks.length})
      </h2>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <ScrollArea 
            className="flex-grow p-4"
            style={{ minHeight: '200px' }} // Ensure droppable area has some height
          >
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "space-y-3 min-h-[150px]", // Ensure minimum height for dropping
                snapshot.isDraggingOver ? 'bg-primary/10' : ''
              )}
            >
              {tasks.map((task, index) => (
                <Draggable key={task._id} draggableId={task._id} index={index}>
                  {(providedDraggable, snapshotDraggable) => ( // Renamed to avoid conflict
                    <div
                      ref={providedDraggable.innerRef}
                      {...providedDraggable.draggableProps}
                      {...providedDraggable.dragHandleProps}
                      className={cn(snapshotDraggable.isDragging ? 'shadow-2xl opacity-80' : '')}
                    >
                      <TaskCard task={task} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {tasks.length === 0 && !snapshot.isDraggingOver && (
                 <div className="text-center text-sm text-muted-foreground py-10">
                    No tasks here.
                  </div>
              )}
            </div>
          </ScrollArea>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
