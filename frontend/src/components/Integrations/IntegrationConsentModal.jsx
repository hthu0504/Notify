
import { useState } from "react";

const providers = [
  {
    id: "notion",
    name: "Notion",
    description:
      "Allow Notify to access the pages and databases you authorize.",
    detail: "Task and database information",
    icon: "N",
    iconClass: "bg-black text-white",
  },
];

const IntegrationConsentModal = ({
  isOpen,
  onContinue,
  onSkip,
}) => {
  const [selectedProviders, setSelectedProviders] = useState([]);

  if (!isOpen) return null;

  const toggleProvider = (providerId) => {
    setSelectedProviders((previous) =>
      previous.includes(providerId)
        ? previous.filter((id) => id !== providerId)
        : [...previous, providerId]
    );
  };

  const handleContinue = () => {
    onContinue?.(selectedProviders);
    setSelectedProviders([]);
  };

  const handleSkip = () => {
    setSelectedProviders([]);
    onSkip?.();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#151b35] p-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            Task Management
          </span>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            ✓
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Connect Notion
        </h2>

        <p className="mt-2 mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Connect your Notion workspace to show your tasks in this widget.
        </p>

        {/* Providers */}
        <div className="space-y-3">
          {providers.map((provider) => {
            const selected = selectedProviders.includes(provider.id);

            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => toggleProvider(provider.id)}
                aria-pressed={selected}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  selected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 hover:border-gray-400 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${provider.iconClass}`}
                  >
                    {provider.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {provider.name}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                      {provider.description}
                    </p>
                  </div>

                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {selected && <span className="text-xs">✓</span>}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {provider.detail}
                  </span>
                  <span className="text-xs text-gray-400">
                    Optional
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Privacy notice */}
        <div className="mt-5 rounded-xl bg-gray-100 p-4 dark:bg-[#202844]">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">ⓘ</span>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              Your privacy matters
            </h4>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            These integrations are used exclusively by your
            Task Management Widget. Other Notify widgets will
            not access this data. You can disconnect your
            accounts at any time.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-xl bg-[#412D15] py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-purple-600"
          >
            Continue
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-[#202844]"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationConsentModal;
