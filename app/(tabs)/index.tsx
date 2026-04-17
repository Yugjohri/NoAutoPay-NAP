import "@/global.css"
import { useUser } from "@clerk/expo";
import { usePostHog } from "posthog-react-native";
import {Text, View, Image, FlatList, Pressable} from "react-native";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import images from "@/constants/images";
import {HOME_BALANCE, UPCOMING_SUBSCRIPTIONS} from "@/constants/data";
import {icons} from "@/constants/icons";
import {formatCurrency} from "@/lib/utils";
import dayjs from "dayjs";
import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import {useState} from "react";
import { useSubscriptions } from "./subscriptions-context";
const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const { subscriptions, addSubscription } = useSubscriptions();
    const { user } = useUser();
    const posthog = usePostHog();

    const displayName = user?.fullName
        ?? user?.firstName
        ?? user?.primaryEmailAddress?.emailAddress
        ?? 'Welcome'

    const avatarSource = user?.imageUrl
        ? { uri: user.imageUrl }
        : images.avatar

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
                                <ListHeading title = "Upcoming" />


                                <FlatList
                                    data ={UPCOMING_SUBSCRIPTIONS}
                                    renderItem={({item}) => (
                                        <UpcomingSubscriptionCard {...item} /> )}
                                    keyExtractor={(item) => item.id}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    ListEmptyComponent={<Text className="home-empty-state"> No upcoming renewals yet.</Text>}
                                />
                            </View>

                            <ListHeading title = "All Subscriptions" />
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