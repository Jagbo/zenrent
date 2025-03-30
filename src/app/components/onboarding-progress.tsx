import { CheckIcon } from '@heroicons/react/24/solid';

type Step = {
  id: string;
  name: string;
  href: string;
  status: 'complete' | 'current' | 'upcoming';
};

export function OnboardingProgress({ steps }: { steps: Step[] }) {
  return (
    <div className="py-0">
      <nav aria-label="Progress">
        <ol role="list" className="flex overflow-x-auto border border-gray-300 rounded-md bg-white">
          {steps.map((step, stepIdx) => (
            <li key={step.name} className="relative flex flex-1 min-w-[80px] sm:min-w-[120px]">
              {step.status === 'complete' ? (
                <a href={step.href} className="group flex w-full items-center">
                  <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                    <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full bg-[#D9E8FF] group-hover:bg-[#D9E8FF]/80">
                      <CheckIcon aria-hidden="true" className="size-4 sm:size-6 text-gray-900" />
                    </span>
                    <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-gray-900">{step.name}</span>
                  </span>
                </a>
              ) : step.status === 'current' ? (
                <a href={step.href} aria-current="step" className="flex items-center">
                  <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                    <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full border-2 border-[#D9E8FF]">
                      <span className="text-xs sm:text-sm text-gray-900">{step.id}</span>
                    </span>
                    <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-gray-900">{step.name}</span>
                  </span>
                </a>
              ) : (
                <a href={step.href} className="group flex items-center">
                  <span className="flex flex-col items-center md:flex-row md:items-center px-3 py-3 text-sm font-medium sm:px-6 sm:py-4">
                    <span className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-[#D9E8FF]">
                      <span className="text-xs sm:text-sm text-gray-500 group-hover:text-gray-900">{step.id}</span>
                    </span>
                    <span className="mt-2 text-center md:mt-0 md:text-left md:ml-4 text-xs sm:text-sm font-medium text-gray-500 group-hover:text-gray-900">{step.name}</span>
                  </span>
                </a>
              )}

              {stepIdx !== steps.length - 1 ? (
                <>
                  {/* Arrow separator - hide on mobile, show on desktop */}
                  <div aria-hidden="true" className="absolute top-0 right-0 hidden md:block h-full w-5">
                    <svg fill="none" viewBox="0 0 22 80" preserveAspectRatio="none" className="size-full text-gray-300">
                      <path
                        d="M0 -2L20 40L0 82"
                        stroke="currentcolor"
                        vectorEffect="non-scaling-stroke"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </>
              ) : null}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
} 