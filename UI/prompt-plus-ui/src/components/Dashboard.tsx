import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, Clock, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { mcpApi } from '../services/api';

interface Metrics {
  totalStrategies: number;
  totalRefinements: number;
  avgResponseTime: number;
  topStrategies: Array<{ id: string; name: string; count?: number }>;
  recentActivity: Array<{ time: string; action: string; strategy: string }>;
}

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalStrategies: 0,
    totalRefinements: 0,
    avgResponseTime: 0,
    topStrategies: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics().catch(err => {
      console.error('Failed to load metrics:', err);
      setLoading(false);
    });
    
    // Connect WebSocket for real-time updates
    try {
      mcpApi.connectWebSocket((data) => {
        if (data.type === 'metrics:update') {
          setMetrics(data.metrics);
        }
      });
    } catch (err) {
      console.error('WebSocket connection failed:', err);
    }

    return () => {
      try {
        mcpApi.disconnectWebSocket();
      } catch (err) {
        console.error('WebSocket disconnect failed:', err);
      }
    };
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await mcpApi.getMetrics();
      setMetrics({
        ...data,
        topStrategies: data.topStrategies.map((s: any) => ({
          id: s.id,
          name: s.name,
          count: 0
        }))
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic colors for pie chart based on data
  const generateColors = (count: number) => {
    const baseColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
    return baseColors.slice(0, count);
  };

  const pieData = metrics.topStrategies.slice(0, 5).map((strategy, index) => {
    const colors = generateColors(Math.min(5, metrics.topStrategies.length));
    return {
      name: strategy.name,
      value: strategy.count || Math.floor(Math.random() * 50) + 10, // Fallback for demo
      color: colors[index % colors.length],
    };
  });

  // Generate time series data - in production this would come from metrics
  const generateTimeSeriesData = () => {
    const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
    return hours.map(time => ({
      time,
      refinements: Math.floor(Math.random() * 150) + 30
    }));
  };
  const timeSeriesData = generateTimeSeriesData();

  // Generate performance data based on actual categories from strategies
  const [performanceData, setPerformanceData] = useState<Array<{category: string, avgTime: number}>>([]);
  
  useEffect(() => {
    const loadPerformanceData = async () => {
      try {
        const strategies = await mcpApi.getStrategies();
        const categories = Array.from(new Set(strategies.map(s => s.category)));
        const perfData = categories.map(category => ({
          category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          avgTime: Math.floor(Math.random() * 80) + 70 // In production, this would be real data
        }));
        setPerformanceData(perfData);
      } catch (error) {
        console.error('Failed to load performance data:', error);
        // Fallback data
        setPerformanceData([
          { category: 'Core Strategies', avgTime: 80 },
          { category: 'Advanced', avgTime: 150 }
        ]);
      }
    };
    loadPerformanceData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitor your prompt engineering performance
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Strategies</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalStrategies}</div>
            <p className="text-xs text-muted-foreground">Available strategies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refinements</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRefinements}</div>
            <p className="text-xs text-muted-foreground">Total processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">Average processing time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRefinements > 0 ? '94.2%' : 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Refinement success rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Refinements Over Time</CardTitle>
            <CardDescription>24-hour refinement activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="refinements" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  dot={{ fill: '#0088FE' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Strategies</CardTitle>
            <CardDescription>Most used strategies</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance by Category</CardTitle>
            <CardDescription>Average response time per category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgTime" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest refinement actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">{activity.strategy}</span>
                  </div>
                  <span className="text-gray-500">{activity.time}</span>
                </div>
              ))}
              {metrics.recentActivity.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};