"use client";

import React, { useState, useEffect } from 'react';
import type { Task } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, differenceInHours, format, parseISO } from 'date-fns';
import { CalendarDays, FileText, Paperclip, UploadCloud, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useData } from '@/hooks/use-data';
import { useAuth } from '@/hooks/use-auth';
import { toast } from '@/hooks/use-toast';
import { Label } from '../ui/label';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { updateTask, updateTaskStatus } = useData();
  const { currentUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dueDateColor, setDueDateColor] = useState<'red' | 'yellow' | 'white'>('white');
  const [parsedDueDate, setParsedDueDate] = useState<Date | null>(null);

  useEffect(() => {
    try {
        const date = parseISO(task.dueDate);
        setParsedDueDate(date);
        const now = new Date();
        const hoursLeft = differenceInHours(date, now);
        const daysLeft = differenceInDays(date, now);

        if (hoursLeft < 24 && hoursLeft >= 0) {
            setDueDateColor('red');
        } else if (daysLeft >= 1 && daysLeft <= 3) {
            setDueDateColor('yellow');
        } else if (hoursLeft < 0) {
            setDueDateColor('red'); // Overdue also red
        }
         else {
            setDueDateColor('white');
        }
    } catch (error) {
        console.error("Error parsing due date:", task.dueDate, error);
        // Keep default white or handle error appropriately
    }
  }, [task.dueDate]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }
    // Simulate file upload
    await updateTask(task.id, { submissionFile: selectedFile.name });
    await updateTaskStatus(task.id, "Submitted");
    toast({ title: "File Uploaded", description: `${selectedFile.name} submitted for task "${task.title}".` });
    setSelectedFile(null);
    setIsDialogOpen(false);
  };

  const canUpload = currentUser?.role === 'student' && (task.status === 'Completed' || task.status === 'In Progress');
  
  const cardBorderColor = 
    dueDateColor === 'red' ? 'border-red-500 dark:border-red-400' :
    dueDateColor === 'yellow' ? 'border-yellow-500 dark:border-yellow-400' :
    'border-border';

  return (
    <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-200 ${cardBorderColor} border-l-4`}>
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="text-base font-semibold leading-tight">{task.title}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground line-clamp-2">{task.description}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        <div className="flex items-center text-xs text-muted-foreground">
          <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
          Due: {parsedDueDate ? format(parsedDueDate, 'MMM d, yyyy') : 'Invalid Date'}
          {dueDateColor === 'red' && <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0.5">Urgent</Badge>}
          {dueDateColor === 'yellow' && <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0.5 border-yellow-500 text-yellow-600 dark:text-yellow-400">Soon</Badge>}
        </div>
         <div className="flex items-center text-xs text-muted-foreground">
          <User className="mr-1.5 h-3.5 w-3.5" />
          Assigned by: {task.assigningAdminUsn}
        </div>
        {task.submissionFile && (
          <div className="flex items-center text-xs text-green-600 dark:text-green-400">
            <Paperclip className="mr-1.5 h-3.5 w-3.5" />
            Submitted: {task.submissionFile}
          </div>
        )}
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0">
        {canUpload && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full text-accent border-accent hover:bg-accent/10 hover:text-accent">
                <UploadCloud className="mr-2 h-4 w-4" /> Upload Submission
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Upload Submission for: {task.title}</DialogTitle>
                <DialogDescription>
                  Select a file to upload. This will move the task to &apos;Submitted&apos;.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="file-upload" className="text-right col-span-1">
                    File
                  </Label>
                  <Input id="file-upload" type="file" onChange={handleFileChange} className="col-span-3" />
                </div>
                {selectedFile && <p className="text-sm text-muted-foreground col-span-4">Selected: {selectedFile.name}</p>}
              </div>
              <Button onClick={handleFileUpload} disabled={!selectedFile} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                <UploadCloud className="mr-2 h-4 w-4" /> Upload and Submit
              </Button>
            </DialogContent>
          </Dialog>
        )}
        {task.status === 'Submitted' && !canUpload && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white text-xs">
                <FileText className="mr-1 h-3 w-3"/> Awaiting Review
            </Badge>
        )}
        {task.status === 'Done' && (
            <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                Completed
            </Badge>
        )}
      </CardFooter>
    </Card>
  );
};

export default TaskCard;