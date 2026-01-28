import { createClient } from '@/lib/supabase/server'
import { SubscriptionForm } from '@/components/subscriptions/SubscriptionForm'
import { notFound } from 'next/navigation'

export default async function EditSubscriptionPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', id)
        .single()

    if (!subscription) {
        notFound()
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold">Editar Suscripción</h1>
            <SubscriptionForm initialData={subscription} />
        </div>
    )
}
