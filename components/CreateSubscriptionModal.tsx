import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import classNames from "clsx";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

import { resolveSubscriptionIcon } from "@/lib/subscription-icon";

const FREQUENCY_OPTIONS = ["Monthly", "Yearly"] as const;
const CATEGORY_OPTIONS = [
    "Entertainment",
    "AI Tools",
    "Developer Tools",
    "Design",
    "Productivity",
    "Cloud",
    "Music",
    "Other",
] as const;

type FrequencyOption = (typeof FREQUENCY_OPTIONS)[number];
type CategoryOption = (typeof CATEGORY_OPTIONS)[number];

const CATEGORY_COLORS: Record<CategoryOption, string> = {
    Entertainment: "#f5d76e",
    "AI Tools": "#b8d4e3",
    "Developer Tools": "#e8def8",
    Design: "#b8e8d0",
    Productivity: "#c4d2ff",
    Cloud: "#bde0fe",
    Music: "#ffd6a5",
    Other: "#e5e7eb",
};

const inputStyle = { includeFontPadding: false, textAlignVertical: "center" as const };

type NewSubscription = Subscription & { frequency: FrequencyOption };

interface CreateSubscriptionModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate: (subscription: NewSubscription) => void;
}

const CreateSubscriptionModal = ({ visible, onClose, onCreate }: CreateSubscriptionModalProps) => {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [frequency, setFrequency] = useState<FrequencyOption>("Monthly");
    const [category, setCategory] = useState<CategoryOption>("Entertainment");
    const [errors, setErrors] = useState<{ name?: string; price?: string }>({});

    const canSubmit = useMemo(() => {
        const parsedPrice = Number(price.replace(",", "."));
        return name.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice > 0;
    }, [name, price]);

    const resetForm = () => {
        setName("");
        setPrice("");
        setFrequency("Monthly");
        setCategory("Entertainment");
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = () => {
        const parsedPrice = Number(price.replace(",", "."));
        const nextErrors: typeof errors = {};

        if (!name.trim()) {
            nextErrors.name = "Name is required";
        }

        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            nextErrors.price = "Enter a valid price greater than 0";
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        const startDate = dayjs();
        const renewalDate =
            frequency === "Monthly" ? startDate.add(1, "month") : startDate.add(1, "year");

        const subscription: NewSubscription = {
            id: `${name.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
            name: name.trim(),
            price: parsedPrice,
            frequency,
            icon: resolveSubscriptionIcon(name),
            category,
            status: "active",
            billing: frequency,
            startDate: startDate.toISOString(),
            renewalDate: renewalDate.toISOString(),
            currency: "USD",
            color: CATEGORY_COLORS[category],
        };

        onCreate(subscription);
        //
        // posthog.capture('subscription_created',{
        //     subscription_name: name.trim(),
        //     subscription_price: priceValue,
        //     subscription_frequency: frequency,
        //     subscription_category: category,
        // })
        handleClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Pressable className="modal-overlay" onPress={handleClose}>
                    <Pressable onPress={() => undefined} className="modal-container">
                        <View className="modal-header">
                            <Text className="modal-title">New Subscription</Text>
                            <Pressable className="modal-close" onPress={handleClose}>
                                <Text className="modal-close-text">X</Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            className="modal-body"
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View className="auth-field">
                                <Text className="auth-label mt-2">Name</Text>
                                <TextInput
                                    className={classNames("auth-input", errors.name && "auth-input-error")}
                                    style={inputStyle}
                                    value={name}
                                    onChangeText={(value) => {
                                        setName(value);
                                        if (errors.name) {
                                            setErrors((prev) => ({ ...prev, name: undefined }));
                                        }
                                    }}
                                    placeholder="e.g. Spotify"
                                    placeholderTextColor="rgba(0,0,0,0.3)"
                                    returnKeyType="next"
                                />
                                {errors.name ? <Text className="auth-error">{errors.name}</Text> : null}
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label mt-2">Price</Text>
                                <TextInput
                                    className={classNames("auth-input", errors.price && "auth-input-error")}
                                    style={inputStyle}
                                    value={price}
                                    onChangeText={(value) => {
                                        setPrice(value);
                                        if (errors.price) {
                                            setErrors((prev) => ({ ...prev, price: undefined }));
                                        }
                                    }}
                                    keyboardType="decimal-pad"
                                    placeholder="e.g. 9.99"
                                    placeholderTextColor="rgba(0,0,0,0.3)"
                                    returnKeyType="done"
                                />
                                {errors.price ? <Text className="auth-error">{errors.price}</Text> : null}
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label mt-2">Frequency</Text>
                                <View className="picker-row">
                                    {FREQUENCY_OPTIONS.map((option) => {
                                        const active = frequency === option;
                                        return (
                                            <Pressable
                                                key={option}
                                                className={classNames(
                                                    "picker-option",
                                                    active && "picker-option-active",
                                                )}
                                                onPress={() => setFrequency(option)}
                                            >
                                                <Text
                                                    className={classNames(
                                                        "picker-option-text",
                                                        active && "picker-option-text-active",
                                                    )}
                                                >
                                                    {option}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label mt-2">Category</Text>
                                <View className="category-scroll">
                                    {CATEGORY_OPTIONS.map((option) => {
                                        const active = category === option;
                                        return (
                                            <Pressable
                                                key={option}
                                                className={classNames(
                                                    "category-chip",
                                                    active && "category-chip-active",
                                                )}
                                                onPress={() => setCategory(option)}
                                            >
                                                <Text
                                                    className={classNames(
                                                        "category-chip-text",
                                                        active && "category-chip-text-active",
                                                    )}
                                                >
                                                    {option}
                                                </Text>
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            </View>

                            <Pressable
                                className={classNames(
                                    "auth-button mt-2",
                                    !canSubmit && "auth-button-disabled",
                                )}
                                onPress={handleSubmit}
                                disabled={!canSubmit}
                            >
                                <Text className="auth-button-text">Create Subscription</Text>
                            </Pressable>
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default CreateSubscriptionModal;


