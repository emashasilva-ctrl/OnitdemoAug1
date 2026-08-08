import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { getVendorVenue } from "@/lib/data/vendor";
import { switchToCustomer } from "@/lib/actions/auth";
import { SalonSetupForm } from "@/components/vendor/salon-setup-form";

export const metadata: Metadata = {
  title: "Set up your salon",
  description: "Create your salon listing on On It!",
};

export default async function VendorSetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/vendor/setup");
  if (!user.isVendor) redirect("/become-a-vendor");

  const vendorVenue = await getVendorVenue(user.id);
  if (vendorVenue) redirect("/vendor/dashboard");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        Set up your salon
      </h1>
      <p className="mt-2 text-muted-foreground">
        This creates your real listing on On It! — customers will be able to find
        and book you as soon as you finish. You can add your hours, services,
        and team right after.
      </p>
      <div className="mt-8">
        <SalonSetupForm />
      </div>
      <form action={switchToCustomer} className="mt-6 text-center">
        <button type="submit" className="text-sm text-muted-foreground underline hover:text-foreground">
          Actually, I just want to be a customer
        </button>
      </form>
    </div>
  );
}
