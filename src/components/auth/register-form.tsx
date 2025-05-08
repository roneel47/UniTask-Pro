"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole, Semester } from "@/types";
import { USER_ROLES_OPTIONS, SEMESTERS } from "@/types";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const registerFormSchema = z.object({
  usn: z.string().min(1, "USN is required").max(50, "USN too long"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  password: z.string().min(6, "Password must be at least 6 characters").max(50, "Password too long"),
  role: z.enum(USER_ROLES_OPTIONS).refine(val => val !== 'master-admin', {message: "Cannot register as Master Admin"}),
  semester: z.enum(SEMESTERS),
}).refine(data => data.role === 'student' ? data.semester !== 'N/A' : data.semester === 'N/A', {
  message: "Students must have a semester (1-8). Admins must have semester 'N/A'.",
  path: ["semester"], // This error will be shown under the semester field
});


type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function RegisterForm() {
  const { register, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      usn: "",
      name: "",
      password: "",
      role: "student",
      semester: "1",
    },
  });

  const currentRole = form.watch("role");

  async function onSubmit(values: RegisterFormValues) {
    await register({
      usn: values.usn,
      name: values.name,
      password: values.password,
      role: values.role as UserRole,
      semester: values.semester as Semester,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="usn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>USN</FormLabel>
              <FormControl>
                <Input placeholder="Enter your USN" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password" 
                    {...field} 
                  />
                   <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === 'student') {
                    form.setValue('semester', '1');
                  } else {
                    form.setValue('semester', 'N/A');
                  }
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {USER_ROLES_OPTIONS.filter(role => role !== 'master-admin').map((role) => (
                    <SelectItem key={role} value={role} className="capitalize">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="semester"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Semester</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={currentRole === "admin"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SEMESTERS.map((sem) => (
                    <SelectItem 
                      key={sem} 
                      value={sem}
                      disabled={currentRole === 'admin' && sem !== 'N/A' || currentRole === 'student' && sem === 'N/A'}
                    >
                      {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {currentRole === 'student' ? "Select your current semester." : "Semester is N/A for admins."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
          {isLoading ? "Registering..." : "Register"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Login here
          </Link>
        </p>
      </form>
    </Form>
  );
}