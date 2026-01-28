'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Sign up the user
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        })

        if (signUpError) {
            setError(signUpError.message)
            setLoading(false)
            return
        }

        // If auto-confirm is enabled or using email link, we might need to handle that.
        // For now assuming direct login or successful signup.
        // Usually Supabase defaults to "Confirm Email".
        // If not confirmed, we can't login yet.
        // I will assume for MVP we might want to guide them to check email, OR better, if development mode, it might work instantly if "Confirm Email" is off.
        // I'll show a message if session is null.

        if (data.session) {
            router.push('/dashboard')
            router.refresh()
        } else {
            // Registration successful but email confirmation required?
            // Or specific error.
            alert('Registro exitoso. Por favor revisa tu email para confirmar tu cuenta (si aplica) o inicia sesión.')
            router.push('/auth/login')
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Crear Cuenta</CardTitle>
                    <CardDescription>Regístrate para gestionar tus gastos</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Nombre Completo</Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="Juan Pérez"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="usuario@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Registrarse
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/auth/login" className="text-sm text-muted-foreground hover:underline">
                        ¿Ya tienes cuenta? Inicia sesión
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
