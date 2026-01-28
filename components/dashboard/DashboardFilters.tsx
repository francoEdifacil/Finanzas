'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export function DashboardFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const updateFilter = (name: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(name, value)
        } else {
            params.delete(name)
        }
        router.push(`/dashboard?${params.toString()}`)
    }

    return (
        <Card className="mb-6">
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="q">Búsqueda</Label>
                        <Input
                            id="q"
                            placeholder="Buscar herramienta..."
                            value={searchParams.get('q') || ''}
                            onChange={(e) => updateFilter('q', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Estado</Label>
                        <select
                            id="status"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={searchParams.get('status') || 'active'}
                            onChange={(e) => updateFilter('status', e.target.value)}
                        >
                            <option value="active">Activa</option>
                            <option value="canceled">Cancelada</option>
                            <option value="paused">Pausada</option>
                            <option value="all">Todas</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="billing">Ciclo</Label>
                        <select
                            id="billing"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={searchParams.get('billing') || ''}
                            onChange={(e) => updateFilter('billing', e.target.value)}
                        >
                            <option value="">Todos</option>
                            <option value="monthly">Mensual</option>
                            <option value="yearly">Anual</option>
                            <option value="weekly">Semanal</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Categoría</Label>
                        <Input
                            id="category"
                            placeholder="Filtrar categoría..."
                            value={searchParams.get('category') || ''}
                            onChange={(e) => updateFilter('category', e.target.value)}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
