import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { becomeVendor } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Become a vendor",
  description: "List your salon on On It!",
};

export default async function BecomeAVendorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/become-a-vendor");
  if (user.isVendor) redirect("/vendor/dashboard");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Store className="size-6" />
      </span>
      <div>
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Become a vendor
        </h1>
        <p className="mt-2 text-muted-foreground">
          Switch on vendor access for your existing On It! account — no new
          login required. You&apos;ll be able to manage a salon listing from
          the same account you use to book.
        </p>
      </div>

      <form action={becomeVendor} className="w-full">
        <Button type="submit" size="lg" className="w-full">
          Yes, become a vendor
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Don&apos;t have a salon listed yet? Once you&apos;re a vendor, you can{" "}
        <a href="/beauty/partner" className="text-primary hover:underline">
          list your salon
        </a>
        .
      </p>
    </div>
  );
}
