import "@/global.css"
import { useUser } from "@clerk/expo";
import { usePostHog } from "posthog-react-native";
import {Alert, Text, View, Image, FlatList, Pressable} from "react-native";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import { useRouter } from "expo-router";
import images from "@/constants/images";
import {HOME_BALANCE} from "@/constants/data";
import {icons} from "@/constants/icons";
import {formatCurrency, getNextRenewalDate} from "@/lib/utils";
import dayjs from "dayjs";
import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import {useMemo, useState} from "react";
import { useSubscriptions } from "./subscriptions-context";
const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const { subscriptions, addSubscription, removeSubscription } = useSubscriptions();
    const { user } = useUser();
    const posthog = usePostHog();
    const router = useRouter();

    const displayName = user?.fullName
        ?? user?.firstName
        ?? user?.primaryEmailAddress?.emailAddress
        ?? 'Welcome'

    const avatarSource = user?.imageUrl
        ? { uri: user.imageUrl }
        : images.avatar

    const upcomingSubscriptions = useMemo<UpcomingSubscription[]>(() => {
        const today = dayjs().startOf("day");

        return subscriptions
            .filter((subscription) => subscription.status !== "cancelled")
            .map((subscription) => {
                const renewal = getNextRenewalDate(subscription, today);
                if (!renewal) {
                    return null;
                }

                const daysLeft = renewal.startOf("day").diff(today, "day");
                if (daysLeft < 0) {
                    return null;
                }

                return {
                    id: subscription.id,
                    icon: subscription.icon,
                    name: subscription.name,
                    price: subscription.price,
                    currency: subscription.currency,
                    daysLeft,
                };
            })
            .filter((item): item is UpcomingSubscription => item !== null)
            .sort((a, b) => a.daysLeft - b.daysLeft);
    }, [subscriptions]);

    return (
        <SafeAreaView className="flex-1 bg-background p-5">


                <FlatList
                    ListHeaderComponent={() => (
                        <>
                            <View className="home-header">
                                <View className="home-user">
                                    <Image source={avatarSource} className="home-avatar" />
                                    <Text className="home-user-name">{displayName}</Text>
                                </View>
                                <Pressable onPress={() => setIsCreateModalVisible(true)}>
                                    <Image source = {icons.add} className="home-add-icon" />
                                </Pressable>
                            </View>

                            <View className="home-balance-card">
                                <Text className="home-balance-label"> Balance </Text>

                                <View className="home-balance-row">
                                    <Text className = "home-balance-amount">
                                        {formatCurrency(HOME_BALANCE.amount)}
                                    </Text>
                                    <Text className="home-balance-date">
                                        {dayjs(HOME_BALANCE.nextRenewalDate).format('MM/DD')}
                                    </Text>
                                </View>
                            </View>

                            <View className="mb-5">
                                <ListHeading
                                    title = "Upcoming"
                                    onPress={() => router.push("/(tabs)/subscriptions")}
                                />


                                <FlatList
                                    data ={upcomingSubscriptions}
                                    renderItem={({item}) => (
                                        <UpcomingSubscriptionCard {...item} /> )}
                                    keyExtractor={(item) => item.id}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    ListEmptyComponent={<Text className="home-empty-state"> No upcoming renewals yet.</Text>}
                                />
                            </View>

                            <ListHeading
                                title = "All Subscriptions"
                                onPress={() => router.push("/(tabs)/subscriptions")}
                            />
                        </>
                    )}
                    data={subscriptions}
                    keyExtractor={(item) => item.id}
                    renderItem={({item}) =>(
                        <SubscriptionCard { ...item}
                            expanded={expandedSubscriptionId === item.id}
                            onPress={() => {
                                const isExpanding = expandedSubscriptionId !== item.id
                                setExpandedSubscriptionId(isExpanding ? item.id : null)
                                posthog.capture(
                                    isExpanding ? 'subscription_expanded' : 'subscription_collapsed',
                                    { subscription_id: item.id },
                                )
                            }}
                            onCancelPress={() => {
                                Alert.alert(
                                    "Remove subscription",
                                    `Remove ${item.name} from your subscriptions?`,
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        {
                                            text: "Remove",
                                            style: "destructive",
                                            onPress: () => {
                                                removeSubscription(item.id);
                                                setExpandedSubscriptionId((current) =>
                                                    current === item.id ? null : current,
                                                );
                                            },
                                        },
                                    ],
                                );
                            }} />
                    )}
                    extraData = {expandedSubscriptionId}
                    ItemSeparatorComponent ={() => <View className='h-4' />}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<Text className="home-empty-state">
                        No subscriptions yet.</Text>}
                    contentContainerClassName = "pb-30"
                />
                <CreateSubscriptionModal
                    visible={isCreateModalVisible}
                    onClose={() => setIsCreateModalVisible(false)}
                    onCreate={(subscription) => {
                        addSubscription(subscription);
                        setExpandedSubscriptionId(subscription.id);
                    }}
                />

        </SafeAreaView>

    );
}