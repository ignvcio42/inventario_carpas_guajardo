import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";

export default async function Home() {
  const session = await getServerAuthSession();

  // Si está autenticado, redirigir al dashboard
  if (session) {
    redirect("/dashboard");
  }

  // Si no está autenticado, redirigir al login
  redirect("/auth/signin");
}
