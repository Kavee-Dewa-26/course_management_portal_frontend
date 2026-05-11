/* eslint-disable @next/next/no-img-element */
interface LogoProps {
  variant?: "default" | "reversed" | "mark";
  height?: number;
  className?: string;
}

export function Logo({ variant = "default", height = 28, className }: LogoProps) {
  const src =
    variant === "reversed"
      ? "/assets/logo-reversed.svg"
      : variant === "mark"
        ? "/assets/logo-mark.svg"
        : "/assets/logo-default.svg";
  return <img src={src} alt="EduPath" style={{ height }} className={className} />;
}
