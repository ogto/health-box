import Image from "next/image";

type BrandLogoProps = {
  className: string;
  variant?: "circle" | "square" | "house";
  alt?: string;
  src?: string;
};

const logoMap = {
  circle: "/branding/logo-circle.jpeg",
  square: "/branding/logo-square.jpeg",
  house: "/branding/logo-house.jpeg",
} as const;

export function BrandLogo({
  className,
  variant = "circle",
  alt = "건강창고 로고",
  src,
}: BrandLogoProps) {
  return (
    <div className={className}>
      <Image
        alt={alt}
        className="brand-logo-image"
        fill
        sizes="96px"
        src={src || logoMap[variant]}
      />
    </div>
  );
}
