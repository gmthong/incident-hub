import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FilePenLine, Search, Users } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/auth/AuthContext"
import { DateTimeDisplay } from "@/components/domain/DateTimeDisplay"
import { UserRoleBadge } from "@/components/domain/UserRoleBadge"
import { UserEditDialog } from "@/components/users/UserEditDialog"
import { EmptyState } from "@/components/feedback/EmptyState"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Skeleton } from "@/components/feedback/Skeleton"
import { PageContainer } from "@/components/layout/PageContainer"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { PageHeader } from "@/components/ui/PageHeader"
import { Select } from "@/components/ui/Select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import { USER_ROLES } from "@/config/constants"
import { apiRequest } from "@/services/apiClient"
import { queryKeys } from "@/services/queryKeys"
import { filterUsers } from "@/utils/users"


function VerificationBadge({isVerified}) {
  return <Badge variant={isVerified ? "emerald" : "amber"}>{isVerified ? "Verified" : "Not verified"}</Badge>
}


function UsersSkeleton() {
  return (
    <PageContainer aria-busy="true" aria-live="polite" role="status">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-3 h-9 w-64" />
      <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
      <Skeleton className="mt-7 h-24" />
      <Skeleton className="mt-6 h-96" />
      <span className="sr-only">Loading users</span>
    </PageContainer>
  )
}


function UserActions({currentUserUid, onSave, user}) {
  return (
    <UserEditDialog
      isCurrentUser={user.uid === currentUserUid}
      onSave={(values) => onSave(user, values)}
      trigger={(
        <Button size="sm" variant="outline">
          <FilePenLine aria-hidden="true" className="size-4" />
          Edit
        </Button>
      )}
      user={user}
    />
  )
}


export function AdminUsersPage() {
  const {refreshUser, user:currentUser} = useAuth()
  const queryClient = useQueryClient()
  const [role, setRole] = useState("")
  const [search, setSearch] = useState("")
  const [verification, setVerification] = useState("")
  const isAdmin = currentUser?.role === USER_ROLES.ADMIN
  const usersQuery = useQuery({
    enabled:isAdmin,
    queryFn:({signal}) => apiRequest("users/", {signal}),
    queryKey:queryKeys.users.all,
  })
  const updateMutation = useMutation({
    mutationFn:({userUid, values}) => apiRequest(`users/${userUid}`, {body:values, method:"PATCH"}),
  })
  const users = useMemo(
    () => Array.isArray(usersQuery.data) ? usersQuery.data : [],
    [usersQuery.data],
  )
  const visibleUsers = useMemo(
    () => filterUsers(users, {role, search, verification}),
    [role, search, users, verification],
  )

  useEffect(() => {
    if (usersQuery.error?.status === 403) {
      refreshUser().catch(() => undefined)
    }
  }, [refreshUser, usersQuery.error])

  async function updateUser(selectedUser, values) {
    const updatedUser = await updateMutation.mutateAsync({userUid:selectedUser.uid, values})
    queryClient.setQueryData(queryKeys.users.all, (currentUsers=[]) => (
      currentUsers.map((user) => user.uid === updatedUser.uid ? updatedUser : user)
    ))
    queryClient.setQueryData(queryKeys.users.detail(updatedUser.uid), updatedUser)
    if (updatedUser.uid === currentUser.uid) {
      await refreshUser()
    }
    toast.success("User updated")
  }

  if (usersQuery.isPending) {
    return <UsersSkeleton />
  }

  if (usersQuery.isError) {
    return (
      <PageContainer>
        <PageHeader
          description="Manage supported account information and access roles."
          eyebrow="Administration"
          title="Users"
        />
        <ErrorState
          className="mt-8 max-w-none"
          description={usersQuery.error?.status === 403
            ? "Your account no longer has permission to manage users. Refreshing your current role…"
            : "IncidentHub could not retrieve the user directory."}
          onRetry={usersQuery.error?.status === 403 ? undefined : usersQuery.refetch}
          title={usersQuery.error?.status === 403 ? "Administration access changed" : "Could not load users"}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        description="Search accounts and update supported profile fields or access roles. Email and verification remain read-only."
        eyebrow="Administration"
        title="Users"
      />

      <section aria-label="User filters" className="mt-7 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[var(--shadow-surface)] md:grid-cols-3">
        <label className="relative">
          <span className="sr-only">Search users</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, or UUID" value={search} />
        </label>
        <label>
          <span className="sr-only">Filter by role</span>
          <Select onChange={(event) => setRole(event.target.value)} value={role}>
            <option value="">All roles</option>
            <option value={USER_ROLES.ENGINEER}>Engineer</option>
            <option value={USER_ROLES.LEADER}>Leader</option>
            <option value={USER_ROLES.ADMIN}>Admin</option>
          </Select>
        </label>
        <label>
          <span className="sr-only">Filter by verification</span>
          <Select onChange={(event) => setVerification(event.target.value)} value={verification}>
            <option value="">All verification states</option>
            <option value="verified">Verified</option>
            <option value="unverified">Not verified</option>
          </Select>
        </label>
      </section>

      <p className="mt-5 text-sm text-slate-600">Showing <span className="font-semibold text-slate-900">{visibleUsers.length}</span> of {users.length} users</p>

      {visibleUsers.length === 0 ? (
        <EmptyState
          action={(
            <button
              className="text-sm font-medium text-blue-700 hover:text-blue-800"
              onClick={() => { setSearch(""); setRole(""); setVerification("") }}
              type="button"
            >
              Clear filters
            </button>
          )}
          className="mt-5 max-w-none"
          description="No users match the current search and filters."
          icon={Users}
          title="No matching users"
        />
      ) : (
        <>
          <div className="mt-5 hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell>
                      <p className="font-medium text-slate-950">{user.username}{user.uid === currentUser.uid ? " (You)" : ""}</p>
                      <p className="mt-1 text-xs text-slate-500">{[user.first_name, user.last_name].filter(Boolean).join(" ") || "Name not provided"}</p>
                      <p className="mt-1 text-xs text-slate-500">{user.email}</p>
                    </TableCell>
                    <TableCell><UserRoleBadge role={user.role} /></TableCell>
                    <TableCell><VerificationBadge isVerified={user.is_verified} /></TableCell>
                    <TableCell><DateTimeDisplay value={user.created_at} /></TableCell>
                    <TableCell className="text-right"><UserActions currentUserUid={currentUser.uid} onSave={updateUser} user={user} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-5 grid gap-4 lg:hidden">
            {visibleUsers.map((user) => (
              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-[var(--shadow-surface)]" key={user.uid}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-950">{user.username}{user.uid === currentUser.uid ? " (You)" : ""}</p>
                    <p className="mt-1 break-all text-sm text-slate-600">{user.email}</p>
                  </div>
                  <UserRoleBadge role={user.role} />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <VerificationBadge isVerified={user.is_verified} />
                  <UserActions currentUserUid={currentUser.uid} onSave={updateUser} user={user} />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  )
}
