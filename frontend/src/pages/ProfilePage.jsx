import { CircleCheck } from "lucide-react"

import { useAuth } from "@/auth/AuthContext"
import { DateTimeDisplay } from "@/components/domain/DateTimeDisplay"
import { UserRoleBadge } from "@/components/domain/UserRoleBadge"
import { InlineAlert } from "@/components/feedback/InlineAlert"
import { PageContainer } from "@/components/layout/PageContainer"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { DataList } from "@/components/ui/DataList"
import { PageHeader } from "@/components/ui/PageHeader"


function displayValue(value) {
  return value || <span className="text-slate-500">Not provided</span>
}


function profileInitials(user) {
  const names = [user.first_name, user.last_name].filter(Boolean)
  if (names.length > 0) {
    return names.map((name) => name[0]).join("").slice(0, 2).toUpperCase()
  }

  return (user.username || user.email).slice(0, 2).toUpperCase()
}


export function ProfilePage() {
  const {user} = useAuth()
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Name not provided"
  const profileItems = [
    {label:"Username", value:user.username},
    {label:"Email", value:user.email},
    {label:"First name", value:displayValue(user.first_name)},
    {label:"Last name", value:displayValue(user.last_name)},
    {label:"Role", value:<UserRoleBadge role={user.role} />},
    {
      label:"Verification",
      value:user.is_verified
        ? <Badge className="gap-1" variant="emerald"><CircleCheck aria-hidden="true" className="size-3.5" /> Verified</Badge>
        : <Badge variant="amber">Not verified</Badge>,
    },
    {label:"User ID", value:<code className="break-all text-xs text-slate-700">{user.uid}</code>},
    {label:"Account created", value:<DateTimeDisplay value={user.created_at} />},
    {label:"Last updated", value:<DateTimeDisplay value={user.updated_at} />},
  ]

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        eyebrow="Your account"
        title="Profile"
        description="Review the identity and access information associated with your IncidentHub account."
      />

      <div className="mt-7 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardContent className="text-center">
            <span className="mx-auto grid size-20 place-items-center rounded-2xl bg-slate-900 text-xl font-semibold text-white shadow-lg shadow-slate-200">
              {profileInitials(user)}
            </span>
            <h2 className="mt-4 font-semibold text-slate-950">{fullName}</h2>
            <p className="mt-1 break-all text-sm text-slate-600">{user.email}</p>
            <div className="mt-4 flex justify-center"><UserRoleBadge role={user.role} /></div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <DataList items={profileItems} />
          <InlineAlert title="Read-only account information">
            IncidentHub does not currently provide self-service profile editing. An administrator can update supported account fields when necessary.
          </InlineAlert>
        </div>
      </div>
    </PageContainer>
  )
}
