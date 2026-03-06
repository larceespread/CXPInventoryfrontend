// components/Dashboard/StatsCard.jsx
const StatsCard = ({ title, value, icon: Icon, color = 'blue', subtitle, trend }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  }

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-lg p-3 ${colors[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate flex items-center gap-2">
              {title}
              {trend && (
                <span className={`text-xs font-medium ${trendColors[trend.type]}`}>
                  {trend.value} {trend.type === 'up' ? '↑' : trend.type === 'down' ? '↓' : '→'}
                </span>
              )}
            </dt>
            <dd className="text-2xl font-semibold text-gray-900">{value?.toLocaleString() || '0'}</dd>
            {subtitle && (
              <dd className="text-xs text-gray-500 mt-1">{subtitle}</dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}

export default StatsCard