import Image from "next/image";
import clsx from "clsx";

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
}

export function Logo({ className, width = 100, height = 32 }: LogoProps) {
    return (
        <div className={clsx("relative flex items-center", className)}>
            <Image
                src="/onesign-logo-dark.png"
                alt="Onesign Display"
                width={width}
                height={height}
                className="object-contain"
                priority
            />
        </div>
    );
}
