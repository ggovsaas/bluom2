// src/components/PremiumGate.tsx
// Premium feature gate component

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Lock } from 'lucide-react';
import { checkPremiumStatus, SubscriptionStatus } from '../utils/premium';
import { startCheckout } from '../utils/stripe';

interface PremiumGateProps {
  children: React.ReactNode;
  feature?: string;
  showUpgrade?: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ 
  children, 
  feature,
  showUpgrade = true 
}) => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    setLoading(true);
    const status = await checkPremiumStatus();
    setSubscription(status);
    setLoading(false);
  };

  const handleUpgrade = async (plan: "monthly" | "yearly") => {
    try {
      await startCheckout(plan);
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("Failed to start checkout. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (subscription?.isPremium) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="relative">
        {/* Blurred content */}
        <div className="blur-sm pointer-events-none opacity-50">
          {children}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-100 rounded-full p-3">
                <Lock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Premium Feature
            </h3>
            
            <p className="text-gray-600 mb-6">
              {feature 
                ? `This feature requires a Premium subscription.`
                : "Upgrade to Premium to unlock this feature."
              }
            </p>

            {showUpgrade && (
              <div className="space-y-3">
                <button
                  onClick={() => handleUpgrade("monthly")}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  <Crown className="w-4 h-4 inline mr-2" />
                  Upgrade to Premium
                </button>
                
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full text-gray-600 text-sm hover:text-gray-800"
                >
                  View Plans
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Choose Your Plan
            </h2>

            <div className="space-y-4 mb-6">
              <div className="border-2 border-blue-600 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">Monthly</h3>
                  <span className="text-2xl font-bold text-blue-600">€8.09</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">per month</p>
                <button
                  onClick={() => handleUpgrade("monthly")}
                  className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                >
                  Subscribe Monthly
                </button>
              </div>

              <div className="border-2 border-purple-600 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">Yearly</h3>
                  <div>
                    <span className="text-2xl font-bold text-purple-600">€54</span>
                    <span className="text-sm text-gray-600">/year</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">€4.50 per month (save 44%)</p>
                <button
                  onClick={() => handleUpgrade("yearly")}
                  className="w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition"
                >
                  Subscribe Yearly
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
};


