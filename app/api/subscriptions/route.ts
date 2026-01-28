import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { subscriptionSchema } from '@/lib/schemas'
import { z } from 'zod'
import { Database } from '@/types/supabase'

type SubscriptionStatus = Database['public']['Enums']['subscription_status']
type BillingCycle = Database['public']['Enums']['billing_cycle']

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const supabase = await createClient()

    // Verify auth
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    let query = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)

    // Filters
    const status = searchParams.get('status')
    if (status && status !== 'all') query = query.eq('status', status as SubscriptionStatus)

    const category = searchParams.get('category')
    if (category) query = query.eq('category', category)

    const vendor = searchParams.get('vendor')
    if (vendor) query = query.eq('vendor', vendor)

    const billing = searchParams.get('billing')
    if (billing) query = query.eq('billing', billing as BillingCycle)

    const search = searchParams.get('q')
    if (search) query = query.ilike('tool_name', `%${search}%`)

    // Ordering
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = await createClient()

    // Verify auth
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const json = await request.json()
        const body = subscriptionSchema.parse(json)

        const { data, error } = await supabase
            .from('subscriptions')
            .insert({
                ...body,
                user_id: user.id,
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err) {
        if (err instanceof z.ZodError) {
            return NextResponse.json({ error: err.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
