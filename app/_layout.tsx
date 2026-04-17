import { ClerkProvider, useAuth, useUser } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import { SplashScreen, Stack, usePathname } from 'expo-router'
import '@/global.css'
import { useEffect } from 'react'
import { useFonts } from 'expo-font'
import { PostHogProvider, usePostHog } from 'posthog-react-native'

function IdentifyUser() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const posthog = usePostHog()

  const email = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase()
  const name = user?.fullName ?? user?.firstName ?? undefined

  useEffect(() => {
    // Only identify authenticated users once an email is available.
    if (!isSignedIn || !email) return

    posthog.identify(email, {
      email,
      name,
      clerk_user_id: user.id,
    })
  }, [isSignedIn, email, name, user?.id, posthog])

  return null
}

function ScreenTracker() {
  const pathname = usePathname()
  const posthog = usePostHog()

  useEffect(() => {
    posthog.screen(pathname)
  }, [pathname, posthog])

  return null
}

SplashScreen.preventAutoHideAsync()

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to your .env file')
}

const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY
if (!posthogKey) {
  throw new Error('Add your PostHog key to your .env.local file')
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <PostHogProvider
      apiKey={posthogKey}
      options={{ host: process.env.EXPO_PUBLIC_POSTHOG_HOST }}
      autocapture={{ captureTouches: true, captureScreens: false }}
    >
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <IdentifyUser />
        <ScreenTracker />
        <Stack screenOptions={{ headerShown: false }} />
      </ClerkProvider>
    </PostHogProvider>
  )
}
