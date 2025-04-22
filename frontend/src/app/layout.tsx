import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getUserServer } from "@/lib/server-api";
import Header from "@/pages/Header";
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/lib/user-provision";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CustomQueryProvider } from "@/lib/query-provision";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserServer();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Header user={user} />
        <main className="flex flex-col grow w-full max-w-screen-xl mx-auto px-4 py-8">
          <CustomQueryProvider>
            <UserProvider user={user}>{children}</UserProvider>
          </CustomQueryProvider>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
