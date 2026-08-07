import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { getVendorVenue, getAllPromotionsForVenue } from "@/lib/data/vendor";
import { PromotionList } from "@/components/vendor/promotion-list";
import { PricingRuleList } from "@/components/vendor/pricing-rule-list";
import { CancellationPolicyEditor } from "@/components/vendor/cancellation-policy-editor";
import { NoShowPolicyEditor } from "@/components/vendor/no-show-policy-editor";

export default async function VendorPromotionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const vendorVenue = await getVendorVenue(user.id);
  if (!vendorVenue) return null;
  if (vendorVenue.kind !== "salon") redirect("/vendor/dashboard");

  const promotions = await getAllPromotionsForVenue("salon", vendorVenue.venue.id);
  const salon = vendorVenue.venue;

  return (
    <div className="flex flex-col gap-6">
      <PromotionList venueKind="salon" venueId={salon.id} promotions={promotions} />
      <PricingRuleList salonId={salon.id} rules={salon.pricingRules} services={salon.services} />
      <CancellationPolicyEditor
        salonId={salon.id}
        initialEnabled={salon.cancellationFeeEnabled}
        initialPercent={salon.cancellationFeePercent}
      />
      <NoShowPolicyEditor
        salonId={salon.id}
        initialEnabled={salon.noShowFeeEnabled}
        initialPercent={salon.noShowFeePercent}
      />
    </div>
  );
}
