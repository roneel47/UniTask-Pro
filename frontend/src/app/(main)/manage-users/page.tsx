"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User, UserRole, Semester } from "@/types";
import { USER_ROLES_OPTIONS, SEMESTERS } from "@/types";
import { useData } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { ChevronUp, Edit3, UserX, ShieldAlert, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MASTER_ADMIN_USN } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export default function ManageUsersPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { users, updateUser, deleteUser, getUsersByFilter, isLoading: dataIsLoading, fetchUsers } = useData(); // Added fetchUsers

  const [filters, setFilters] = useState<{ role?: UserRole, semester?: Semester, usnSearch?: string }>({});
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (currentUser?.role !== "master-admin") {
      router.push("/dashboard");
      toast({ title: "Access Denied", description: "You do not have permission to view this page.", variant: "destructive" });
    } else {
      fetchUsers(); // Fetch users when page loads for master admin
    }
  }, [currentUser, router, fetchUsers]);

  useEffect(() => {
    setFilteredUsers(getUsersByFilter(filters.role, filters.semester, filters.usnSearch));
  }, [filters, users, getUsersByFilter]);

  const handleFilterChange = (key: keyof typeof filters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value === "all" || value === "" ? undefined : value }));
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveChanges = async (updatedFields: Partial<User>) => {
    if (!editingUser) return;
    
    if ((editingUser.id === currentUser?.id || editingUser.usn === MASTER_ADMIN_USN) && updatedFields.role && updatedFields.role !== editingUser.role) {
        toast({ title: "Action Prohibited", description: "Cannot change your own role or the Master Admin's role.", variant: "destructive"});
        return;
    }

    await updateUser(editingUser.id, updatedFields);
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handlePromoteSemester = async (user: User) => {
    if (user.role !== 'student' || !user.semester || user.semester === 'N/A' || parseInt(user.semester, 10) >= 8) {
      toast({ title: "Promotion Error", description: "Cannot promote this user or user is already in the final semester.", variant: "destructive" });
      return;
    }
    const nextSemester = (parseInt(user.semester, 10) + 1).toString() as Semester;
    await updateUser(user.id, { semester: nextSemester });
    toast({ title: "Promotion Successful", description: `${user.usn} promoted to semester ${nextSemester}.` });
  };

  const handleRemoveAdminSemester = async (user: User) => {
    if (user.role !== 'admin' || user.usn === MASTER_ADMIN_USN) {
      toast({ title: "Error", description: "Can only remove semester from non-Master Admins.", variant: "destructive"});
      return;
    }
    await updateUser(user.id, { semester: 'N/A' });
    toast({ title: "Admin Updated", description: `Semester association removed for ${user.usn}.` });
  };

  if (currentUser?.role !== "master-admin") {
    return null; 
  }
  
  if (dataIsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {[...Array(5)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-20" /></TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Users</h1>
      <p className="text-muted-foreground">Oversee all user accounts, adjust roles, and manage semester progression.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded-lg bg-card shadow">
        <Input 
          placeholder="Search by USN..." 
          onChange={(e) => handleFilterChange('usnSearch', e.target.value)} 
          className="bg-background"
        />
        <Select onValueChange={(value) => handleFilterChange('role', value)}>
          <SelectTrigger><SelectValue placeholder="Filter by Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {USER_ROLES_OPTIONS.map(role => <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={(value) => handleFilterChange('semester', value)}>
          <SelectTrigger><SelectValue placeholder="Filter by Semester" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {SEMESTERS.map(sem => <SelectItem key={sem} value={sem}>{sem}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>USN</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? filteredUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.usn}</TableCell>
                <TableCell>{user.name || '-'}</TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell>{user.semester}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)} className="text-primary hover:text-primary/80" title="Edit User">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  {user.role === 'student' && user.semester !== 'N/A' && parseInt(user.semester, 10) < 8 && (
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-500" title="Promote Semester">
                            <ChevronUp className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Promote {user.usn}?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will promote {user.name || user.usn} from semester {user.semester} to {parseInt(user.semester, 10) + 1}. This action is reversible by editing the user.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handlePromoteSemester(user)} className="bg-green-600 hover:bg-green-700">Promote</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {user.role === 'admin' && user.usn !== MASTER_ADMIN_USN && user.semester !== 'N/A' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-orange-500 hover:text-orange-400" title="Remove Semester Association">
                           <RotateCcw className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Remove Semester Association for {user.usn}?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will set {user.name || user.usn}&apos;s semester to &apos;N/A&apos;. Useful for admins not tied to a specific student semester.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveAdminSemester(user)} className="bg-orange-500 hover:bg-orange-600">Confirm</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {user.usn !== MASTER_ADMIN_USN && user.usn !== currentUser?.usn && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" title="Delete User">
                          <UserX className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive"/>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action will permanently delete user {user.usn} ({user.name}) and all their associated tasks. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">Delete User</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User: {editingUser.usn}</DialogTitle>
              <DialogDescription>Make changes to the user&apos;s details.</DialogDescription>
            </DialogHeader>
            <EditUserForm user={editingUser} onSave={handleSaveChanges} onCancel={() => setIsEditModalOpen(false)} currentUser={currentUser}/>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


interface EditUserFormProps {
  user: User;
  onSave: (updatedFields: Partial<User>) => void;
  onCancel: () => void;
  currentUser: User | null;
}

function EditUserForm({ user, onSave, onCancel, currentUser }: EditUserFormProps) {
  const [name, setName] = useState(user.name || "");
  const [role, setRole] = useState<UserRole>(user.role);
  const [semester, setSemester] = useState<Semester>(user.semester);

  const handleSubmit = () => {
    const updates: Partial<User> = {};
    if (name !== (user.name || "")) updates.name = name;
    if (role !== user.role) updates.role = role;
    if (semester !== user.semester) updates.semester = semester;
    
    onSave(updates);
  };
  
  const canChangeRole = user.usn !== MASTER_ADMIN_USN && user.id !== currentUser?.id;

  return (
    <div className="space-y-4 py-4">
      <div>
        <Label htmlFor="edit-name">Name</Label>
        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="edit-role">Role</Label>
        <Select 
            value={role} 
            onValueChange={(value) => {
                setRole(value as UserRole);
                if (value === 'student' && semester === 'N/A') setSemester('1');
                if (value !== 'student') setSemester('N/A');
            }}
            disabled={!canChangeRole}
        >
          <SelectTrigger id="edit-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {USER_ROLES_OPTIONS.filter(r => r !== 'master-admin' || user.usn === MASTER_ADMIN_USN).map(r => (
              <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!canChangeRole && <p className="text-xs text-muted-foreground mt-1">Cannot change role for Master Admin or self.</p>}
      </div>
      <div>
        <Label htmlFor="edit-semester">Semester</Label>
        <Select 
            value={semester} 
            onValueChange={(value) => setSemester(value as Semester)}
            disabled={role !== 'student'}
        >
          <SelectTrigger id="edit-semester">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEMESTERS.map(s => (
              <SelectItem key={s} value={s} disabled={role !== 'student' && s !== 'N/A' || role === 'student' && s === 'N/A'}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
         {role !== 'student' && <p className="text-xs text-muted-foreground mt-1">Semester is fixed to N/A for non-students.</p>}
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
      </div>
    </div>
  );
}
