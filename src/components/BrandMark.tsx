import Image from "next/image";
import { clsx } from "@/lib/format";

type Props = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function BrandMark({ size = 40, className, priority }: Props) {
  return (
    <Image
      src="/brand/logo.png"
      alt="Presupuesto"
      width={size}
      height={size}
      priority={priority}
      className={clsx("rounded-2xl bg-white object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
