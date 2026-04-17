import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/get-current-user'
import { POSHeader } from '@/components/pos/POSHeader'

export default async function POSTerminalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let currentUser
  try {
    currentUser = await getCurrentUser()
  } catch {
    redirect('/auth/login')
  }

  const posUser = {
    name: currentUser.name,
    email: currentUser.email,
    avatar: '',
    role: currentUser.role,
  }

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <POSHeader user={posUser} />
      <main className="flex flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
