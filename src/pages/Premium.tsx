import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Check, 
  Zap, 
  Target, 
  TrendingUp,
  Heart,
  Brain,
  Shield,
  Star,
  Sparkles,
  Globe,
  CreditCard
} from 'lucide-react';
import { useUser } from '../context/UserContext';

const Premium: React.FC = () => {
  const { profile, updateProfile } = useUser();
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [selectedPlan, setSelectedPlan] = useState('annual');

  const currencies = [
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
  ];

  const pricing = {
    EUR: { trial: 9.08, monthly: 8.09, annual: 4.50 },
    USD: { trial: 9.99, monthly: 8.99, annual: 4.99 },
    GBP: { trial: 7.99, monthly: 7.49, annual: 3.99 },
    CAD: { trial: 12.99, monthly: 11.99, annual: 6.49 },
    AUD: { trial: 14.99, monthly: 13.99, annual: 7.49 },
    JPY: { trial: 1200, monthly: 1100, annual: 600 }
  };

  const currentPricing = pricing[selectedCurrency as keyof typeof pricing];
  const currencySymbol = currencies.find(c => c.code === selectedCurrency)?.symbol || '€';

  const features = [
    {
      category: 'Nutrition',
      icon: Target,
      items: [
        'Unlimited meal logging',
        'Custom macro targets',
        'Recipe recommendations',
        'Nutrition analysis & insights',
        'Meal planning assistant',
        'Barcode scanner',
        'Custom food database'
      ]
    },
    {
      category: 'Fitness',
      icon: Zap,
      items: [
        'Unlimited workout routines',
        'Personalized training plans',
        'Video workout library',
        'Form analysis & tips',
        'Progress predictions',
        'Custom exercise creation',
        'Advanced workout analytics'
      ]
    },
    {
      category: 'Wellness',
      icon: Heart,
      items: [
        'Advanced sleep analysis',
        'Mood pattern insights',
        'Stress management tools',
        'Mindfulness sessions',
        'Recovery optimization',
        'Health trend analysis',
        'Wellness coaching'
      ]
    },
    {
      category: 'Analytics',
      icon: TrendingUp,
      items: [
        'Body composition tracking',
        'Detailed progress reports',
        'Goal achievement predictions',
        'Custom data exports',
        'Advanced visualizations',
        'Comparative analytics',
        'Performance insights'
      ]
    }
  ];

  const plans = [
    {
      id: 'trial',
      name: '1 Month Trial',
      price: currentPricing.trial,
      period: '/month',
      popular: false,
      savings: 'Try Premium',
      description: 'Perfect for testing all features',
      features: ['All Premium features', '30-day money-back guarantee', 'Priority support']
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: currentPricing.monthly,
      period: '/month',
      popular: false,
      savings: 'Flexible',
      description: 'Month-to-month flexibility',
      features: ['All Premium features', 'Cancel anytime', 'Monthly billing']
    },
    {
      id: 'annual',
      name: 'Annual',
      price: currentPricing.annual,
      period: '/month',
      popular: true,
      savings: 'Save 44%',
      description: 'Best value for committed users',
      features: ['All Premium features', '2 months free', 'Annual billing', 'Best value']
    }
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      text: 'The personalized workout plans helped me lose 25 pounds in 4 months!',
      rating: 5,
      location: 'New York, USA'
    },
    {
      name: 'Mike T.',
      text: 'The nutrition insights completely changed how I think about food.',
      rating: 5,
      location: 'London, UK'
    },
    {
      name: 'Jessica L.',
      text: 'Finally found an app that actually helps me sleep better.',
      rating: 5,
      location: 'Toronto, Canada'
    }
  ];

  const handleUpgrade = (planId: string) => {
    // In a real app, this would integrate with payment processing
    updateProfile({ isPremium: true });
    alert(`Upgrading to ${plans.find(p => p.id === planId)?.name} plan! (Demo only)`);
  };

  if (profile?.isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="px-6 pt-12 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="text-yellow-600" size={48} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">You're Premium!</h1>
            <p className="text-gray-600 mb-8">
              Enjoy unlimited access to all features and continue crushing your goals.
            </p>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Premium Benefits</h3>
              <div className="grid grid-cols-2 gap-4">
                {features.map((feature) => (
                  <div key={feature.category} className="text-left">
                    <div className="flex items-center space-x-2 mb-2">
                      <feature.icon className="text-blue-600" size={20} />
                      <h4 className="font-medium text-gray-800">{feature.category}</h4>
                    </div>
                    <ul className="space-y-1">
                      {feature.items.slice(0, 2).map((item, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <Check className="text-green-500 mr-1 mt-0.5 flex-shrink-0" size={12} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <button className="bg-gray-100 text-gray-600 px-8 py-3 rounded-xl font-medium">
              Manage Subscription
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Upgrade to <span className="gradient-text">Premium</span>
          </h1>
          <p className="text-gray-600">
            Unlock the full potential of your fitness journey
          </p>
        </motion.div>

        {/* Currency Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-4 shadow-lg mb-6"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Globe className="text-blue-600" size={20} />
            <h3 className="font-semibold text-gray-800">Currency</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {currencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => setSelectedCurrency(currency.code)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  selectedCurrency === currency.code
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {currency.symbol} {currency.code}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Pricing Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Choose Your Plan</h2>
          
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl p-6 shadow-lg relative ${
                  plan.popular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{plan.description}</p>
                    <div className="flex items-baseline">
                      <span className="text-3xl font-bold text-gray-800">
                        {currencySymbol}{plan.price.toFixed(selectedCurrency === 'JPY' ? 0 : 2)}
                      </span>
                      <span className="text-gray-600 ml-1">{plan.period}</span>
                    </div>
                  </div>
                  {plan.savings && (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {plan.savings}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <Check className="text-green-500 flex-shrink-0" size={16} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {plan.id === 'trial' ? 'Start Free Trial' : 'Choose Plan'}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 text-center">Premium Features</h2>
          {features.map((feature, index) => (
            <div key={feature.category} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <feature.icon className="text-blue-600" size={24} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{feature.category}</h3>
              </div>
              <ul className="space-y-2">
                {feature.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start space-x-2">
                    <Check className="text-green-500 mt-0.5 flex-shrink-0" size={16} />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Special Offer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Sparkles className="text-white" size={24} />
            <h3 className="text-lg font-bold">Limited Time Offer</h3>
          </div>
          <p className="mb-4">
            Get your first month FREE when you upgrade to annual plan. 
            That's a {currencySymbol}{currentPricing.trial.toFixed(selectedCurrency === 'JPY' ? 0 : 2)} value!
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm opacity-90">Offer expires in 3 days</span>
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">What Users Say</h2>
          
          <div className="space-y-4">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center space-x-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-500 fill-current" size={16} />
                  ))}
                </div>
                <p className="text-gray-700 mb-3">"{testimonial.text}"</p>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600 font-medium">- {testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security & Trust */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">Your Data is Safe</h3>
          </div>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center space-x-2">
              <Check className="text-green-500" size={16} />
              <span>256-bit SSL encryption</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="text-green-500" size={16} />
              <span>GDPR compliant data handling</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="text-green-500" size={16} />
              <span>Cancel anytime, no questions asked</span>
            </li>
            <li className="flex items-center space-x-2">
              <Check className="text-green-500" size={16} />
              <span>30-day money-back guarantee</span>
            </li>
          </ul>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">Secure Payment</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            We accept all major payment methods and process payments securely through industry-leading providers.
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>💳 Credit Cards</span>
            <span>🏦 Bank Transfer</span>
            <span>📱 Digital Wallets</span>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Can I cancel anytime?</h4>
              <p className="text-gray-600 text-sm">Yes, you can cancel your subscription at any time with no cancellation fees.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-1">What happens to my data if I cancel?</h4>
              <p className="text-gray-600 text-sm">Your data remains accessible for 30 days after cancellation, then it's permanently deleted if you don't resubscribe.</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Is there a family plan?</h4>
              <p className="text-gray-600 text-sm">Family plans are coming soon! Each account needs its own subscription for now.</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-1">Do you offer student discounts?</h4>
              <p className="text-gray-600 text-sm">Yes! Students get 50% off with valid student ID verification.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Premium;