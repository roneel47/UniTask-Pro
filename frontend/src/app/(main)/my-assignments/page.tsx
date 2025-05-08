"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useData } from "@/hooks/use-data";
import type { TaskAssignmentMeta } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { Trash2, Users, User, ListChecks, ShieldAlert } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyAssignmentsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { taskAssignmentsMeta, deleteTaskAssignmentMetaAndTasks, isLoading: dataIsLoading, fetchTaskAssignmentsMeta } = useData(); // Added fetchTaskAssignmentsMeta
  const [myAssignments, setMyAssignments] = useState<TaskAssignmentMeta[]>([]);

  useEffect(() => {
    if (currentUser && (currentUser.role === "student" || currentUser.role === 'master-admin')) {
      toast({ title: "Access Denied", description: "This page is for Admins to view their created assignments.", variant: "destructive"});
      router.push("/dashboard");
    } else if (currentUser) {
        fetchTaskAssignmentsMeta(); // Fetch assignments when page loads for admin
    }
  }, [currentUser, router, fetchTaskAssignmentsMeta]);

  useEffect(() => {
    if (currentUser) {
      setMyAssignments(taskAssignmentsMeta.filter(meta => meta.assigningAdminUsn === currentUser.usn));
    }
  }, [taskAssignmentsMeta, currentUser]);

  if (!currentUser || currentUser.role === "student") {
    return null; 
  }
  
  if (dataIsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">My Task Assignments</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">My Task Assignments</h1>
      <p className="text-muted-foreground">
        View and manage the unique task assignments you have created. Deleting an assignment here will remove it for all assigned users.
      </p>

      {myAssignments.length === 0 ? (
        <div className="text-center py-10 bg-card rounded-lg shadow">
            <ListChecks className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl font-semibold text-foreground">No Assignments Found</p>
            <p className="text-muted-foreground">You haven&apos;t created any task assignments yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myAssignments.sort((a,b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime()).map(meta => (
            <Card key={meta.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">{meta.title}</CardTitle>
                <CardDescription>
                  Created on: {format(parseISO(meta.createdAt), "MMM d, yyyy HH:mm")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 flex-grow">
                <p className="text-sm line-clamp-3">{meta.description}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center"><Users className="w-3.5 h-3.5 mr-1.5"/> Semester: {meta.assignedToSemester}</p>
                    <p className="flex items-center"><User className="w-3.5 h-3.5 mr-1.5"/> Target: {meta.assignedToTarget === 'all' ? 'All Students' : meta.assignedToTarget}</p>
                    <p>Due: {format(parseISO(meta.dueDate), "MMM d, yyyy")}</p>
                </div>
              </CardContent>
              <CardFooter>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Assignment
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive"/>Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the assignment &quot;{meta.title}&quot;? This will remove the task from all users it was assigned to. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteTaskAssignmentMetaAndTasks(meta.id)} className="bg-destructive hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
