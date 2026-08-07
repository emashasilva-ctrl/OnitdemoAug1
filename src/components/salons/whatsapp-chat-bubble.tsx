import { toWhatsAppDigits } from "@/lib/phone";

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.9 11.9L4 20l4.2-1.1a7.93 7.93 0 0 0 3.85 1A7.94 7.94 0 0 0 17.6 6.32ZM12.05 18.53a6.6 6.6 0 0 1-3.36-.92l-.24-.14-2.5.66.67-2.44-.16-.25a6.6 6.6 0 1 1 12.24-3.5 6.56 6.56 0 0 1-6.65 6.59Zm3.6-4.93c-.2-.1-1.17-.58-1.35-.64-.18-.07-.31-.1-.44.1-.13.2-.5.64-.62.77-.11.13-.23.14-.43.05-.2-.1-.83-.3-1.58-.97a5.93 5.93 0 0 1-1.1-1.36c-.11-.2 0-.3.09-.4.09-.1.2-.23.3-.35.1-.11.13-.2.2-.33.07-.13.03-.25 0-.35-.05-.1-.44-1.06-.6-1.45-.16-.38-.32-.33-.44-.34h-.38c-.13 0-.34.05-.52.25-.18.2-.68.66-.68 1.62 0 .96.7 1.88.8 2.01.1.13 1.37 2.1 3.33 2.94.47.2.83.32 1.11.41.47.15.9.13 1.24.08.38-.06 1.17-.48 1.33-.94.16-.46.16-.86.11-.94-.05-.09-.18-.14-.38-.24Z" />
    </svg>
  );
}

export function WhatsAppChatBubble({
  whatsappNumber,
  salonName,
}: {
  whatsappNumber: string;
  salonName: string;
}) {
  const message = encodeURIComponent(`Hi ${salonName}, I'd like to ask about...`);

  return (
    <a
      href={`https://wa.me/${toWhatsAppDigits(whatsappNumber)}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed right-5 bottom-24 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105 lg:bottom-6"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
