"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, SubscriptionInfo } from "@/lib/api";
import { toast } from "sonner";
import Image from "next/image";

export default function SubscriptionPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [subscriptionInfo, setSubscriptionInfo] =
    useState<SubscriptionInfo | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [loading, setLoading] = useState(false);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Fetch subscription info
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!token) return;
      try {
        const info = await api.getSubscriptionInfo(token);
        setSubscriptionInfo(info);
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
        toast.error("Failed to load subscription information");
      }
    };
    fetchSubscription();
  }, [token]);

  // Handle upgrade/checkout
  const handleUpgrade = async (tier: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await api.createCheckoutSession(token, {
        tier: tier as any,
        billing_period: billingPeriod,
      });
      // Redirect to Stripe Checkout
      window.location.href = response.checkout_url;
    } catch (error) {
      console.error("Failed to create checkout:", error);
      toast.error("Failed to start checkout process");
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (
      !token ||
      !confirm("Are you sure you want to cancel your subscription?")
    )
      return;
    setLoading(true);
    try {
      await api.cancelSubscription(token);
      toast.success("Subscription cancelled successfully");
      // Refresh subscription info
      const info = await api.getSubscriptionInfo(token);
      setSubscriptionInfo(info);
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  // Tier definitions with pricing
  const tiers = [
    {
      name: "Student",
      id: "student",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: ["5 documents", "3 chat messages", "2 collections"],
    },
    {
      name: "Researcher",
      id: "researcher",
      monthlyPrice: 10,
      yearlyPrice: 100,
      features: ["100 documents", "200 chat messages", "10 collections"],
    },
    {
      name: "Academic",
      id: "academic",
      monthlyPrice: 20,
      yearlyPrice: 200,
      features: [
        "500 documents",
        "1000 chat messages",
        "Unlimited collections",
      ],
    },
    {
      name: "Scholar",
      id: "scholar",
      monthlyPrice: null,
      yearlyPrice: null,
      features: [
        "Unlimited documents",
        "Unlimited chats",
        "Priority support",
        "Custom integrations",
      ],
    },
  ];

  // Render tier cards, billing toggle, cancel button, etc.
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {/* Header - Compact */}
      <header className="bg-deep-charcoal/90 backdrop-blur-sm border-b border-off-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-muted-teal hover:text-muted-teal/80 flex items-center gap-1 transition-colors text-sm"
            >
              ← Back to Dashboard
            </button>
            <div className="h-8 w-px bg-off-white/20"></div>
            <Image
              src="/logo.png"
              alt="ScholarVault Logo"
              width={40}
              height={40}
            />
            <h1 className="text-lg font-bold text-off-white font-logo truncate">
              Subscription Plans
            </h1>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto p-6">
        {/* Current Subscription Status */}
        {subscriptionInfo && (
          <div className="mb-8 p-6 bg-deep-charcoal/80 rounded-lg border border-muted-teal/30">
            <h2 className="text-2xl font-bold text-off-white mb-4">
              Current Subscription
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-off-white/70">Tier</p>
                <p className="text-lg font-semibold text-muted-teal capitalize">
                  {subscriptionInfo.tier}
                </p>
              </div>
              <div>
                <p className="text-sm text-off-white/70">Status</p>
                <p className="text-lg font-semibold text-off-white capitalize">
                  {subscriptionInfo.status}
                </p>
              </div>
              {subscriptionInfo.is_trial_active &&
                subscriptionInfo.trial_end_date && (
                  <div className="col-span-2">
                    <p className="text-sm text-off-white/70">Trial Ends</p>
                    <p className="text-lg font-semibold text-yellow-400">
                      {new Date(
                        subscriptionInfo.trial_end_date
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
            </div>
            {subscriptionInfo.tier !== "student" &&
              subscriptionInfo.status === "active" && (
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                >
                  Cancel Subscription
                </button>
              )}
          </div>
        )}

        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-deep-charcoal/80 rounded-lg p-1 border border-muted-teal/30">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingPeriod === "monthly"
                  ? "bg-muted-teal text-off-white"
                  : "text-off-white/70 hover:text-off-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-md transition-colors ${
                billingPeriod === "yearly"
                  ? "bg-muted-teal text-off-white"
                  : "text-off-white/70 hover:text-off-white"
              }`}
            >
              Yearly <span className="text-xs">(Save 17%)</span>
            </button>
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => {
            const isCurrentTier = subscriptionInfo?.tier === tier.id;
            const price =
              billingPeriod === "monthly"
                ? tier.monthlyPrice
                : tier.yearlyPrice;
            const isEnterprise = tier.id === "scholar";

            return (
              <div
                key={tier.id}
                className={`p-6 rounded-lg border-2 ${
                  isCurrentTier
                    ? "border-muted-teal bg-muted-teal/10"
                    : "border-deep-charcoal/50 bg-deep-charcoal/60"
                }`}
              >
                <h3 className="text-xl font-bold text-off-white mb-2">
                  {tier.name}
                </h3>
                <div className="mb-4">
                  {isEnterprise ? (
                    <p className="text-3xl font-bold text-off-white">Custom</p>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-off-white">
                        ${price}
                      </span>
                      <span className="text-off-white/70">
                        /{billingPeriod === "monthly" ? "mo" : "yr"}
                      </span>
                    </>
                  )}
                </div>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-off-white/80 flex items-start"
                    >
                      <span className="text-muted-teal mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                {isCurrentTier ? (
                  <button
                    disabled
                    className="w-full px-4 py-2 bg-muted-teal/50 text-off-white rounded-lg cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : isEnterprise ? (
                  <button
                    onClick={() =>
                      window.open("mailto:support@scholarvault.com", "_blank")
                    }
                    className="w-full px-4 py-2 bg-muted-teal hover:bg-muted-teal/90 text-off-white rounded-lg"
                  >
                    Contact Sales
                  </button>
                ) : tier.id === "student" ? (
                  <button
                    disabled
                    className="w-full px-4 py-2 bg-deep-charcoal/50 text-off-white/50 rounded-lg cursor-not-allowed"
                  >
                    Free Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-muted-teal hover:bg-muted-teal/90 text-off-white rounded-lg disabled:opacity-50"
                  >
                    {subscriptionInfo && subscriptionInfo.tier === "student"
                      ? "Upgrade"
                      : "Switch Plan"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 30-Day Trial Info */}
        <div className="mt-8 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
          <p className="text-yellow-400 text-center">
            Researcher tier includes a 30-day free trial. Card required - you
            won&apos;t be charged until the trial ends. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
