import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { 
  MoreHorizontal, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  Shield,
  ShieldCheck,
  ShieldX,
  Bot,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";

interface UserTableProps {
  onViewUser: (userId: string) => void;
  onEditUser: (userId: string) => void;
  onGenerateAgent: (userId: string, userDetail: any) => void;
}

export function UserTable({ onViewUser, onEditUser, onGenerateAgent }: UserTableProps) {
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Queries
  const usersData = useQuery(
    api.users.getAllUsers,
    user?.id ? {
      adminId: user.id,
      search: search || undefined,
      role: roleFilter === "all" ? undefined : roleFilter,
      isActive: statusFilter === "active" ? true : statusFilter === "inactive" ? false : undefined,
      limit: pageSize,
      offset: currentPage * pageSize,
    } : "skip"
  );

  const userStats = useQuery(
    api.users.getUserStats,
    user?.id ? { adminId: user.id } : "skip"
  );

  // Mutations
  const updateUserStatus = useMutation(api.users.updateUserStatus);
  const deleteUser = useMutation(api.users.deleteUser);

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    if (!user?.id) return;
    
    try {
      await updateUserStatus({
        adminId: user.id,
        userId,
        isActive,
        reason: isActive ? "Activated by admin" : "Deactivated by admin",
      });
    } catch (error) {
      console.error("Failed to update user status:", error);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!user?.id) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete user "${userName}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      await deleteUser({
        adminId: user.id,
        userId,
        reason: "Deleted by admin",
      });
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const getRoleColor = (role?: string, adminRole?: string) => {
    if (adminRole === "super_admin") return "destructive";
    if (adminRole === "admin") return "default";
    if (adminRole === "support") return "secondary";
    if (role === "admin" || role === "super_admin") return "default";
    return "outline";
  };

  const getRoleLabel = (role?: string, adminRole?: string) => {
    if (adminRole) return adminRole.replace("_", " ");
    return role || "user";
  };

  const getStatusColor = (isActive?: boolean) => {
    if (isActive === false) return "destructive";
    return "default";
  };

  const users = usersData?.users || [];
  const total = usersData?.total || 0;
  const hasMore = usersData?.hasMore || false;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {userStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border p-3">
            <div className="text-2xl font-bold">{userStats.total}</div>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-2xl font-bold text-green-600">{userStats.active}</div>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-2xl font-bold text-blue-600">{userStats.admins}</div>
            <p className="text-xs text-muted-foreground">Admin Users</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-2xl font-bold text-orange-600">{userStats.newThisWeek}</div>
            <p className="text-xs text-muted-foreground">New This Week</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{user.name || "No name"}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getRoleColor(user.role, user.adminRecord?.role)} className="capitalize">
                    {getRoleLabel(user.role, user.adminRecord?.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(user.isActive)}>
                    {user.isActive === false ? "Inactive" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.retell_agent_id ? "default" : "outline"}>
                      {user.retell_agent_id ? "Generated" : "None"}
                    </Badge>
                    {user.retell_api_key && !user.retell_agent_id && (
                      <Badge variant="secondary" className="text-xs">
                        Ready
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "Unknown"
                  }
                </TableCell>
                <TableCell>
                  {user.lastLoginAt 
                    ? new Date(user.lastLoginAt).toLocaleDateString()
                    : "Never"
                  }
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onViewUser(user.tokenIdentifier)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditUser(user.tokenIdentifier)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onGenerateAgent(user.tokenIdentifier, user)}>
                        <Bot className="mr-2 h-4 w-4" />
                        Manage Agent
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.isActive !== false ? (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(user.tokenIdentifier, false)}
                          className="text-orange-600"
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(user.tokenIdentifier, true)}
                          className="text-green-600"
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Activate
                        </DropdownMenuItem>
                      )}
                      {user.role !== "super_admin" && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user.tokenIdentifier, user.name || user.email || "Unknown")}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, total)} of {total} users
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!hasMore}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}