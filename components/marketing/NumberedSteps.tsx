
interface Step {
    title: string;
    description: string;
}

export function NumberedSteps({ steps }: { steps: Step[] }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
                <div key={i} className="flex flex-col relative">
                    <span className="text-6xl font-bold text-neutral-100 mb-6 font-mono">
                        {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-lg font-semibold text-neutral-950 mb-3">
                        {step.title}
                    </h3>
                    <p className="text-neutral-500 leading-relaxed text-sm">
                        {step.description}
                    </p>
                </div>
            ))}
        </div>
    );
}
