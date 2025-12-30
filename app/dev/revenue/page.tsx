"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGate } from "@/components/AuthGate";
import { ArrowLeft, DollarSign, TrendingUp, Package, Users } from "lucide-react";
import Link from "next/link";

export default function RevenueDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    today: { revenue: 0, sales: 0 },
    week: { revenue: 0, sales: 0 },
    month: { revenue: 0, sales: 0 },
    allTime: { revenue: 0, sales: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchRevenue = async () => {
      try {
        const response = await fetch(`/api/revenue/summary?userId=${currentUser.uid}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching revenue:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [currentUser]);

  return (
    <AuthGate>
      <div className="min-h-screen bg-white dark:bg-black p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <Link
              href="/profile"
              className="flex items-center justify-center w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-900 rounded transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Revenue Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track your earnings from products and drops
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="Today"
                  value={`$${stats.today.revenue.toFixed(2)}`}
                  subtext={`${stats.today.sales} sales`}
                  icon={DollarSign}
                  color="blue"
                />
                
                <StatCard
                  label="This Week"
                  value={`$${stats.week.revenue.toFixed(2)}`}
                  subtext={`${stats.week.sales} sales`}
                  icon={TrendingUp}
                  color="green"
                />
                
                <StatCard
                  label="This Month"
                  value={`$${stats.month.revenue.toFixed(2)}`}
                  subtext={`${stats.month.sales} sales`}
                  icon={Package}
                  color="purple"
                />
                
                <StatCard
                  label="All Time"
                  value={`$${stats.allTime.revenue.toFixed(2)}`}
                  subtext={`${stats.allTime.sales} sales`}
                  icon={Users}
                  color="orange"
                />
              </div>

              {/* Coming Soon */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Detailed analytics coming soon
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <li>• Revenue charts</li>
                  <li>• Top products</li>
                  <li>• Conversion rates</li>
                  <li>• Customer insights</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </AuthGate>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function StatCard({ label, value, subtext, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-950 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400',
  }[color];

  return (
    <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClasses}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{subtext}</p>
    </div>
  );
}

