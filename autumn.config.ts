import {
	feature,
	product,
	featureItem,
	pricedFeatureItem,
	priceItem,
} from "atmn";

// Features
export const transactions = feature({
	id: "transactions",
	name: "Transactions",
	type: "single_use",
});

export const apiAccess = feature({
	id: "api_access",
	name: "API Access",
	type: "boolean",
});

export const priorityEmailSupport = feature({
	id: "priority_email_support",
	name: "Priority Email Support",
	type: "boolean",
});

export const rules = feature({
	id: "rules",
	name: "Rules",
	type: "single_use",
});

export const stripeAccounts = feature({
	id: "stripe_accounts",
	name: "Stripe Accounts",
	type: "single_use",
});

export const advancedAiAgents = feature({
	id: "advanced_ai_agents",
	name: "Advanced AI Agents",
	type: "boolean",
});

// Products
export const starterTier1Monthly = product({
	id: "starter_tier_1_monthly",
	name: "Starter Tier 1 Monthly",
	items: [
		priceItem({
			price: 148,
			interval: "month",
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 5000,
			interval: "month",
		}),
	],
});

export const starterTier2Monthly = product({
	id: "starter_tier_2_monthly",
	name: "Starter Tier 2 Monthly",
	items: [
		priceItem({
			price: 209,
			interval: "month",
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 10000,
			interval: "month",
		}),
	],
});

export const growthTier1Montly = product({
	id: "growth_tier_1_montly",
	name: "Growth Tier 1 Monthly",
	items: [
		priceItem({
			price: 297,
			interval: "month",
		}),

		featureItem({
			feature_id: advancedAiAgents.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: apiAccess.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: priorityEmailSupport.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: "inf",
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 5,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 5000,
			interval: "month",
		}),
	],
});

export const growthTier2Monthly = product({
	id: "growth_tier_2_monthly",
	name: "Growth Tier 2 Monthly",
	items: [
		priceItem({
			price: 418,
			interval: "month",
		}),

		featureItem({
			feature_id: advancedAiAgents.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: apiAccess.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: priorityEmailSupport.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: "inf",
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 5,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 10000,
			interval: "month",
		}),
	],
});

export const starterTier3Monthly = product({
	id: "starter_tier_3_monthly",
	name: "Starter Tier 3 Monthly",
	items: [
		priceItem({
			price: 597,
			interval: "month",
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 50000,
			interval: "month",
		}),
	],
});

export const starterTier4Monthly = product({
	id: "starter_tier_4_monthly",
	name: "Starter Tier 4 Monthly",
	items: [
		priceItem({
			price: 896,
			interval: "month",
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 100000,
			interval: "month",
		}),
	],
});

export const growthTier3Monthly = product({
	id: "growth_tier_3_monthly",
	name: "Growth Tier 3 Monthly",
	items: [
		priceItem({
			price: 1194,
			interval: "month",
		}),

		featureItem({
			feature_id: advancedAiAgents.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: apiAccess.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: priorityEmailSupport.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: "inf",
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 5,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 50000,
			interval: "month",
		}),
	],
});

export const growthTier4Monthly = product({
	id: "growth_tier_4_monthly",
	name: "Growth Tier 4 Monthly",
	items: [
		priceItem({
			price: 1791,
			interval: "month",
		}),

		featureItem({
			feature_id: advancedAiAgents.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: apiAccess.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: priorityEmailSupport.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: "inf",
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 5,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 100000,
			interval: "month",
		}),
	],
});

export const starterTier5Monthly = product({
	id: "starter_tier_5_monthly",
	name: "Starter Tier 5 Monthly",
	items: [
		priceItem({
			price: 1866,
			interval: "month",
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 250000,
			interval: "month",
		}),
	],
});

export const starterTier6Monthly = product({
	id: "starter_tier_6_monthly",
	name: "Starter Tier 6 Monthly",
	items: [
		priceItem({
			price: 2985,
			interval: "month",
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 500000,
			interval: "month",
		}),
	],
});

export const growthTier5Monthly = product({
	id: "growth_tier_5_monthly",
	name: "Growth Tier 5 Monthly",
	items: [
		priceItem({
			price: 3731,
			interval: "month",
		}),

		featureItem({
			feature_id: advancedAiAgents.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: apiAccess.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: priorityEmailSupport.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: "inf",
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 5,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 250000,
			interval: "month",
		}),
	],
});

export const starterTier7Monthly = product({
	id: "starter_tier_7_monthly",
	name: "Starter Tier 7 Monthly",
	items: [
		priceItem({
			price: 4478,
			interval: "month",
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 1000000,
			interval: "month",
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 1000000,
			interval: "month",
		}),
	],
});

export const growthTier6Monthly = product({
	id: "growth_tier_6_monthly",
	name: "Growth Tier 6 Monthly",
	items: [
		priceItem({
			price: 5970,
			interval: "month",
		}),

		featureItem({
			feature_id: advancedAiAgents.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: apiAccess.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: priorityEmailSupport.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: "inf",
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 5,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 500000,
			interval: "month",
		}),
	],
});

export const growthTier7Monthly = product({
	id: "growth_tier_7_monthly",
	name: "Growth Tier 7 Monthly",
	items: [
		priceItem({
			price: 8955,
			interval: "month",
		}),

		featureItem({
			feature_id: advancedAiAgents.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: apiAccess.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: priorityEmailSupport.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: "inf",
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 5,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 1000000,
			interval: "month",
		}),
	],
});

export const starterTier1Yearly = product({
	id: "starter_tier_1_yearly",
	name: "Starter Tier 1 Yearly",
	items: [
		priceItem({
			price: 1188,
			interval: "year",
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 5000,
			interval: "month",
		}),
	],
});

export const starterTier2Yearly = product({
	id: "starter_tier_2_yearly",
	name: "Starter Tier 2 Yearly",
	items: [
		priceItem({
			price: 1680,
			interval: "year",
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 10000,
			interval: "month",
		}),
	],
});

export const growthTier1Yearly = product({
	id: "growth_tier_1_yearly",
	name: "Growth Tier 1 Yearly",
	items: [
		priceItem({
			price: 2388,
			interval: "year",
		}),

		featureItem({
			feature_id: advancedAiAgents.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: apiAccess.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: priorityEmailSupport.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: "inf",
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 5,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 5000,
			interval: "month",
		}),
	],
});

export const growthTier2Yearly = product({
	id: "growth_tier_2_yearly",
	name: "Growth Tier 2 Yearly",
	items: [
		priceItem({
			price: 3360,
			interval: "year",
		}),

		featureItem({
			feature_id: advancedAiAgents.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: apiAccess.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: priorityEmailSupport.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: "inf",
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 5,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 10000,
			interval: "month",
		}),
	],
});

export const starterTier3Yearly = product({
	id: "starter_tier_3_yearly",
	name: "Starter Tier 3 Yearly",
	items: [
		priceItem({
			price: 4800,
			interval: "year",
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 50000,
			interval: "month",
		}),
	],
});

export const starterTier4Yearly = product({
	id: "starter_tier_4_yearly",
	name: "Starter Tier 4 Yearly",
	items: [
		priceItem({
			price: 7200,
			interval: "year",
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 100000,
			interval: "month",
		}),
	],
});

export const growthTier3Yearly = product({
	id: "growth_tier_3_yearly",
	name: "Growth Tier 3 Yearly",
	items: [
		priceItem({
			price: 9600,
			interval: "year",
		}),

		featureItem({
			feature_id: advancedAiAgents.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: apiAccess.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: priorityEmailSupport.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: "inf",
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 5,
			interval: "month",
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 50000,
			interval: "month",
		}),
	],
});

export const growthTier4Yearly = product({
	id: "growth_tier_4_yearly",
	name: "Growth Tier 4 Yearly",
	items: [
		priceItem({
			price: 14400,
			interval: "year",
		}),

		featureItem({
			feature_id: advancedAiAgents.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: apiAccess.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: priorityEmailSupport.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: "inf",
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 5,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 100000,
			interval: "month",
		}),
	],
});

export const starterTier5Yearly = product({
	id: "starter_tier_5_yearly",
	name: "Starter Tier 5 Yearly",
	items: [
		priceItem({
			price: 15000,
			interval: "year",
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 250000,
			interval: "month",
		}),
	],
});

export const starterTier6Yearly = product({
	id: "starter_tier_6_yearly",
	name: "Starter Tier 6 Yearly",
	items: [
		priceItem({
			price: 24000,
			interval: "year",
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 500000,
			interval: "month",
		}),
	],
});

export const growthTier5Yearly = product({
	id: "growth_tier_5_yearly",
	name: "Growth Tier 5 Yearly",
	items: [
		priceItem({
			price: 30000,
			interval: "year",
		}),

		featureItem({
			feature_id: advancedAiAgents.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: apiAccess.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: priorityEmailSupport.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: "inf",
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 5,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 250000,
			interval: "month",
		}),
	],
});

export const starterTier7Yearly = product({
	id: "starter_tier_7_yearly",
	name: "Starter Tier 7 Yearly",
	items: [
		priceItem({
			price: 36000,
			interval: "year",
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: 3,
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 1,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 1000000,
			interval: "month",
		}),
	],
});

export const growthTier6Yearly = product({
	id: "growth_tier_6_yearly",
	name: "Growth Tier 6 Yearly",
	items: [
		priceItem({
			price: 48000,
			interval: "year",
		}),

		featureItem({
			feature_id: advancedAiAgents.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: apiAccess.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: priorityEmailSupport.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: "inf",
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 5,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 500000,
			interval: "month",
		}),
	],
});

export const growthTier7Yearly = product({
	id: "growth_tier_7_yearly",
	name: "Growth Tier 7 Yearly",
	items: [
		priceItem({
			price: 72000,
			interval: "year",
		}),

		featureItem({
			feature_id: advancedAiAgents.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: apiAccess.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: priorityEmailSupport.id,
			included_usage: 0,
		}),

		featureItem({
			feature_id: rules.id,
			included_usage: "inf",
		}),

		featureItem({
			feature_id: stripeAccounts.id,
			included_usage: 5,
		}),

		featureItem({
			feature_id: transactions.id,
			included_usage: 1000000,
			interval: "year",
		}),
	],
});
