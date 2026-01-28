import { SubscriptionForm } from '@/components/subscriptions/SubscriptionForm'

export default function NewSubscriptionPage() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold">Nueva Suscripción</h1>
            <SubscriptionForm />
        </div>
    )
}
