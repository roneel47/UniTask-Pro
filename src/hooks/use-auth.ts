"use client";
import { useContext } from 'react';
import { AuthProvider, useAuth as useAuthContext } from '@/contexts/auth-context'; // Assuming AuthProvider is exported if needed elsewhere, or adjust path

// Export useAuth directly from the context file's hook
export { useAuthContext as useAuth };