import type { ImageSourcePropType } from "react-native";

import { icons, type IconKey } from "@/constants/icons";

const FALLBACK_ICON_KEY: IconKey = "wallet";

const EXACT_ICON_ALIASES: Record<string, IconKey> = {
    spotify: "spotify",
    netflix: "netflix",
    youtube: "netflix",
    "youtube premium": "netflix",
    "youtube music": "spotify",
    hulu: "netflix",
    "disney plus": "netflix",
    "disney+": "netflix",
    "prime video": "netflix",
    max: "netflix",
    crunchyroll: "netflix",
    twitch: "netflix",
    notion: "notion",
    airtable: "notion",
    slack: "notion",
    trello: "notion",
    clickup: "notion",
    asana: "notion",
    figma: "figma",
    sketch: "figma",
    invision: "figma",
    adobe: "adobe",
    "adobe creative cloud": "adobe",
    photoshop: "adobe",
    illustrator: "adobe",
    "lightroom": "adobe",
    github: "github",
    "github pro": "github",
    gitlab: "github",
    bitbucket: "github",
    vercel: "github",
    netlify: "github",
    claude: "claude",
    canva: "canva",
    "canva pro": "canva",
    dropbox: "dropbox",
    "google drive": "dropbox",
    icloud: "dropbox",
    onedrive: "dropbox",
    box: "dropbox",
    openai: "openai",
    chatgpt: "openai",
    "chat gpt": "openai",
    perplexity: "openai",
    gemini: "openai",
    medium: "medium",
    substack: "medium",
};

const KEYWORD_ICON_RULES: Array<{ icon: IconKey; keywords: string[] }> = [
    { icon: "spotify", keywords: ["spotify", "music", "audio"] },
    { icon: "netflix", keywords: ["netflix", "youtube", "stream", "movie", "video"] },
    { icon: "notion", keywords: ["notion", "workspace", "notes"] },
    { icon: "figma", keywords: ["figma", "prototype", "design"] },
    { icon: "adobe", keywords: ["adobe", "creative cloud", "photoshop", "illustrator"] },
    { icon: "github", keywords: ["github", "git", "repository", "repo"] },
    { icon: "claude", keywords: ["claude", "anthropic"] },
    { icon: "openai", keywords: ["openai", "chatgpt", "gpt", "assistant"] },
    { icon: "canva", keywords: ["canva"] },
    { icon: "dropbox", keywords: ["dropbox", "storage", "drive", "backup"] },
    { icon: "medium", keywords: ["medium", "blog", "newsletter"] },
];

const normalizeName = (value: string): string =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const includesKeyword = (name: string, keyword: string): boolean => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const boundaryRegex = new RegExp(`(^|\\s)${escaped}(\\s|$)`);
    return boundaryRegex.test(name) || name.includes(keyword);
};

export const resolveSubscriptionIconKey = (subscriptionName: string): IconKey => {
    const normalizedName = normalizeName(subscriptionName);

    if (!normalizedName) {
        return FALLBACK_ICON_KEY;
    }

    const exactMatch = EXACT_ICON_ALIASES[normalizedName];
    if (exactMatch) {
        return exactMatch;
    }

    let bestMatch: { icon: IconKey; score: number } | null = null;

    for (const rule of KEYWORD_ICON_RULES) {
        const score = rule.keywords.reduce((total, keyword) => {
            return total + (includesKeyword(normalizedName, keyword) ? 1 : 0);
        }, 0);

        if (score === 0) {
            continue;
        }

        if (!bestMatch || score > bestMatch.score) {
            bestMatch = { icon: rule.icon, score };
        }
    }

    return bestMatch?.icon ?? FALLBACK_ICON_KEY;
};

export const resolveSubscriptionIcon = (subscriptionName: string): ImageSourcePropType => {
    const iconKey = resolveSubscriptionIconKey(subscriptionName);
    return icons[iconKey] ?? icons[FALLBACK_ICON_KEY];
};


