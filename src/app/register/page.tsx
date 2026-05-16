import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { MasterClockCounter } from "@/components/system/MasterClockCounter";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/liga/");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-[#F5F5F5] px-4 py-12">
      <div className="flex w-full max-w-[1000px] flex-col items-center space-y-8">
        <MasterClockCounter />

        <div className="w-full text-center">
          <h1 className="mx-auto max-w-[1000px] text-center text-3xl font-extrabold uppercase leading-snug tracking-tighter text-[#1e3a5f] md:text-4xl">
            Liga Deportiva Distrital Mixta de <br className="hidden sm:block" /> Basket de Iquitos
          </h1>
          <p className="mt-4 text-center text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Registro de Acceso
          </p>
        </div>

        <div className="w-full max-w-md rounded-3xl border-none bg-white p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
