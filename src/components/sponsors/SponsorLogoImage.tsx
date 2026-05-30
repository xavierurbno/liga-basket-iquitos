import { sponsorCarouselLogoClass, sponsorFebLogoClass } from "@/components/sponsors/sponsorFebDisplay";

type SponsorLogoImageProps = {
  name: string;
  logoUrl: string;
  category?: string;
  variant?: "footer" | "carousel";
};

export function SponsorLogoImage({
  name,
  logoUrl,
  category,
  variant = "footer",
}: SponsorLogoImageProps) {
  const className =
    variant === "carousel" ? sponsorCarouselLogoClass() : sponsorFebLogoClass(category);

  return (
    <img
      src={logoUrl}
      alt={name}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
