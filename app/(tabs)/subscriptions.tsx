import { useMemo, useState } from 'react'
import { Alert, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native'
import { styled } from 'nativewind'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import SubscriptionCard from '@/components/SubscriptionCard'
import { useSubscriptions } from './subscriptions-context'

const SafeAreaView = styled(RNSafeAreaView)
const inputStyle = { includeFontPadding: false, textAlignVertical: 'center' as const }

const Subscriptions = () => {
    const [searchQuery, setSearchQuery] = useState('')
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null)
    const { subscriptions, removeSubscription } = useSubscriptions()

    const normalizedQuery = searchQuery.trim().toLowerCase()

    const filteredSubscriptions = useMemo(() => {
        if (!normalizedQuery) return subscriptions

        return subscriptions.filter((subscription) => {
            const fields = [subscription.name, subscription.plan, subscription.category]
                .filter(Boolean)
                .map((value) => value!.toLowerCase())

            return fields.some((value) => value.includes(normalizedQuery))
        })
    }, [normalizedQuery, subscriptions])

    return (
        <SafeAreaView className="flex-1 bg-background">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View className="flex-1 p-5">
                    <Text className="mb-4 text-2xl font-sans-bold text-primary">Subscriptions</Text>

                    <View className="mb-4">
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search by name, plan, or category"
                            placeholderTextColor="rgba(0,0,0,0.35)"
                            className="search-input"
                            style={inputStyle}
                            autoCapitalize="none"
                            autoCorrect={false}
                            clearButtonMode="while-editing"
                            returnKeyType="search"
                        />
                    </View>

                    <FlatList
                        style={{ flex: 1 }}
                        data={filteredSubscriptions}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <SubscriptionCard
                                {...item}
                                expanded={expandedSubscriptionId === item.id}
                                onPress={() => {
                                    setExpandedSubscriptionId((current) =>
                                        current === item.id ? null : item.id,
                                    )
                                }}
                                onCancelPress={() => {
                                    Alert.alert(
                                        'Remove subscription',
                                        `Remove ${item.name} from your subscriptions?`,
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Remove',
                                                style: 'destructive',
                                                onPress: () => {
                                                    removeSubscription(item.id)
                                                    setExpandedSubscriptionId((current) =>
                                                        current === item.id ? null : current,
                                                    )
                                                },
                                            },
                                        ],
                                    )
                                }}
                            />
                        )}
                        extraData={expandedSubscriptionId}
                        ItemSeparatorComponent={() => <View className="h-4" />}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        automaticallyAdjustKeyboardInsets
                        ListEmptyComponent={
                            <Text className="home-empty-state">
                                {normalizedQuery
                                    ? `No subscriptions found for "${searchQuery.trim()}".`
                                    : 'No subscriptions yet.'}
                            </Text>
                        }
                        contentContainerStyle={{ paddingBottom: 180 }}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default Subscriptions
