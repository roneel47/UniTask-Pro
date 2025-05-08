
"use client";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { Logo } from "@/components/common/logo";
import { ThemeToggleButton } from "@/components/layout/theme-toggle-button";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || (!isLoading && isAuthenticated)) {
     return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggleButton />
      </div>
      <div className="w-full max-w-md flex-grow flex items-center justify-center">
        <Card className="shadow-xl w-full">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-6">
              <Logo iconSize={48} /> {/* Adjusted icon size for prominence */}
            </div>
            {children}
          </CardHeader>
        </Card>
      </div>
      <footer className="w-full py-4 text-center text-sm text-muted-foreground">
        © 2025 Roneel V — Built with <span role="img" aria-label="laptop">💻</span> & <span role="img" aria-label="heart">❤️</span> for students, by a student.
      </footer>
    </div>
  );
}

// Shadcn UI components needed for this layout
import { Card, CardHeader } from "@/components/ui/card";
