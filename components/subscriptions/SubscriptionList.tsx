'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { Database } from '@/types/supabase'

type Subscription = Database['public']['Tables']['subscriptions']['Row']

export function SubscriptionList({ data }: { data: Subscription[] }) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta suscripción?')) return

        setDeletingId(id)
        try {
            const res = await fetch(`/api/subscriptions/${id}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                router.refresh()
            } else {
                alert('Error al eliminar')
            }
        } catch (e) {
            console.error(e)
        } finally {
            setDeletingId(null)
        }
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground mb-4">No tienes suscripciones registradas.</p>
                <Link href="/subscriptions/new">
                    <Button>Crear Suscripción</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Herramienta</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((sub) => (
                        <TableRow key={sub.id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{sub.tool_name}</span>
                                    <span className="text-xs text-muted-foreground">{sub.vendor}</span>
                                </div>
                            </TableCell>
                            <TableCell>{sub.category || '-'}</TableCell>
                            <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${sub.status === 'active' ? 'bg-green-500/20 text-green-500' :
                                        sub.status === 'canceled' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'
                                    }`}>
                                    {sub.status === 'active' ? 'Activa' : sub.status === 'canceled' ? 'Cancelada' : 'Pausada'}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                {sub.currency} {sub.amount} <br />
                                <span className="text-xs text-muted-foreground">/{sub.billing === 'monthly' ? 'mes' : sub.billing}</span>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Link href={`/subscriptions/${sub.id}/edit`}>
                                    <Button variant="ghost" size="icon">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(sub.id)}
                                    disabled={deletingId === sub.id}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
