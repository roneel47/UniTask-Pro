"use client";

import { Header } from "@/components/layout/header";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { LayoutDashboard, ListChecks, PlusCircle, Users, BookUser, LogOutIcon } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, currentUser, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
       <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </header>
        <div className="flex flex-1">
          <aside className="hidden md:block w-64 border-r p-4">
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-full mb-2" />
          </aside>
          <main className="flex-1 p-6">
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </div>
    );
  }
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'master-admin';
  const isMasterAdmin = currentUser?.role === 'master-admin';

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          {/* Mobile only trigger is handled inside Header component now */}
          <div className="hidden md:flex items-center justify-between"> {/* Hide Logo on mobile sidebar header, show it in main Header */}
             <Logo textSize="text-lg" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/dashboard" passHref>
                <SidebarMenuButton tooltip="Dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            
            {isAdmin && (
              <SidebarMenuItem>
                <Link href="/tasks/new" passHref>
                  <SidebarMenuButton tooltip="Create Task">
                    <PlusCircle />
                    <span>Create Task</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )}

            {isAdmin && !isMasterAdmin && (
              <SidebarMenuItem>
                <Link href="/my-assignments" passHref>
                  <SidebarMenuButton tooltip="My Assignments">
                    <BookUser />
                    <span>My Assignments</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )}
            
            {isMasterAdmin && (
              <SidebarMenuItem>
                <Link href="/manage-users" passHref>
                  <SidebarMenuButton tooltip="Manage Users">
                    <Users />
                    <span>Manage Users</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout} tooltip="Logout">
                <LogOutIcon />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}