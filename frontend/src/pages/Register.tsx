"use client";

import { useRouter } from "next/navigation";
import RegisterForm from "@/components/RegisterForm";
import { registerUser } from "@/lib/api";
import { RegisterData } from "@/lib/types";

export default function Register() {
  const router = useRouter();

  const onRegister = async (data: RegisterData) => {
    try {
      await registerUser(data);
      // TODO: display success toast
      router.push("/login");
    } catch (error) {
      console.log(error);
      // TODO: handle errors with toasts
    }
  };

  return <RegisterForm onRegister={onRegister} />;
}
