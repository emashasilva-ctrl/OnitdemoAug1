import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Placeholder terms for the On It! MVP — to be reviewed by legal counsel
        before public launch.
      </p>

      <div className="mt-8 flex flex-col gap-8 text-foreground/80">
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Booking through On It!
          </h2>
          <p className="mt-2">
            On It! connects customers with independent, partner-operated
            salons in Colombo. When you book through On It!, you&apos;re
            reserving a slot directly with that salon. Payment is made to the
            salon at the time of your appointment — On It! does not process
            payments.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Cancellations
          </h2>
          <p className="mt-2">
            You can cancel an upcoming booking any time from the My Bookings
            page. We ask that you give salons as much notice as possible so
            they can offer the slot to someone else.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Salon responsibility
          </h2>
          <p className="mt-2">
            Services are provided by the partner salon, not by On It!. Pricing,
            quality and conduct of the appointment are the salon&apos;s
            responsibility.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Contact
          </h2>
          <p className="mt-2">
            Questions about these terms can be sent to{" "}
            <a href="mailto:hello@onit.lk" className="text-primary underline underline-offset-4">
              hello@onit.lk
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
