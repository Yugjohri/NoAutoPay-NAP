import { useSignIn } from '@clerk/expo'
import { type Href, Link, useRouter } from 'expo-router'
import { styled } from 'nativewind'
import { usePostHog } from 'posthog-react-native'
import React, { useState } from 'react'
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context'

const SafeAreaView = styled(RNSafeAreaView)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignIn() {
    const { signIn, errors, fetchStatus } = useSignIn()
    const router = useRouter()
    const posthog = usePostHog()

    const [emailAddress, setEmailAddress] = useState('')
    const [password, setPassword] = useState('')
    const [localErrors, setLocalErrors] = useState<{ email?: string; password?: string }>({})

    const isLoading = fetchStatus === 'fetching'
    const canSubmit = emailAddress.trim().length > 0 && password.length > 0 && !isLoading

    function validate(): boolean {
        const errs: typeof localErrors = {}
        if (!EMAIL_REGEX.test(emailAddress.trim())) {
            errs.email = 'Enter a valid email address'
        }
        if (password.length < 8) {
            errs.password = 'Password must be at least 8 characters'
        }
        setLocalErrors(errs)
        return Object.keys(errs).length === 0
    }

    async function handleSubmit() {
        if (!validate()) return

        const { error } = await signIn.password({
            emailAddress: emailAddress.trim(),
            password,
        })

        if (error) {
            posthog.capture('user_sign_in_failed', { error: error.message })
            return
        }

        if (signIn.status === 'complete') {
            await signIn.finalize({
                navigate: ({ decorateUrl }) => {
                    const url = decorateUrl('/(tabs)')
                    if (url.startsWith('http')) {
                        // web fallback — shouldn't happen in native
                    } else {
                        posthog.capture('user_signed_in', { method: 'email' })
                        router.replace(url as Href)
                    }
                },
            })
        }
    }

    const emailError = localErrors.email ?? errors?.fields?.identifier?.message
    const passwordError = localErrors.password ?? errors?.fields?.password?.message

    return (
        <SafeAreaView className="auth-safe-area">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    className="auth-scroll"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View className="auth-content">
                        {/* Brand */}
                        <View className="auth-brand-block">
                            <View className="auth-logo-wrap">
                                <View className="auth-logo-mark">
                                    <Text className="auth-logo-mark-text">NAP</Text>
                                </View>
                                <View>
                                    <Text className="auth-wordmark">NoAutoPay</Text>
                                    <Text className="auth-wordmark-sub">Subscriptions</Text>
                                </View>
                            </View>
                        </View>

                        {/* Heading */}
                        <Text className="auth-title text-center">Welcome back</Text>
                        <Text className="auth-subtitle">
                            Sign in to continue managing your subscriptions
                        </Text>

                        {/* Form card */}
                        <View className="auth-card">
                            <View className="auth-form">
                                {/* Email */}
                                <View className="auth-field">
                                    <Text className="auth-label">Email address</Text>
                                    <TextInput
                                        className={`auth-input${emailError ? ' auth-input-error' : ''}`}
                                        value={emailAddress}
                                        onChangeText={(v) => {
                                            setEmailAddress(v)
                                            if (localErrors.email) setLocalErrors((e) => ({ ...e, email: undefined }))
                                        }}
                                        placeholder="you@example.com"
                                        placeholderTextColor="rgba(0,0,0,0.3)"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="email-address"
                                        textContentType="emailAddress"
                                        autoComplete="email"
                                        returnKeyType="next"
                                    />
                                    {emailError ? (
                                        <Text className="auth-error">{emailError}</Text>
                                    ) : null}
                                </View>

                                {/* Password */}
                                <View className="auth-field">
                                    <Text className="auth-label">Password</Text>
                                    <TextInput
                                        className={`auth-input${passwordError ? ' auth-input-error' : ''}`}
                                        value={password}
                                        onChangeText={(v) => {
                                            setPassword(v)
                                            if (localErrors.password) setLocalErrors((e) => ({ ...e, password: undefined }))
                                        }}
                                        placeholder="Your password"
                                        placeholderTextColor="rgba(0,0,0,0.3)"
                                        secureTextEntry
                                        textContentType="password"
                                        autoComplete="password"
                                        returnKeyType="done"
                                        onSubmitEditing={handleSubmit}
                                    />
                                    {passwordError ? (
                                        <Text className="auth-error">{passwordError}</Text>
                                    ) : null}
                                </View>
                            </View>

                            {/* Submit */}
                            <Pressable
                                className={`auth-button${!canSubmit ? ' auth-button-disabled' : ''}`}
                                onPress={handleSubmit}
                                disabled={!canSubmit}
                            >
                                <Text className="auth-button-text">
                                    {isLoading ? 'Signing in…' : 'Sign in'}
                                </Text>
                            </Pressable>
                        </View>

                        {/* Switch to sign-up */}
                        <View className="auth-link-row">
                            <Text className="auth-link-copy">Don't have an account?</Text>
                            <Link href="/(auth)/sign-up" asChild>
                                <Pressable>
                                    <Text className="auth-link">Sign up</Text>
                                </Pressable>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
