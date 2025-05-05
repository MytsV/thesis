"use client";

import { useRouter } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { registerUser } from "@/lib/client-api";
import { RegisterData } from "@/lib/types";
import { toast } from "sonner";

export default function Register() {
  const router = useRouter();

  const onRegister = async (data: RegisterData) => {
    try {
      await registerUser(data);
      // TODO: display success toast
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return <RegisterForm onRegister={onRegister} />;
}
