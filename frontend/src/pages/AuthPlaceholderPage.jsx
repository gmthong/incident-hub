import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"


export function AuthPlaceholderPage({title, description}) {
  return (
    <Card className="border-slate-800 bg-white shadow-2xl shadow-black/20">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          Authentication forms begin in Stage 4.
        </div>
      </CardContent>
    </Card>
  )
}
