"use client";

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = ['Profile', 'Cloud', 'Activity', 'Settings'];

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
      <div className="flex gap-0.5 p-1 max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`
              flex-1 py-1.5 px-3 rounded-md font-medium text-xs
              transition-colors
              ${
                activeTab === tab
                  ? "bg-gray-900 text-white dark:bg-white dark:text-black"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

