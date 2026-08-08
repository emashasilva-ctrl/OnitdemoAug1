import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { becomeVendor, continueAsCustomer } from "@/lib/actions/auth";
import { sanitizeNextPath } from "@/lib/oauth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Become a vendor",
  description: "List your salon on On It!",
};

export default async function BecomeAVendorPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/become-a-vendor");
  if (user.isVendor) redirect("/vendor/dashboard");

  const { next } = await searchParams;
  const nextPath = sanitizeNextPath(next);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Store className="size-6" />
      </span>
      <div>
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          How will you use On It!?
        </h1>
        <p className="mt-2 text-muted-foreground">
          You can always switch on vendor access later from your account menu.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        <form action={continueAsCustomer}>
          <input type="hidden" name="next" value={nextPath} />
          <Button type="submit" size="lg" variant="outline" className="w-full">
            Just a customer
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">
            Book appointments and reservations
          </p>
        </form>
        <form action={becomeVendor}>
          <Button type="submit" size="lg" className="w-full">
            Customer and vendor
          </Button>
          <p className="mt-2 text-sm text-muted-foreground">I also own a salon</p>
        </form>
      </div>
    </div>
  );
}
