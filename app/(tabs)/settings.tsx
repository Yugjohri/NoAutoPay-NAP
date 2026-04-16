import { useClerk, useUser } from '@clerk/expo'
import dayjs from 'dayjs'
import { useRouter } from 'expo-router'
import { styled } from 'nativewind'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'
import images from '@/constants/images'

const SafeAreaView = styled(RNSafeAreaView)

const Settings = () => {
    const { signOut } = useClerk()
    const { user } = useUser()
    const router = useRouter()

    const displayName =
        user?.fullName ??
        user?.firstName ??
        user?.primaryEmailAddress?.emailAddress ??
        'User'

    const email = user?.primaryEmailAddress?.emailAddress ?? '—'
    const avatarSource = user?.imageUrl ? { uri: user.imageUrl } : images.avatar
    const memberSince = user?.createdAt
        ? dayjs(user.createdAt).format('MMM D, YYYY')
        : '—'

    async function handleSignOut() {
        try {
            await signOut()
            router.replace('/(auth)/sign-in')
        } catch (e) {
            console.error('Sign-out failed:', e)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerClassName="p-5 pb-30"
            >
                <Text className="text-2xl font-sans-bold text-primary mb-6">Settings</Text>

                {/* Profile card */}
                <View className="sub-card flex-row items-center gap-4">
                    <Image source={avatarSource} className="home-avatar" />
                    <View className="flex-1 min-w-0">
                        <Text
                            className="text-lg font-sans-bold text-primary"
                            numberOfLines={1}
                        >
                            {displayName}
                        </Text>
                        <Text
                            className="mt-1 text-sm font-sans-medium text-muted-foreground"
                            numberOfLines={1}
                        >
                            {email}
                        </Text>
                    </View>
                </View>

                {/* Account information card */}
                <Text className="list-title mt-8 mb-3">Account</Text>
                <View className="sub-card gap-4">
                    <View className="sub-row">
                        <Text className="sub-label">Account ID</Text>
                        <Text
                            className="sub-value text-right"
                            numberOfLines={1}
                            ellipsizeMode="middle"
                        >
                            {user?.id ?? '—'}
                        </Text>
                    </View>

                    <View className="h-px bg-border" />

                    <View className="sub-row">
                        <Text className="sub-label">Joined</Text>
                        <Text className="sub-value text-right">{memberSince}</Text>
                    </View>
                </View>

                {/* Sign out */}
                <Pressable className="auth-button mt-9" onPress={handleSignOut}>
                    <Text className="auth-button-text">Sign out</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    )
}
export default Settings
