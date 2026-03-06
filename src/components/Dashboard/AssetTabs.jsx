// components/Dashboard/AssetTabs.jsx

const AssetTabs = ({ onTabChange, activeTab, stats = {} }) => {
  const tabs = [
    { 
      id: 'total', 
      label: 'Total Assets', 
      count: stats.total || 0,
      color: 'blue'
    },
    { 
      id: 'available', 
      label: 'Available Assets', 
      count: stats.available || 0,
      color: 'green'
    },
    { 
      id: 'ship', 
      label: 'Ship Items', 
     
      color: 'yellow'
    },
    
    { 
      id: 'pending', 
      label: 'Pending Items', 
      count: stats.pending || 0,
      color: 'orange'
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      count: stats.notifications || 0,
      color: 'red'
    }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 mb-6 transition-colors duration-200">
      <div className="flex flex-wrap items-center">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          // Define color classes dynamically
          const getActiveClasses = () => {
            switch(tab.color) {
              case 'blue': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
              case 'green': return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400';
              case 'yellow': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400';
              case 'purple': return 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400';
              case 'orange': return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400';
              case 'red': return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400';
              default: return 'bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400';
            }
          };

          const getBadgeClasses = () => {
            if (isActive) {
              switch(tab.color) {
                case 'blue': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
                case 'green': return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
                case 'yellow': return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300';
                case 'purple': return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
                case 'orange': return 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300';
                case 'red': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
                default: return 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300';
              }
            }
            return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
          };
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive ? getActiveClasses() : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}
              `}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="inline sm:hidden">{tab.label.split(' ')[0]}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${getBadgeClasses()}`}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default AssetTabs