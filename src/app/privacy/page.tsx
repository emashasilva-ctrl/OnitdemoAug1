import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Placeholder policy for the On It! MVP — to be reviewed by legal
        counsel before public launch.
      </p>

      <div className="mt-8 flex flex-col gap-8 text-foreground/80">
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Information we collect
          </h2>
          <p className="mt-2">
            When you book an appointment through On It!, we collect the
            information you provide directly: your name, phone number, and
            any notes you add for the salon. We do not require an account or
            payment details to make a booking.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            How we use it
          </h2>
          <p className="mt-2">
            Booking details are shared with the salon you book so they can
            prepare for your appointment. We do not sell your information to
            third parties.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Data on this device
          </h2>
          <p className="mt-2">
            In this early version of On It!, your booking history is stored
            locally on your device and is not synced to a server account.
            Clearing your browser data will remove it.
          </p>
        </section>
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Contact
          </h2>
          <p className="mt-2">
            Questions about this policy can be sent to{" "}
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
