import { LoginForm } from "@/components/login-form"

export default function Page() {
  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-2xl font-bold tracking-tight">PharmaCare POS</h1>
        <p className="text-sm text-muted-foreground">Pharmacy Management System</p>
      </div>
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
