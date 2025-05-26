import { Metadata } from "next";
import Register from "@/page-components/Register";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function Page() {
  return <Register />;
}
