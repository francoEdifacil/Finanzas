import { createClient } from '@/lib/supabase/server'
import { calculateKPIs, normalizeCost } from '@/lib/normalize'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, LayoutDashboard } from 'lucide-react'
import { Database } from '@/types/supabase'

type Subscription = Database['public']['Tables']['subscriptions']['Row']
type SubscriptionStatus = Database['public']['Enums']['subscription_status']
type BillingCycle = Database['public']['Enums']['billing_cycle']

export default async function DashboardPage({
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

    // Filters
    const statusParam = typeof params.status === 'string' ? params.status : 'active'
    if (statusParam !== 'all') {
        query = query.eq('status', statusParam as SubscriptionStatus)
    }

    const billingParam = typeof params.billing === 'string' ? params.billing : undefined
    if (billingParam) {
        query = query.eq('billing', billingParam as BillingCycle)
    }

    const category = typeof params.category === 'string' ? params.category : undefined
    if (category) {
        query = query.ilike('category', `%${category}%`)
    }

    const q = typeof params.q === 'string' ? params.q : undefined
    if (q) {
        query = query.ilike('tool_name', `%${q}%`)
    }

    const { data: subscriptions } = await query

    const subs = subscriptions || []

    if (subs.length === 0 && !Object.keys(params).length) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="p-4 bg-muted rounded-full">
                    <LayoutDashboard className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Tu Dashboard está vacío</h2>
                    <p className="text-muted-foreground max-w-sm">Comienza agregando tu primera suscripción para visualizar tus gastos y métricas.</p>
                </div>
                <Link href="/subscriptions/new">
                    <Button size="lg">
                        <Plus className="mr-2 h-4 w-4" /> Agregar Suscripción
                    </Button>
                </Link>
            </div>
        )
    }

    const { monthlyTotal, yearlyTotal, activeCount } = calculateKPIs(subs)

    // process data for charts
    const categoryMap = new Map<string, number>()
    const vendorMap = new Map<string, number>()

    subs.forEach(sub => {
        const cost = normalizeCost(sub.amount, sub.billing)

        // Category
        const cat = sub.category || 'Sin Categoría'
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + cost)

        // Vendor
        const vend = sub.vendor || sub.tool_name
        vendorMap.set(vend, (vendorMap.get(vend) || 0) + cost)
    })

    // Sort and limit data for better visualization
    const categoryData = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    const vendorData = Array.from(vendorMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Bienvenido, {user?.email}</p>
            </div>

            <DashboardFilters />

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gasto Mensual Estimado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">${monthlyTotal.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Calculado sobre suscripciones activas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gasto Anual Estimado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${yearlyTotal.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">X12 meses del total mensual</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Suscripciones Activas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCount}</div>
                        <p className="text-xs text-muted-foreground">Suscripciones con estado 'Activa'</p>
                    </CardContent>
                </Card>
            </div>

            <DashboardCharts categoryData={categoryData} vendorData={vendorData} />
        </div>
    )
}
