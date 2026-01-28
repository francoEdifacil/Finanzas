import { createClient } from '@/lib/supabase/server'
import { SubscriptionList } from '@/components/subscriptions/SubscriptionList'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Database } from '@/types/supabase'

type SubscriptionStatus = Database['public']['Enums']['subscription_status']

export default async function SubscriptionsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id as string)

    // Apply filters from params (basic implementation)
    const status = typeof params.status === 'string' ? params.status : undefined
    if (status) {
        query = query.eq('status', status as SubscriptionStatus)
    }

    query = query.order('created_at', { ascending: false })

    const { data: subscriptions } = await query

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Suscripciones</h1>
                <Link href="/subscriptions/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Nueva Suscripción
                    </Button>
                </Link>
            </div>

            <SubscriptionList data={subscriptions || []} />
        </div>
    )
}
