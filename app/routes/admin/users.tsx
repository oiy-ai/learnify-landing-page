import { useState } from "react";
import { Users, UserPlus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { UserTable } from "~/components/admin/users/UserTable";
import { UserDetail } from "~/components/admin/users/UserDetail";
import { UserEditForm } from "~/components/admin/users/UserEditForm";
import { AgentGenerationForm } from "~/components/admin/users/AgentGenerationForm";
import { AdminPageWrapper } from "~/components/admin/AdminPageWrapper";
import { PERMISSIONS } from "~/lib/permissions";

export default function AdminUsers() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showUserEdit, setShowUserEdit] = useState(false);
  const [showAgentGeneration, setShowAgentGeneration] = useState(false);

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserDetail(true);
  };

  const handleEditUser = (userId: string) => {
    setSelectedUserId(userId);
    setShowUserEdit(true);
  };

  const handleGenerateAgent = (userId: string, userDetail: any) => {
    setSelectedUserId(userId);
    setSelectedUserDetail(userDetail);
    setShowAgentGeneration(true);
  };

  const handleCloseUserDetail = () => {
    setShowUserDetail(false);
    setSelectedUserId(null);
  };

  const handleCloseUserEdit = () => {
    setShowUserEdit(false);
    setSelectedUserId(null);
  };

  const handleCloseAgentGeneration = () => {
    setShowAgentGeneration(false);
    setSelectedUserId(null);
    setSelectedUserDetail(null);
  };

  return (
    <AdminPageWrapper
      requiredPermission={PERMISSIONS.PAGE_ADMIN_USERS}
      pageName="User Management"
      description="This page allows you to view and manage user accounts, roles, and permissions."
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions
            </p>
          </div>
        </div>

        {/* User Table */}
        <UserTable 
          onViewUser={handleViewUser}
          onEditUser={handleEditUser}
          onGenerateAgent={handleGenerateAgent}
        />

        {/* User Detail Modal */}
        <UserDetail
          userId={selectedUserId}
          isOpen={showUserDetail}
          onClose={handleCloseUserDetail}
        />

        {/* User Edit Modal */}
        <UserEditForm
          userId={selectedUserId}
          isOpen={showUserEdit}
          onClose={handleCloseUserEdit}
        />

        {/* Agent Generation Modal */}
        <AgentGenerationForm
          userId={selectedUserId}
          userDetail={selectedUserDetail}
          isOpen={showAgentGeneration}
          onClose={handleCloseAgentGeneration}
        />
      </div>
    </AdminPageWrapper>
  );
}