import { Metadata } from "next";
import Register from "@/pages/Register";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function Page() {
  return <Register />;
}
