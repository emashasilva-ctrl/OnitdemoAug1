import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { AccountDetailsForm } from "@/components/account/account-details-form";

export default async function AccountPage() {
  const user = await requireUser("/account");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        My Account
      </h1>
      <p className="mt-2 text-muted-foreground">
        Update the personal details tied to your On It! account.
      </p>

      <div className="mt-8">
        <AccountDetailsForm
          email={user.email}
          initial={{ name: user.name, phone: user.phone ?? "" }}
        />
      </div>

      {user.isVendor && (
        <p className="mt-6 text-sm text-muted-foreground">
          Looking for your salon&apos;s details instead?{" "}
          <Link href="/vendor/profile" className="text-foreground underline">
            Go to your salon profile
          </Link>
          .
        </p>
      )}
    </div>
  );
}
