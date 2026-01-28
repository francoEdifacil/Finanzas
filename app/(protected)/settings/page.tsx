'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
    const [loading, setLoading] = useState(false)
    const [profile, setProfile] = useState<{ full_name: string | null; preferred_currency: string } | null>(null)
    const supabase = createClient()

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name, preferred_currency')
                    .eq('user_id', user.id)
                    .single()

                if (data) setProfile(data)
            }
        }
        loadProfile()
    }, [])

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile) return
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    preferred_currency: profile.preferred_currency,
                })
                .eq('user_id', user.id)

            if (error) {
                alert('Error al actualizar: ' + error.message)
            } else {
                alert('Perfil actualizado correctamente')
            }
        }
        setLoading(false)
    }

    if (!profile) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold">Configuración</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Perfil</CardTitle>
                    <CardDescription>Gestiona tus preferencias de usuario</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Nombre Completo</Label>
                            <Input
                                id="full_name"
                                value={profile.full_name || ''}
                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currency">Moneda Preferida</Label>
                            <select
                                id="currency"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={profile.preferred_currency}
                                onChange={(e) => setProfile({ ...profile, preferred_currency: e.target.value })}
                            >
                                <option value="USD">USD - Dólar Estadounidense</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="CLP">CLP - Peso Chileno</option>
                                <option value="MXN">MXN - Peso Mexicano</option>
                            </select>
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
