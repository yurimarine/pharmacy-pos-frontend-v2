import { getCurrentUser } from '@/lib/get-current-user'
import { getDiscounts } from './actions'
import { DiscountsPageClient } from '@/components/discounts/DiscountsPageClient'

export default async function DiscountsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string
    scope?: string
    type?: string
    isActive?: string
    page?: string
  }>
}) {
  const params = await searchParams
  await getCurrentUser()

  const page = Math.max(1, Number(params.page ?? 1))
  const pageSize = 20

  const { data, count } = await getDiscounts({
    search: params.search,
    scope: params.scope,
    type: params.type,
    isActive: params.isActive,
    page,
    pageSize,
  })

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Discounts</h1>
        <p className="text-sm text-muted-foreground">
          Manage discount types available at the POS terminal.
        </p>
      </div>

      <DiscountsPageClient
        data={data}
        count={count}
        currentSearch={params.search ?? ''}
        currentScope={params.scope ?? 'all'}
        currentType={params.type ?? 'all'}
        currentIsActive={params.isActive ?? 'all'}
        currentPage={page}
        pageSize={pageSize}
      />
    </div>
  )
}
