import dayjs from "dayjs";

export const formatCurrency = (value: number, _currency = "INR"): string => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `Rs. ${value.toFixed(2)}`;
  }
};

export const getNextRenewalDate = (
  subscription: Pick<Subscription, "renewalDate" | "startDate" | "billing">,
  referenceDate = dayjs(),
): dayjs.Dayjs | null => {
  const seedDate = subscription.renewalDate || subscription.startDate;
  const parsed = dayjs(seedDate);

  if (!parsed.isValid()) {
    return null;
  }

  const cadence = subscription.billing === "Yearly" ? "year" : "month";
  const reference = referenceDate.startOf("day");
  let candidate = parsed;
  let safetyCounter = 0;

  while (candidate.startOf("day").isBefore(reference) && safetyCounter < 240) {
    candidate = candidate.add(1, cadence);
    safetyCounter += 1;
  }

  return candidate.startOf("day").isBefore(reference) ? null : candidate;
};

export const formatSubscriptionDateTime = (value?: string): string => {
  if (!value) return "Not provided";
  const parsedDate = dayjs(value);
  return parsedDate.isValid() ? parsedDate.format("MM/DD/YYYY") : "Not provided";
};

export const formatStatusLabel = (value?: string): string => {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
};