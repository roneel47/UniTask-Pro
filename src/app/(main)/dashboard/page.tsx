"use client";

import KanbanBoard from "@/components/kanban/kanban-board";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { fetchTasks, isLoading: dataLoading } = useData();

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "master-admin";

  if (dataLoading && !currentUser) { // Show skeleton if data is loading and user info isn't available yet
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 bg-card rounded-lg shadow">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-20 w-full mb-2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Task Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome, {currentUser?.name || currentUser?.usn}! Manage your tasks efficiently.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link href="/tasks/new" passHref>
              <Button variant="default" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Task
              </Button>
            </Link>
          )}
           <Button variant="outline" onClick={fetchTasks} disabled={dataLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
            Refresh Tasks
          </Button>
        </div>
      </div>
      
      <KanbanBoard />
    </div>
  );
}