import { getUserServer } from "@/lib/server-api";
import Header from "@/page-components/Header";
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/lib/user-provision";
import { CustomQueryProvider } from "@/lib/query-provision";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUserServer();

  return (
    <>
      <Header user={user} />
      <main className="flex flex-col grow w-full max-w-screen-xl mx-auto px-4 py-8">
        <CustomQueryProvider>
          <UserProvider user={user}>{children}</UserProvider>
        </CustomQueryProvider>
      </main>
    </>
  );
}
