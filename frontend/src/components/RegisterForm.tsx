"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Camera } from "lucide-react";
import { RegisterData } from "@/lib/types";

// TODO: add avatar upload functionality
function RegisterAvatar() {
  return (
    <div className="flex w-full max-w-64 aspect-square items-center justify-center rounded-full border shadow-xs">
      <Camera className="h-10 w-10 text-primary" />
    </div>
  );
}

export interface RegisterFormProps {
  onRegister: (data: RegisterData) => Promise<void>;
}

export default function RegisterForm(props: RegisterFormProps) {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    await props.onRegister({ username, email, password });
    setIsLoading(false);
  };

  return (
    <div className="flex grow h-full flex-col justify-center space-y-5">
      <h1 className="text-3xl font-medium">Register</h1>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md flex flex-col space-y-5"
      >
        <Input
          required
          value={username}
          placeholder="Username"
          onChange={(event) => setUsername(event.target.value)}
        />
        <Input
          required
          type="email"
          value={email}
          placeholder="Email"
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          required
          type="password"
          value={password}
          placeholder="Password"
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" className="w-full cursor-pointer">
          {isLoading ? <Spinner className="text-secondary py-2" /> : "Sign Up"}
        </Button>
      </form>
    </div>
  );
}
