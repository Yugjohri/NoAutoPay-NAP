import dayjs from "dayjs";
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import { formatCurrency, getNextRenewalDate } from "@/lib/utils";
import { useSubscriptions } from "./subscriptions-context";
const SafeAreaView = styled(RNSafeAreaView);

const Insights = () => {
    const { subscriptions } = useSubscriptions();

    const analytics = useMemo(() => {
        const activeSubscriptions = subscriptions.filter((item) => item.status !== "cancelled");
        const today = dayjs().startOf("day");

        let monthlySpend = 0;
        let yearlyProjection = 0;
        let upcomingIn30Days = 0;

        const categorySpend = new Map<string, number>();
        const billingTotals = new Map<string, number>();

        for (const item of activeSubscriptions) {
            const category = item.category?.trim() || "Other";
            categorySpend.set(category, (categorySpend.get(category) || 0) + item.price);

            const billing = item.billing?.trim() || "Monthly";
            const monthlyEquivalent = billing === "Yearly" ? item.price / 12 : item.price;
            billingTotals.set(billing, (billingTotals.get(billing) || 0) + monthlyEquivalent);

            if (billing === "Yearly") {
                monthlySpend += item.price / 12;
                yearlyProjection += item.price;
            } else {
                monthlySpend += item.price;
                yearlyProjection += item.price * 12;
            }
        }

        const upcomingRenewals = activeSubscriptions
            .map((item) => {
                const renewal = getNextRenewalDate(item, today);
                if (!renewal) return null;

                const daysLeft = renewal.startOf("day").diff(today, "day");
                if (daysLeft < 0) return null;
                if (daysLeft <= 30) upcomingIn30Days += 1;

                return {
                    id: item.id,
                    name: item.name,
                    amount: formatCurrency(item.price, item.currency),
                    daysLeft,
                };
            })
            .filter((item): item is { id: string; name: string; amount: string; daysLeft: number } => item !== null)
            .sort((a, b) => a.daysLeft - b.daysLeft)
            .slice(0, 4);

        const categoryRows = Array.from(categorySpend.entries())
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        const topCategoryAmount = categoryRows[0]?.amount || 1;

        const billingRows = Array.from(billingTotals.entries()).map(([name, amount]) => ({
            name,
            amount,
            share: monthlySpend > 0 ? (amount / monthlySpend) * 100 : 0,
        }));

        return {
            totalSubscriptions: activeSubscriptions.length,
            monthlySpend,
            yearlyProjection,
            upcomingIn30Days,
            categoryRows,
            topCategoryAmount,
            billingRows,
            upcomingRenewals,
        };
    }, [subscriptions]);

    return (
        <SafeAreaView className = "flex-1 bg-background p-5">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-30">
                <View className="insights-header">
                    <Text className="insights-title">Insights</Text>
                    <Text className="insights-subtitle">Track your spending trends and renewals</Text>
                </View>

                <View className="insights-hero-card">
                    <Text className="insights-hero-label">Estimated monthly spend</Text>
                    <Text className="insights-hero-value">{formatCurrency(analytics.monthlySpend)}</Text>
                    <Text className="insights-hero-meta">
                        Annual projection: {formatCurrency(analytics.yearlyProjection)}
                    </Text>
                </View>

                <View className="insights-stats-grid">
                    <View className="insights-stat-card">
                        <Text className="insights-stat-label">Active subscriptions</Text>
                        <Text className="insights-stat-value">{analytics.totalSubscriptions}</Text>
                    </View>
                    <View className="insights-stat-card">
                        <Text className="insights-stat-label">Renewals in 30 days</Text>
                        <Text className="insights-stat-value">{analytics.upcomingIn30Days}</Text>
                    </View>
                </View>

                <View className="insights-section-card">
                    <Text className="insights-section-title">Top categories</Text>
                    {analytics.categoryRows.length ? (
                        analytics.categoryRows.map((row) => (
                            <View className="insights-bar-row" key={row.name}>
                                <View className="insights-bar-copy">
                                    <Text className="insights-bar-label">{row.name}</Text>
                                    <Text className="insights-bar-value">{formatCurrency(row.amount)}</Text>
                                </View>
                                <View className="insights-bar-track">
                                    <View
                                        className="insights-bar-fill"
                                        style={{
                                            width: `${Math.max((row.amount / analytics.topCategoryAmount) * 100, 6)}%`,
                                        }}
                                    />
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text className="home-empty-state">No category data yet.</Text>
                    )}
                </View>

                <View className="insights-section-card">
                    <Text className="insights-section-title">Billing mix</Text>
                    {analytics.billingRows.length ? (
                        analytics.billingRows.map((row) => (
                            <View className="insights-chip-row" key={row.name}>
                                <Text className="insights-chip-label">{row.name}</Text>
                                <Text className="insights-chip-value">{row.share.toFixed(0)}%</Text>
                            </View>
                        ))
                    ) : (
                        <Text className="home-empty-state">No billing data yet.</Text>
                    )}
                </View>

                <View className="insights-section-card">
                    <Text className="insights-section-title">Upcoming renewals</Text>
                    {analytics.upcomingRenewals.length ? (
                        analytics.upcomingRenewals.map((item) => (
                            <View className="insights-renewal-row" key={item.id}>
                                <View>
                                    <Text className="insights-renewal-name">{item.name}</Text>
                                    <Text className="insights-renewal-meta">
                                        {item.daysLeft > 1 ? `${item.daysLeft} days left` : "Last day"}
                                    </Text>
                                </View>
                                <Text className="insights-renewal-amount">{item.amount}</Text>
                            </View>
                        ))
                    ) : (
                        <Text className="home-empty-state">No upcoming renewals.</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}
export default Insights
