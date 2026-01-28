import { Database } from '@/types/supabase'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

export function normalizeCost(amount: number, billing: string): number {
    switch (billing) {
        case 'monthly':
            return amount
        case 'yearly':
            return amount / 12
        case 'weekly':
            return amount * 4.34524 // Standard weeks in a month
        case 'one_time':
            return 0 // One time purchases usually don't count towards monthly recurring revenue/cost
        default:
            return amount
    }
}

export function calculateKPIs(subscriptions: Subscription[]) {
    let monthlyTotal = 0
    let activeCount = 0

    subscriptions.forEach(sub => {
        if (sub.status === 'active') {
            activeCount++
            monthlyTotal += normalizeCost(sub.amount, sub.billing)
        }
    })

    return {
        monthlyTotal,
        yearlyTotal: monthlyTotal * 12,
        activeCount,
    }
}
