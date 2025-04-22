import { getUserServer } from "@/lib/server-api";
import { UserProvider } from "@/lib/user-provision";
import { CustomQueryProvider } from "@/lib/query-provision";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserServer();

  return (
    <CustomQueryProvider>
      <UserProvider user={user}>{children}</UserProvider>
    </CustomQueryProvider>
  );
}
