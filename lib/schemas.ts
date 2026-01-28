import { z } from 'zod'

export const subscriptionSchema = z.object({
    tool_name: z.string().min(1, "El nombre es obligatorio"),
    vendor: z.string().optional(),
    category: z.string().optional(),
    plan_name: z.string().optional(),
    status: z.enum(['active', 'canceled', 'paused']).default('active'),
    billing: z.enum(['monthly', 'yearly', 'weekly', 'one_time']).default('monthly'),
    amount: z.number().min(0, "El monto debe ser mayor o igual a 0"),
    currency: z.string().default('USD'),
    start_date: z.string().optional().nullable(), // Date string YYYY-MM-DD
    next_billing_date: z.string().optional().nullable(),
    notes: z.string().optional(),
    tags: z.array(z.string()).default([]),
})

export type SubscriptionFormValues = z.infer<typeof subscriptionSchema>
