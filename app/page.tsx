import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground space-y-4">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
        Coste de Vida Digital
      </h1>
      <p className="max-w-[600px] text-center text-muted-foreground md:text-xl">
        Controla tus suscripciones de software y servicios en un solo lugar.
      </p>
      <div className="flex gap-4">
        <Link href="/auth/login">
          <Button size="lg">Iniciar Sesión</Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="outline" size="lg">Registrarse</Button>
        </Link>
      </div>
    </div>
  )
}
