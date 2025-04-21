"use client";

import LoginForm from "@/components/LoginForm";
import { LoginCredentials } from "@/lib/types";
import { loginUser } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onLogin = async (credentials: LoginCredentials) => {
    try {
      await loginUser(credentials);
      const redirectUrl = searchParams?.get("returnUrl") ?? "/dashboard";
      router.push(redirectUrl);
      router.refresh();
    } catch (error) {
      toast.error(error.message);
      // TODO: handle errors with toasts
    }
  };

  const onRegister = () => {
    router.push("/register");
  };

  return <LoginForm onLogin={onLogin} onRegister={onRegister} />;
}
