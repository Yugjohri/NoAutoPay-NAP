import { useSignUp } from '@clerk/expo'
import { type Href, Link, useRouter } from 'expo-router'
import { styled } from 'nativewind'
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

function BrandBlock() {
    return (
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
    )
}

export default function SignUp() {
    const { signUp, errors, fetchStatus } = useSignUp()
    const router = useRouter()

    const [emailAddress, setEmailAddress] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [code, setCode] = useState('')
    const [localErrors, setLocalErrors] = useState<{
        email?: string
        password?: string
        confirmPassword?: string
        code?: string
    }>({})
    const [isResending, setIsResending] = useState(false)
    const [resendFeedback, setResendFeedback] = useState<{
        type: 'success' | 'error'
        message: string
    } | null>(null)

    const isLoading = fetchStatus === 'fetching'
    const isVerifying =
        signUp.status === 'missing_requirements' &&
        signUp.unverifiedFields.includes('email_address') &&
        signUp.missingFields.length === 0

    // ── Validation ────────────────────────────────────────────────────────────

    function validateRegistration(): boolean {
        const errs: typeof localErrors = {}
        if (!EMAIL_REGEX.test(emailAddress.trim())) {
            errs.email = 'Enter a valid email address'
        }
        if (password.length < 8) {
            errs.password = 'Password must be at least 8 characters'
        }
        if (confirmPassword !== password) {
            errs.confirmPassword = 'Passwords do not match'
        }
        setLocalErrors(errs)
        return Object.keys(errs).length === 0
    }

    function validateCode(): boolean {
        if (code.trim().length !== 6 || !/^\d+$/.test(code.trim())) {
            setLocalErrors({ code: 'Enter the 6-digit code from your email' })
            return false
        }
        setLocalErrors({})
        return true
    }

    // ── Handlers ──────────────────────────────────────────────────────────────

    async function handleRegister() {
        if (!validateRegistration()) return

        const { error } = await signUp.password({
            emailAddress: emailAddress.trim(),
            password,
        })

        if (error) return

        await signUp.verifications.sendEmailCode()
    }

    async function handleVerify() {
        if (!validateCode()) return

        const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code: code.trim() })
        if (verifyError) return

        if (signUp.status === 'complete') {
            const { error: finalizeError } = await signUp.finalize({
                navigate: ({ decorateUrl }) => {
                    const url = decorateUrl('/(tabs)')
                    if (!url.startsWith('http')) {
                        router.replace(url as Href)
                    }
                },
            })
            if (finalizeError) console.error('Sign-up finalize error:', finalizeError)
        }
    }

    async function handleResend() {
        setIsResending(true)
        setResendFeedback(null)
        try {
            const { error } = await signUp.verifications.sendEmailCode()
            if (error) {
                setResendFeedback({
                    type: 'error',
                    message: error.message ?? 'Failed to send code. Try again.',
                })
            } else {
                setResendFeedback({
                    type: 'success',
                    message: 'Code sent — check your inbox.',
                })
            }
        } catch {
            setResendFeedback({
                type: 'error',
                message: 'Something went wrong. Try again.',
            })
        } finally {
            setIsResending(false)
        }
    }

    // ── Derived error messages ────────────────────────────────────────────────

    const emailError = localErrors.email ?? errors?.fields?.emailAddress?.message
    const passwordError = localErrors.password ?? errors?.fields?.password?.message
    const confirmPasswordError = localErrors.confirmPassword
    const codeError = localErrors.code ?? errors?.fields?.code?.message

    const canSubmitRegistration =
        emailAddress.trim().length > 0 &&
        password.length > 0 &&
        confirmPassword.length > 0 &&
        !isLoading

    const canSubmitCode = code.trim().length === 6 && !isLoading

    // ── Verification phase ────────────────────────────────────────────────────

    if (isVerifying) {
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
                            <BrandBlock />

                            <Text className="auth-title text-center">Verify your email</Text>
                            <Text className="auth-subtitle">
                                Enter the 6-digit code sent to {emailAddress.trim()}
                            </Text>

                            <View className="auth-card">
                                <View className="auth-form">
                                    <View className="auth-field">
                                        <Text className="auth-label">Verification code</Text>
                                        <TextInput
                                            className={`auth-input${codeError ? ' auth-input-error' : ''}`}
                                            value={code}
                                            onChangeText={(v) => {
                                                setCode(v)
                                                if (localErrors.code) setLocalErrors((e) => ({ ...e, code: undefined }))
                                            }}
                                            placeholder="123456"
                                            placeholderTextColor="rgba(0,0,0,0.3)"
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            textContentType="oneTimeCode"
                                            autoComplete="one-time-code"
                                            returnKeyType="done"
                                            onSubmitEditing={handleVerify}
                                        />
                                        {codeError ? (
                                            <Text className="auth-error">{codeError}</Text>
                                        ) : null}
                                    </View>
                                </View>

                                <Pressable
                                    className={`auth-button${!canSubmitCode ? ' auth-button-disabled' : ''}`}
                                    onPress={handleVerify}
                                    disabled={!canSubmitCode}
                                >
                                    <Text className="auth-button-text">
                                        {isLoading ? 'Verifying…' : 'Verify email'}
                                    </Text>
                                </Pressable>
                            </View>

                            <Pressable
                                className={`auth-secondary-button mt-3${isResending ? ' opacity-50' : ''}`}
                                onPress={handleResend}
                                disabled={isLoading || isResending}
                            >
                                <Text className="auth-secondary-button-text">
                                    {isResending ? 'Sending…' : 'Resend code'}
                                </Text>
                            </Pressable>
                            {resendFeedback ? (
                                <Text
                                    className={`mt-2 text-center text-xs font-sans-medium ${
                                        resendFeedback.type === 'success'
                                            ? 'text-success'
                                            : 'text-destructive'
                                    }`}
                                >
                                    {resendFeedback.message}
                                </Text>
                            ) : null}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        )
    }

    // ── Registration phase ────────────────────────────────────────────────────

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
                        <BrandBlock />

                        <Text className="auth-title text-center">Create account</Text>
                        <Text className="auth-subtitle">
                            Start tracking your subscriptions
                        </Text>

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
                                        placeholder="At least 8 characters"
                                        placeholderTextColor="rgba(0,0,0,0.3)"
                                        secureTextEntry
                                        textContentType="newPassword"
                                        autoComplete="new-password"
                                        returnKeyType="next"
                                    />
                                    {passwordError ? (
                                        <Text className="auth-error">{passwordError}</Text>
                                    ) : (
                                        <Text className="auth-helper">Minimum 8 characters</Text>
                                    )}
                                </View>

                                {/* Confirm password */}
                                <View className="auth-field">
                                    <Text className="auth-label">Confirm password</Text>
                                    <TextInput
                                        className={`auth-input${confirmPasswordError ? ' auth-input-error' : ''}`}
                                        value={confirmPassword}
                                        onChangeText={(v) => {
                                            setConfirmPassword(v)
                                            if (localErrors.confirmPassword)
                                                setLocalErrors((e) => ({ ...e, confirmPassword: undefined }))
                                        }}
                                        placeholder="Re-enter your password"
                                        placeholderTextColor="rgba(0,0,0,0.3)"
                                        secureTextEntry
                                        textContentType="newPassword"
                                        autoComplete="new-password"
                                        returnKeyType="done"
                                        onSubmitEditing={handleRegister}
                                    />
                                    {confirmPasswordError ? (
                                        <Text className="auth-error">{confirmPasswordError}</Text>
                                    ) : null}
                                </View>
                            </View>

                            <Pressable
                                className={`auth-button${!canSubmitRegistration ? ' auth-button-disabled' : ''}`}
                                onPress={handleRegister}
                                disabled={!canSubmitRegistration}
                            >
                                <Text className="auth-button-text">
                                    {isLoading ? 'Creating account…' : 'Create account'}
                                </Text>
                            </Pressable>
                        </View>

                        {/* Switch to sign-in */}
                        <View className="auth-link-row">
                            <Text className="auth-link-copy">Already have an account?</Text>
                            <Link href="/(auth)/sign-in" asChild>
                                <Pressable>
                                    <Text className="auth-link">Sign in</Text>
                                </Pressable>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
