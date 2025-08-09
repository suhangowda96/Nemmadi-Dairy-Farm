import { useState, useEffect } from 'react';
import { 
  AlertTriangle, Milk, 
  BadgeIndianRupee, TrendingUp, Loader2, AlertOctagon,
  Package, HeartPulse, Calendar, ArrowLeft, ArrowRight
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useAuth } from '../../contexts/AuthContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define types
type DashboardData = {
  financials: {
    status: string;
    message: string;
    total_income: number;
    total_expenses: number;
    net_profit: number;
  };
  daily_yield: {
    low_performance_count: number;
    low_performance_records: Array<{
      animal_id: string;
      date: string;
      total_yield: number;
    }>;
  };
  fwa_quality: {
    total_unfit_kgs: number;
  };
  daily_health: {
    red_flag_count: number;
    red_flag_animals: string[];
  };
};

type MonthlySummaryRecord = {
  id: number;
  month: string;
  year: number;
  total_yield: number;
  total_income: number;
};

type FinancialRecord = {
  id: number;
  month: string; // Format: "YYYY-MM-DD"
  total_income: number;
  total_expenses: number;
  net_profit: number;
};

type ChartView = 'monthly' | 'yearly';
type MetricType = 'yield' | 'income';
type DataType = 'milk' | 'finance';

interface TrackingDashboardProps {
  query?: string;
}

const TrackingDashboard: React.FC<TrackingDashboardProps> = ({ query = '' }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [milkSummaries, setMilkSummaries] = useState<MonthlySummaryRecord[]>([]);
  const [financialSummaries, setFinancialSummaries] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  const [chartView, setChartView] = useState<ChartView>('monthly');
  const [metricType, setMetricType] = useState<MetricType>('yield');
  const [dataType, setDataType] = useState<DataType>('milk'); // 'milk' or 'finance'

  // Modal states
  const [showLowYieldModal, setShowLowYieldModal] = useState(false);
  const [showRedFlagsModal, setShowRedFlagsModal] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user?.token) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const response = await fetch(`https://nemmadi-dairy-farm.koyeb.app/api/dashboard-tracking/${query}`, {
          headers: { 'Authorization': `Bearer ${user.token}` },
        });
        
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        
        const data: DashboardData = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, query]);

  // Fetch data for charts
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setChartLoading(true);
        if (!user?.token) return;

        const endDate = new Date(selectedMonth);
        let startDate = new Date(endDate);
        
        if (chartView === 'monthly') {
          // Show only current year data for monthly view
          startDate.setMonth(0); // January
          startDate.setDate(1);
        } else {
          // Show 5 years of data for yearly view
          startDate.setFullYear(endDate.getFullYear() - 5);
          startDate.setMonth(0);
          startDate.setDate(1);
        }

        if (dataType === 'milk') {
          // Fetch milk yield data
          const response = await fetch(
            `https://nemmadi-dairy-farm.koyeb.app/api/myt-milk-yield/monthly-summary/${query}`, 
            {
              headers: { 'Authorization': `Bearer ${user.token}` }
            }
          );

          if (!response.ok) throw new Error('Failed to fetch milk yield data');
          
          const data = await response.json();
          setMilkSummaries(data);
        } else {
          // Fetch financial records
          const response = await fetch(
            `https://nemmadi-dairy-farm.koyeb.app/api/financial-records/${query}`, 
            {
              headers: { 'Authorization': `Bearer ${user.token}` }
            }
          );

          if (!response.ok) throw new Error('Failed to fetch financial records');
          
          const data: FinancialRecord[] = await response.json();
          setFinancialSummaries(data);
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
      } finally {
        setChartLoading(false);
      }
    };

    if (user) fetchChartData();
  }, [user, selectedMonth, chartView, dataType]);

  // Prepare chart data
  const prepareChartData = () => {
    const summaries = dataType === 'milk' ? milkSummaries : financialSummaries;
    
    if (!summaries.length) return null;

    // Filter and aggregate data based on chart view
    let chartData: { labels: string[]; data: number[] } = { labels: [], data: [] };
    
    if (chartView === 'monthly') {
      // Get current year from selectedMonth
      const currentYear = parseInt(selectedMonth.split('-')[0]);
      
      // Filter to current year only
      const currentYearData = summaries.filter(
        item => new Date(item.month).getFullYear() === currentYear
      );
      
      // Generate labels for all months in the year
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      chartData.labels = monthNames;
      
      // Initialize data with zeros
      chartData.data = Array(12).fill(0);
      
      // Fill in actual data
      currentYearData.forEach(item => {
        const monthIndex = new Date(item.month).getMonth();
        
        if (dataType === 'milk') {
          chartData.data[monthIndex] = metricType === 'yield' 
            ? (item as MonthlySummaryRecord).total_yield 
            : (item as MonthlySummaryRecord).total_income;
        } else {
          // For financial data, show net profit by default
          chartData.data[monthIndex] = (item as FinancialRecord).net_profit;
        }
      });
    } else {
      // Yearly view - aggregate by year
      const yearlyData: Record<number, number> = {};
      
      summaries.forEach(item => {
        const year = new Date(item.month).getFullYear();
        let value: number;
        
        if (dataType === 'milk') {
          value = metricType === 'yield' 
            ? (item as MonthlySummaryRecord).total_yield 
            : (item as MonthlySummaryRecord).total_income;
        } else {
          // For financial data, show net profit by default
          value = (item as FinancialRecord).net_profit;
        }
        
        if (yearlyData[year]) {
          yearlyData[year] += value;
        } else {
          yearlyData[year] = value;
        }
      });
      
      // Get sorted years
      const years = Object.keys(yearlyData)
        .map(Number)
        .sort((a, b) => a - b);
      
      chartData.labels = years.map(String);
      chartData.data = years.map(year => yearlyData[year]);
    }

    // Determine chart color based on data type
    let borderColor, backgroundColor, pointColor;
    
    if (dataType === 'milk') {
      borderColor = metricType === 'yield' ? 'rgb(59, 130, 246)' : 'rgb(16, 185, 129)';
      backgroundColor = metricType === 'yield' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(16, 185, 129, 0.5)';
      pointColor = metricType === 'yield' ? 'rgb(29, 78, 216)' : 'rgb(5, 150, 105)';
    } else {
      borderColor = 'rgb(124, 58, 237)';
      backgroundColor = 'rgba(124, 58, 237, 0.5)';
      pointColor = 'rgb(91, 33, 182)';
    }

    return {
      labels: chartData.labels,
      datasets: [
        {
          label: dataType === 'milk' 
            ? (metricType === 'yield' ? 'Total Milk Yield (L)' : 'Total Income (₹)')
            : 'Net Profit (₹)',
          data: chartData.data,
          borderColor,
          backgroundColor,
          tension: 0.3,
          fill: false,
          pointBackgroundColor: pointColor,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: pointColor,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
  };

  // Format month for display (e.g., "January 2024")
  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  type ColorKey = 'blue' | 'green' | 'red' | 'yellow' | 'purple';

  // MetricCard component
  const MetricCard = ({ 
    icon, 
    title, 
    value, 
    unit, 
    color = 'blue', 
    onClick 
  }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    unit?: string;
    color?: ColorKey;
    onClick?: () => void;
  }) => {
    // Define color classes with type-safe indexing
    const colorClasses: Record<ColorKey, string> = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
      green: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100',
      red: 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100',
      purple: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
    };
    
    const Container = onClick ? 'button' : 'div';
    
    return (
      <Container 
        className={`border rounded-lg p-3 sm:p-4 w-full text-left transition-colors ${colorClasses[color]} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className={`p-1 sm:p-2 rounded-full ${colorClasses[color].replace('bg-', 'bg-').replace('50', '100')}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-medium">{title}</h3>
            <p className="text-xl sm:text-2xl font-bold">
              {value} {unit && <span className="text-xs">{unit}</span>}
            </p>
          </div>
        </div>
      </Container>
    );
  };

  // Modal components
  const LowYieldModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Low Milk Yield Animals - {formatMonth(selectedMonth)}</h2>
            <button 
              onClick={() => setShowLowYieldModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Animal ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Yield (Liters)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData?.daily_yield.low_performance_records.map((record, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.animal_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.total_yield.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowLowYieldModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const RedFlagsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Animals with Red Flags - {formatMonth(selectedMonth)}</h2>
            <button 
              onClick={() => setShowRedFlagsModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {dashboardData?.daily_health.red_flag_animals.map((animal, index) => (
              <div 
                key={index} 
                className="flex items-center p-3 bg-red-50 rounded-md"
              >
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <span className="font-medium">{animal}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowRedFlagsModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertOctagon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div>No dashboard data available</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      {showLowYieldModal && <LowYieldModal />}
      {showRedFlagsModal && <RedFlagsModal />}
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Farm Dashboard Tracking</h1>
          <p className="text-gray-600 mt-1">Showing data for <span className="font-semibold">{formatMonth(selectedMonth)}</span></p>
        </div>
        
        <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-xl px-4 py-2 shadow-sm hover:shadow-md transition">
          <Calendar className="text-blue-600 w-5 h-5" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            max={new Date().toISOString().slice(0, 7)}
            className="bg-transparent w-full text-gray-700 focus:outline-none cursor-pointer"
          />
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        {/* Milk Yield - Low Performance */}
        <MetricCard 
          icon={<Milk className="h-4 w-4 sm:h-6 sm:w-6" />} 
          title="Low Milk Yield" 
          value={dashboardData.daily_yield.low_performance_count}
          color="yellow"
          onClick={() => dashboardData.daily_yield.low_performance_count > 0 && setShowLowYieldModal(true)}
        />
        
        {/* Financial Status */}
        <MetricCard 
          icon={<BadgeIndianRupee className="h-4 w-4 sm:h-6 sm:w-6" />} 
          title="Financial Status" 
          value={dashboardData.financials.status}
          color={dashboardData.financials.status === 'Profit' ? 'green' : 'red'}
        />
        
        {/* Net Profit */}
        <MetricCard 
          icon={<TrendingUp className="h-4 w-4 sm:h-6 sm:w-6" />} 
          title="Net Profit" 
          value={`₹${dashboardData.financials.net_profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} 
          color={dashboardData.financials.status === 'Profit' ? 'green' : 'red'}
        />
        
        {/* Red Flags */}
        <MetricCard 
          icon={<HeartPulse className="h-4 w-4 sm:h-6 sm:w-6" />} 
          title="Active Red Flags" 
          value={dashboardData.daily_health.red_flag_count} 
          color="red"
          onClick={() => dashboardData.daily_health.red_flag_count > 0 && setShowRedFlagsModal(true)}
        />
        
        {/* FWA - Unfit Fodder */}
        <MetricCard 
          icon={<Package className="h-4 w-4 sm:h-6 sm:w-6" />} 
          title="Unfit Fodder" 
          value={`${dashboardData.fwa_quality.total_unfit_kgs.toFixed(2)} kg`}
          color="red"
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
            {dataType === 'milk' 
              ? `${metricType === 'yield' ? 'Milk Yield' : 'Income'} Performance` 
              : 'Financial Performance'} -{' '}
            {chartView === 'monthly' ? 'Monthly' : 'Yearly'} View
          </h2>
          
          <div className="flex gap-3">
            {/* Data type toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDataType('milk')}
                className={`p-1 rounded-md ${dataType === 'milk' ? 'bg-blue-100 text-blue-800' : 'text-gray-500'}`}
                aria-label="Switch to milk data"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <span className="text-sm font-medium">
                {dataType === 'milk' ? 'Milk Data' : 'Financial Data'}
              </span>
              
              <button
                onClick={() => setDataType('finance')}
                className={`p-1 rounded-md ${dataType === 'finance' ? 'bg-purple-100 text-purple-800' : 'text-gray-500'}`}
                aria-label="Switch to financial data"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            
            {/* Metric type toggle (only for milk data) */}
            {dataType === 'milk' && (
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button
                  className={`px-3 py-1 text-sm ${
                    metricType === 'yield'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMetricType('yield')}
                >
                  Yield
                </button>
                <button
                  className={`px-3 py-1 text-sm ${
                    metricType === 'income'
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setMetricType('income')}
                >
                  Income
                </button>
              </div>
            )}
            
            {/* Chart view toggle */}
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`px-3 py-1 text-sm ${
                  chartView === 'monthly'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setChartView('monthly')}
              >
                Monthly
              </button>
              <button
                className={`px-3 py-1 text-sm ${
                  chartView === 'yearly'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setChartView('yearly')}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>
        
        <div className="h-80">
          {chartLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-600">Loading chart data...</span>
            </div>
          ) : (dataType === 'milk' && milkSummaries.length === 0) || 
              (dataType === 'finance' && financialSummaries.length === 0) ? (
            <div className="flex justify-center items-center h-full text-gray-500">
              No data available for the selected period
            </div>
          ) : (
            <Line 
              data={prepareChartData() || { labels: [], datasets: [] }} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (context) => {
                        const value = context.parsed.y;
                        
                        if (dataType === 'milk') {
                          return metricType === 'yield'
                            ? `${value.toFixed(2)} L`
                            : `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
                        } else {
                          return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
                        }
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: dataType === 'milk',
                    ticks: {
                      callback: (value) => {
                        if (dataType === 'milk') {
                          return metricType === 'yield'
                            ? `${value} L`
                            : `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
                        } else {
                          return `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
                        }
                      }
                    }
                  }
                }
              }}
            />
          )}
        </div>
      </div>
      
      {/* Summary Section */}
      <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Summary for {formatMonth(selectedMonth)}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Positive Indicators</h3>
            <ul className="space-y-2">
              {dashboardData.financials.status === 'Profit' && (
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm sm:text-base">
                    Net profit of ₹{dashboardData.financials.net_profit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </li>
              )}
              {dashboardData.daily_yield.low_performance_count === 0 && (
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm sm:text-base">
                    No low milk yield issues
                  </span>
                </li>
              )}
              {dashboardData.daily_health.red_flag_count === 0 && (
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm sm:text-base">
                    No active health red flags
                  </span>
                </li>
              )}
            </ul>
          </div>
          <div className="mt-4 md:mt-0">
            <h3 className="font-medium text-gray-900 mb-2">Attention Needed</h3>
            <ul className="space-y-2">
              {dashboardData.financials.status === 'Loss' && (
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm sm:text-base">
                    Financial loss of ₹{Math.abs(dashboardData.financials.net_profit).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </li>
              )}
              {dashboardData.daily_yield.low_performance_count > 0 && (
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-sm sm:text-base">
                    {dashboardData.daily_yield.low_performance_count} low milk yield cases
                  </span>
                </li>
              )}
              {dashboardData.daily_health.red_flag_count > 0 && (
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm sm:text-base">
                    {dashboardData.daily_health.red_flag_count} active health red flags
                  </span>
                </li>
              )}
              {dashboardData.fwa_quality.total_unfit_kgs > 0 && (
                <li className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-sm sm:text-base">
                    {dashboardData.fwa_quality.total_unfit_kgs.toFixed(2)}kg unfit fodder
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingDashboard;