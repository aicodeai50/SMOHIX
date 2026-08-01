import { redirect } from "next/navigation";

/** /tour redirects to Product Orientation at /explore. */
export default function TourRedirectPage() {
  redirect("/explore");
}
