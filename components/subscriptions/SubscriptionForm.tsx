'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Database } from '@/types/supabase'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

interface SubscriptionFormProps {
    initialData?: Subscription
}

const CURRENCIES = [
    { value: 'USD', label: 'USD - Dólar Estadounidense' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'CLP', label: 'CLP - Peso Chileno' },
    { value: 'MXN', label: 'MXN - Peso Mexicano' },
    { value: 'BRL', label: 'BRL - Real Brasileño' },
]

export function SubscriptionForm({ initialData }: SubscriptionFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        tool_name: initialData?.tool_name || '',
        vendor: initialData?.vendor || '',
        category: initialData?.category || '',
        amount: initialData?.amount || 0,
        currency: initialData?.currency || 'USD',
        billing: initialData?.billing || 'monthly',
        status: initialData?.status || 'active',
        start_date: initialData?.start_date || '',
        next_billing_date: initialData?.next_billing_date || '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const url = initialData
                ? `/api/subscriptions/${initialData.id}`
                : '/api/subscriptions'

            const method = initialData ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!res.ok) {
                const json = await res.json()
                throw new Error(json.error ? JSON.stringify(json.error) : 'Error al guardar los datos')
            }

            router.push('/subscriptions')
            router.refresh()
        } catch (err: any) {
            console.error(err)
            setError(err.message)
            setLoading(false)
        }
    }

    return (
        <Card className="max-w-3xl mx-auto border-primary/10 shadow-lg">
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="tool_name">Nombre de la Herramienta</Label>
                            <Input
                                id="tool_name"
                                name="tool_name"
                                placeholder="Ej: ChatGPT, Midjourney, Netflix..."
                                value={formData.tool_name}
                                onChange={handleChange}
                                required
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vendor">Proveedor (Compañía)</Label>
                            <Input
                                id="vendor"
                                name="vendor"
                                placeholder="Ej: OpenAI, Anthropic, Google..."
                                value={formData.vendor}
                                onChange={handleChange}
                                className="bg-background/50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría</Label>
                            <Input
                                id="category"
                                name="category"
                                placeholder="Ej. IA / Generativo, Productividad, Entretenimiento..."
                                value={formData.category}
                                onChange={handleChange}
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado de la Suscripción</Label>
                            <select
                                id="status"
                                name="status"
                                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="active">Activa</option>
                                <option value="canceled">Cancelada</option>
                                <option value="paused">Pausada</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Monto del Pago</Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Moneda</Label>
                            <select
                                id="currency"
                                name="currency"
                                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.currency}
                                onChange={handleChange}
                            >
                                {CURRENCIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="billing">Ciclo de Cobro</Label>
                            <select
                                id="billing"
                                name="billing"
                                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.billing}
                                onChange={handleChange}
                            >
                                <option value="monthly">Mensual</option>
                                <option value="yearly">Anual</option>
                                <option value="weekly">Semanal</option>
                                <option value="one_time">Pago Único</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="start_date">Fecha de Inicio</Label>
                            <Input
                                id="start_date"
                                name="start_date"
                                type="date"
                                value={formData.start_date || ''}
                                onChange={handleChange}
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="next_billing_date">Próxima Fecha de Cobro</Label>
                            <Input
                                id="next_billing_date"
                                name="next_billing_date"
                                type="date"
                                value={formData.next_billing_date || ''}
                                onChange={handleChange}
                                className="bg-background/50"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-primary/5">
                        <Button type="button" variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                        </Button>
                        <Button type="submit" disabled={loading} className="min-w-[150px]">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {initialData ? 'Guardar Cambios' : 'Registrar Suscripción'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
