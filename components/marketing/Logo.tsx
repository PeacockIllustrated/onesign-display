import Image from "next/image";
import clsx from "clsx";

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
}

export function Logo({ className, width = 140, height = 48 }: LogoProps) {
    return (
        <div className={clsx("relative flex items-center", className)}>
            <Image
                src="/brand/onedesign-screens-logo-solid.svg"
                alt="Onedesign Screens"
                width={width}
                height={height}
                className="object-contain"
                priority
            />
        </div>
    );
}
