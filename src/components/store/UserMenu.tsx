"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/auth/actions";

type Props = {
  email: string | null;
  role: "admin" | "customer" | null;
};

export function UserMenu({ email, role }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!email) {
    return (
      <Link
        href="/login"
        className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
        aria-label="Iniciar sesión"
      >
        <User className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="p-2 text-gray-500 hover:text-gray-900 transition-colors outline-none"
        aria-label="Cuenta"
      >
        <User className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-xs text-gray-500">Sesión activa</p>
            <p className="text-sm font-medium truncate">{email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {role === "admin" && (
          <>
            <DropdownMenuItem render={<Link href="/products" />}>
              Panel de administración
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/admin-orders" />}>
              Pedidos
            </DropdownMenuItem>
          </>
        )}
        {role === "customer" && (
          <DropdownMenuItem render={<Link href="/orders" />}>
            Mis pedidos
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await signOut();
              toast.success("Sesión cerrada");
              router.push("/");
            })
          }
        >
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
