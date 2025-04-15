"use client";

import LoginForm from "@/components/LoginForm";
import { LoginCredentials } from "@/lib/types";
import { loginUser } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Login() {
  const router = useRouter();

  const onLogin = async (credentials: LoginCredentials) => {
    try {
      await loginUser(credentials);
      router.push("/dashboard");
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
