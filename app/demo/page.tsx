import { redirect } from "next/navigation";

/** /demo permanently redirects to Product Access (/products). */
export default function DemoRedirectPage() {
  redirect("/products");
}
