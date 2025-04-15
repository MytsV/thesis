import { UserViewModel } from "@/lib/types";
import { headers } from "next/headers";
import { getUser } from "@/lib/api";

export async function getUserServer(): Promise<UserViewModel | undefined> {
  const headersList = await headers();

  const userId = headersList.get("x-user-id");
  const username = headersList.get("x-user-name");
  const email = headersList.get("x-user-email");

  // TODO: either redirect to login or throw an error
  if (!userId || !username || !email) {
    return undefined;
  }

  return {
    id: parseInt(userId),
    username: username,
    email: email,
  };
}
