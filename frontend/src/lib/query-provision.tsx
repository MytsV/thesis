"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const CustomQueryProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
};
