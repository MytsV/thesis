"use client";

import { LoginCredentials } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
}

export default function LoginForm(props: LoginFormProps) {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    await props.onLogin({ username, password });
    setIsLoading(false);
  };

  return (
    <div className="flex h-full flex-col justify-center items-center space-y-5">
      <h1 className="text-3xl font-medium">Welcome Back</h1>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md flex flex-col space-y-5"
      >
        <Input
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <Input
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" className="w-full">
          {isLoading ? <Spinner className="text-secondary py-2" /> : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
