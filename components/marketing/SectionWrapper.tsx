import clsx from "clsx";

interface SectionWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    dark?: boolean;
}

export function SectionWrapper({
    children,
    className,
    dark = false,
    ...props
}: SectionWrapperProps) {
    return (
        <section
            className={clsx(
                "w-full px-6 py-20 md:py-32 flex justify-center",
                dark ? "bg-neutral-950 text-white" : "bg-white text-neutral-950",
                className
            )}
            {...props}
        >
            <div className="w-full max-w-[1200px] mx-auto relative z-10">
                {children}
            </div>
        </section>
    );
}
