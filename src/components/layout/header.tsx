"use client";

import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, UserCircle, Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ThemeToggleButton } from "./theme-toggle-button";
import { Logo } from "@/components/common/logo";
import { SidebarTrigger } from "@/components/ui/sidebar"; // For mobile sidebar

export function Header() {
  const { currentUser, logout, isAuthenticated } = useAuth();

  const getInitials = (name?: string, usn?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    if (usn) {
      return usn.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="md:hidden"> {/* Show sidebar trigger only on mobile */}
            <SidebarTrigger />
          </div>
          <Logo />
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggleButton />
          {isAuthenticated && currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-primary hover:border-accent transition-colors">
                    <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${currentUser.name || currentUser.usn}`} alt={currentUser.name || currentUser.usn} />
                    <AvatarFallback>{getInitials(currentUser.name, currentUser.usn)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name || currentUser.usn}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.usn} - {currentUser.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {currentUser.role === "master-admin" && (
                   <Link href="/manage-users">
                    <DropdownMenuItem>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>Manage Users</span>
                    </DropdownMenuItem>
                  </Link>
                )}
                <Link href="/profile"> {/* Assuming a profile page exists or will be created */}
                  <DropdownMenuItem>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings"> {/* Assuming a settings page */}
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}