import { redirect } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";

export default async function Home() {
  try {
    const session = await getServerAuthSession();

    // Si está autenticado, redirigir al dashboard
    if (session) {
      redirect("/dashboard");
    }

    // Si no está autenticado, redirigir al login
    redirect("/auth/signin");
  } catch (error) {
    // En caso de error, redirigir al login
    console.error("Error checking session:", error);
    redirect("/auth/signin");
  }
}
