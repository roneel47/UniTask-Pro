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
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CalendarIcon, Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useData } from "@/hooks/use-data";
import type { Semester } from "@/types";
import { SEMESTERS } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react"; // Removed duplicate import of use-toast
import { toast } from "@/hooks/use-toast"; // Keep this one
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MASTER_ADMIN_USN } from "@/lib/constants";


const taskFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  dueDate: z.date({ required_error: "Due date is required."}),
  assignedToSemester: z.enum(SEMESTERS),
  assignmentType: z.enum(["all", "specific"]),
  assignedToUsn: z.string().optional(),
}).refine(data => {
    if (data.assignmentType === "specific") {
        return !!data.assignedToUsn && data.assignedToUsn.trim() !== "";
    }
    return true;
}, {
    message: "USN is required for specific assignment type.",
    path: ["assignedToUsn"],
}).refine(data => {
    if (data.assignedToSemester === 'N/A' && data.assignmentType === 'all') {
        return false; // Cannot assign to "all" for N/A semester
    }
    return true;
}, {
    message: "Cannot assign to 'All Users' for 'N/A' semester. Select a specific USN for admins.",
    path: ["assignedToSemester"],
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function CreateTaskPage() {
  const { currentUser } = useAuth();
  const { addTask, addTaskAssignmentMeta, users, isLoading: dataIsLoading, fetchUsers } = useData(); // Added fetchUsers
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentUsnList, setStudentUsnList] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (currentUser && (currentUser.role === "student" || currentUser.usn === MASTER_ADMIN_USN)) {
      toast({ title: "Access Denied", description: "Only regular Admins can create tasks.", variant: "destructive" });
      router.push("/dashboard");
    } else if(currentUser) {
      fetchUsers(); // Fetch users if admin is allowed to create tasks
    }
  }, [currentUser, router, fetchUsers]);

  useEffect(() => {
    if (users.length > 0) {
        const studentList = users
            .filter(u => u.role === 'student' || (u.role === 'admin' && u.usn !== MASTER_ADMIN_USN)) 
            .map(u => ({ value: u.usn.toLowerCase(), label: `${u.usn} (${u.name || 'User'}) - Sem: ${u.semester}` }));
        setStudentUsnList(studentList);
    }
  }, [users]);


  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: startOfDay(addDays(new Date(), 7)),
      assignedToSemester: "1",
      assignmentType: "all",
      assignedToUsn: "",
    },
  });
  
  const assignmentType = form.watch("assignmentType");
  const selectedSemester = form.watch("assignedToSemester");

  async function onSubmit(values: TaskFormValues) {
    if (!currentUser || currentUser.role === "student" || currentUser.usn === MASTER_ADMIN_USN) return;
    setIsSubmitting(true);

    const taskAssignmentPayload = {
      title: values.title,
      description: values.description,
      dueDate: format(values.dueDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      assignedToSemester: values.assignedToSemester,
      assignedToTarget: values.assignmentType === "all" ? "all" : values.assignedToUsn!.toUpperCase(),
      assigningAdminUsn: currentUser.usn,
    };
    
    // First, create the task assignment meta
    const createdMeta = await addTaskAssignmentMeta(taskAssignmentPayload);

    if (createdMeta) {
        // Then, create the actual tasks for users based on this meta
        const taskCreationSuccess = await addTask({
            title: values.title,
            description: values.description,
            dueDate: format(values.dueDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
            assignedToSemester: values.assignedToSemester,
            assignedToUsn: values.assignmentType === "all" ? "all" : values.assignedToUsn!.toUpperCase(),
            assigningAdminUsn: currentUser.usn,
            taskAssignmentMetaId: createdMeta.id, // Link task to its meta
        });
        
        if (taskCreationSuccess) {
            toast({ title: "Task Created Successfully!", description: `Task "${values.title}" has been assigned.` });
            router.push("/dashboard");
        } else {
            // Potentially roll back meta creation or handle error
            toast({ title: "Task Creation Failed", description: "Could not create individual tasks. Meta assignment was created but tasks may not be assigned.", variant: "destructive" });
        }
    } else {
      toast({ title: "Task Creation Failed", description: "Could not create task assignment meta. Please try again.", variant: "destructive" });
    }
    setIsSubmitting(false);
  }
  
  if (currentUser && (currentUser.role === "student" || currentUser.usn === MASTER_ADMIN_USN)) {
    return null; 
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-4 md:p-0">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
          <PlusCircle className="mr-3 h-8 w-8 text-primary" /> Create New Task
        </h1>
        <p className="text-muted-foreground">
          Fill in the details below to assign a new task.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 rounded-lg shadow-lg">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Complete Chapter 5 Reading" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Provide a detailed description of the task..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < startOfDay(new Date())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="assignedToSemester"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Semester</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SEMESTERS.map((sem) => (
                      <SelectItem key={sem} value={sem}>{sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Tasks will be assigned to users in this semester.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="assignmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assignment Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignment type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All Users in Semester</SelectItem>
                    <SelectItem value="specific">Specific User (by USN)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {assignmentType === "specific" && (
            <FormField
              control={form.control}
              name="assignedToUsn"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Assign to USN</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                                )}
                            >
                                {field.value
                                ? studentUsnList.find(
                                    (usn) => usn.value === field.value?.toLowerCase()
                                    )?.label || field.value.toUpperCase()
                                : "Select USN"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                            <Command>
                                <CommandInput placeholder="Search USN..." />
                                <CommandList>
                                    <CommandEmpty>No USN found.</CommandEmpty>
                                    <CommandGroup>
                                    {studentUsnList
                                      .filter(usnEntry => {
                                        const userDetails = users.find(u => u.usn.toLowerCase() === usnEntry.value);
                                        if (!userDetails) return false;
                                        return selectedSemester === 'N/A' ? userDetails.role === 'admin' : userDetails.semester === selectedSemester;
                                      })
                                      .map((usnEntry) => (
                                        <CommandItem
                                        value={usnEntry.label}
                                        key={usnEntry.value}
                                        onSelect={() => {
                                            form.setValue("assignedToUsn", usnEntry.value.toUpperCase());
                                        }}
                                        >
                                        <Check
                                            className={cn(
                                            "mr-2 h-4 w-4",
                                            usnEntry.value === field.value?.toLowerCase()
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                        />
                                        {usnEntry.label}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                  <FormDescription>
                    Enter the USN of the specific user. Ensure they are in the selected semester, or 'N/A' if assigning to an admin.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting || dataIsLoading}>
            {isSubmitting ? "Assigning Task..." : "Assign Task"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
