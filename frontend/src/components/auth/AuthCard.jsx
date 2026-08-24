import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"


export function AuthCard({children, description, title}) {
  return (
    <Card className="border-slate-800 bg-white shadow-2xl shadow-black/20">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  )
}
