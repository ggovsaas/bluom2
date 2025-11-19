import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Dumbbell, 
  Barcode, 
  Clipboard, 
  ChefHat, 
  Calculator,
  Star,
  Play,
  Check,
  ArrowRight,
  Mail,
  Twitter,
  Facebook,
  Instagram,
  Heart
} from 'lucide-react';
import { detectUserCurrency, getPricingForCurrency } from '../utils/currency';

export default function LandingPage() {
  const [userCurrency, setUserCurrency] = useState('EUR');
  const [pricing, setPricing] = useState(getPricingForCurrency('EUR'));

  useEffect(() => {
    const detectedCurrency = detectUserCurrency();
    setUserCurrency(detectedCurrency);
    setPricing(getPricingForCurrency(detectedCurrency));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">✨</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">BloomYou</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Reviews</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">Support</a>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Login
              </Link>
              <div className="flex items-center space-x-2">
                <a
                  href="#"
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="App Store" className="h-8" />
                </a>
                <a
                  href="#"
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Google Play" className="h-8" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Phone Mockups */}
            <div className="relative">
              <div className="relative z-10">
                <div className="flex space-x-4">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative"
                  >
                    <div className="w-64 h-96 bg-gray-900 rounded-3xl p-2 shadow-2xl">
                      <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                        <img 
                          src="/images/app-store/screenshot-home-iphone.png" 
                          alt="BloomYou Home Dashboard"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image doesn't exist
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4" style={{display: 'none'}}>
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                            <span className="text-white text-2xl">📊</span>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900 mb-2">Daily Stats</div>
                            <div className="text-sm text-gray-600">Track your progress</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative -mt-8"
                  >
                    <div className="w-64 h-96 bg-gray-900 rounded-3xl p-2 shadow-2xl">
                      <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                        <img 
                          src="/images/app-store/screenshot-fuel-iphone.png" 
                          alt="BloomYou Nutrition Tracking"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to placeholder if image doesn't exist
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-full h-full bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-4" style={{display: 'none'}}>
                          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4">
                            <span className="text-white text-2xl">🍎</span>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900 mb-2">Nutrition</div>
                            <div className="text-sm text-gray-600">Track your macros</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Right - Content */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Your Wellness Journey
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl">
                Reach your goals with the #1 AI-powered fitness and wellness tracker. BloomYou is the only app you'll ever need.
              </p>
              <Link
                to="/onboarding"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-full hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                Start today for free!
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Calendar,
                title: "Powerful Daily Tracking",
                description: "Track your nutrition and workouts with intelligent insights"
              },
              {
                icon: Dumbbell,
                title: "Smart Workout Plans",
                description: "Get personalized workout recommendations based on your goals"
              },
              {
                icon: Barcode,
                title: "AI Food Recognition",
                description: "Scan food with your camera for instant nutrition analysis"
              },
              {
                icon: Clipboard,
                title: "Comprehensive Database",
                description: "Access thousands of foods and exercises in our database"
              },
              {
                icon: ChefHat,
                title: "Custom Recipes & Meals",
                description: "Create and save your own recipes and meal plans"
              },
              {
                icon: Calculator,
                title: "Smart Macro Calculator",
                description: "Calculate your perfect macro targets automatically"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center p-6 rounded-2xl hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            What Our Community Is Saying
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                text: "Just Amazing! This app changed my life completely.",
                rating: 5,
                author: "Sarah M."
              },
              {
                text: "So Helpful! The AI food recognition is incredible.",
                rating: 5,
                author: "Mike R."
              },
              {
                text: "Best fitness tracker I've ever used!",
                rating: 5,
                author: "Emma L."
              },
              {
                text: "The macro tracking is so accurate and easy to use.",
                rating: 5,
                author: "David K."
              },
              {
                text: "Love the workout recommendations!",
                rating: 5,
                author: "Lisa T."
              },
              {
                text: "Perfect for my fitness journey!",
                rating: 5,
                author: "John S."
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-lg"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-400 fill-current" size={20} />
                  ))}
                </div>
                <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
                <p className="text-sm text-gray-500 font-semibold">- {testimonial.author}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Second Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Fitness tracking made simple (for all)
              </h2>
              <div className="space-y-4 text-gray-600 mb-8">
                <p>Customize your daily macro goals and track your progress with ease.</p>
                <p>Get personalized recommendations for those new to fitness tracking.</p>
                <p>Seamless integrations with your favorite health and fitness platforms.</p>
              </div>
              <Link
                to="/onboarding"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-full hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                Start today for free!
                <ArrowRight className="ml-2" size={20} />
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="flex space-x-4">
                <div className="w-64 h-96 bg-gray-900 rounded-3xl p-2 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                    <img 
                      src="/images/app-store/screenshot-move-iphone.png" 
                          alt="BloomYou Workout Tracking"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image doesn't exist
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-gradient-to-br from-orange-50 to-red-100 flex flex-col items-center justify-center p-4" style={{display: 'none'}}>
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mb-4">
                        <span className="text-white text-2xl">💪</span>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 mb-2">Workouts</div>
                        <div className="text-sm text-gray-600">Track your exercises</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-64 h-96 bg-gray-900 rounded-3xl p-2 shadow-2xl -mt-8">
                  <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                    <img 
                      src="/images/app-store/screenshot-wellness-iphone.png" 
                      alt="BloomYou Wellness Tracking"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image doesn't exist
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-gradient-to-br from-pink-50 to-purple-100 flex flex-col items-center justify-center p-4" style={{display: 'none'}}>
                      <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                        <span className="text-white text-2xl">❤️</span>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 mb-2">Wellness</div>
                        <div className="text-sm text-gray-600">Track your health</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-3xl">👑</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Upgrade to <span className="text-blue-600">Premium</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Unlock the full potential of your fitness journey.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
            {/* 1 Month Trial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center relative"
            >
              <div className="absolute -top-3 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Try Premium</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">1 Month Trial</h3>
              <p className="text-gray-600 mb-6">Perfect for testing all features</p>
              <div className="text-4xl font-bold text-gray-900 mb-2">{pricing.trial.formatted}</div>
              <div className="text-gray-500 mb-8">/month</div>
              <ul className="space-y-4 mb-8 text-left">
                <li className="flex items-center">
                  <Check className="text-green-500 mr-3" size={20} />
                  <span>All Premium features</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-3" size={20} />
                  <span>30-day money-back guarantee</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-3" size={20} />
                  <span>Priority support</span>
                </li>
              </ul>
              <button className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-300 transition-colors">
                Start Free Trial
              </button>
            </motion.div>

            {/* Monthly Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center relative"
            >
              <div className="absolute -top-3 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Flexible</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Monthly</h3>
              <p className="text-gray-600 mb-6">Month-to-month flexibility</p>
              <div className="text-4xl font-bold text-gray-900 mb-2">{pricing.monthly.formatted}</div>
              <div className="text-gray-500 mb-8">/month</div>
              <ul className="space-y-4 mb-8 text-left">
                <li className="flex items-center">
                  <Check className="text-green-500 mr-3" size={20} />
                  <span>All Premium features</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-3" size={20} />
                  <span>Cancel anytime</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-green-500 mr-3" size={20} />
                  <span>Monthly billing</span>
                </li>
              </ul>
              <button className="w-full px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-300 transition-colors">
                Choose Plan
              </button>
            </motion.div>

            {/* Annual Plan - Most Popular */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-center text-white relative"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-semibold">Most Popular</span>
              </div>
              <div className="absolute -top-3 right-4">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">Save 44%</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Annual</h3>
              <p className="opacity-90 mb-6">Best value for committed users</p>
              <div className="text-4xl font-bold mb-2">{pricing.annual.formatted}</div>
              <div className="opacity-80 mb-8">/month</div>
              <ul className="space-y-4 mb-8 text-left">
                <li className="flex items-center">
                  <Check className="text-white mr-3" size={20} />
                  <span>All Premium features</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-white mr-3" size={20} />
                  <span>2 months free</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-white mr-3" size={20} />
                  <span>Annual billing</span>
                </li>
                <li className="flex items-center">
                  <Check className="text-white mr-3" size={20} />
                  <span>Best value</span>
                </li>
              </ul>
              <button className="w-full px-6 py-3 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-colors">
                Choose Plan
              </button>
            </motion.div>
          </div>

          {/* Limited Time Offer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-center text-white mb-16"
          >
            <div className="flex items-center justify-center mb-4">
              <span className="text-2xl mr-2">⭐</span>
              <span className="text-2xl font-bold">Limited Time Offer</span>
            </div>
            <p className="text-xl mb-2">
              Get your first month FREE when you upgrade to annual plan. That's a {pricing.trial.formatted} value!
            </p>
            <p className="text-sm opacity-90">Offer expires in 3 days.</p>
          </motion.div>

          {/* Premium Features */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Premium Features</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Nutrition */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">🌍</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Nutrition</h4>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Unlimited meal logging</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Custom macro targets</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Recipe recommendations</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Nutrition analysis & insights</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Meal planning assistant</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Barcode scanner</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Custom food database</span>
                  </li>
                </ul>
              </motion.div>

              {/* Fitness */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">⚡</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Fitness</h4>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Unlimited workout routines</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Personalized training plans</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Video workout library</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Form analysis & tips</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Progress predictions</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Custom exercise creation</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Advanced workout analytics</span>
                  </li>
                </ul>
              </motion.div>

              {/* Wellness */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">❤️</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Wellness</h4>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Advanced sleep analysis</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Mood pattern insights</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Stress management tools</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Mindfulness sessions</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Recovery optimization</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Health trend analysis</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Wellness coaching</span>
                  </li>
                </ul>
              </motion.div>

              {/* Analytics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📊</span>
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">Analytics</h4>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Body composition tracking</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Detailed progress reports</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Goal achievement predictions</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Custom data exports</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Advanced visualizations</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Comparative analytics</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Check className="text-green-500 mr-2" size={16} />
                    <span>Performance insights</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>

          {/* User Testimonials */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">What Users Say</h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  text: "The personalized workout plans helped me lose 25 pounds in 4 months!",
                  author: "Sarah M.",
                  location: "New York, USA"
                },
                {
                  text: "The AI food recognition is incredible. It saves me so much time logging meals.",
                  author: "Mike R.",
                  location: "London, UK"
                },
                {
                  text: "Best fitness tracker I've ever used! The analytics are amazing.",
                  author: "Emma L.",
                  location: "Sydney, Australia"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white p-6 rounded-2xl shadow-lg"
                >
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="text-yellow-400 fill-current" size={20} />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">"{testimonial.text}"</p>
                  <p className="text-sm text-gray-500 font-semibold">- {testimonial.author}, {testimonial.location}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Security & Payment */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🛡️</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Your Data is Safe</h4>
              <ul className="space-y-2 text-left">
                <li className="flex items-center text-sm">
                  <Check className="text-green-500 mr-2" size={16} />
                  <span>256-bit SSL encryption</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="text-green-500 mr-2" size={16} />
                  <span>GDPR compliant data handling</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="text-green-500 mr-2" size={16} />
                  <span>Cancel anytime, no questions asked</span>
                </li>
                <li className="flex items-center text-sm">
                  <Check className="text-green-500 mr-2" size={16} />
                  <span>30-day money-back guarantee</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">🔒</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Secure Payment</h4>
              <p className="text-gray-600 mb-4">
                We accept all major payment methods and process payments securely through industry-leading providers.
              </p>
              <div className="flex justify-center space-x-4">
                <span className="text-sm text-gray-500">Credit Cards</span>
                <span className="text-sm text-gray-500">Bank Transfer</span>
                <span className="text-sm text-gray-500">Digital Wallets</span>
              </div>
            </motion.div>
          </div>

          {/* FAQ */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl">❓</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-12">Frequently Asked Questions</h3>
            <div className="max-w-3xl mx-auto space-y-6 text-left">
              {[
                {
                  question: "Can I cancel anytime?",
                  answer: "Yes! You can cancel your subscription at any time from your account settings. No questions asked."
                },
                {
                  question: "What happens to my data if I cancel?",
                  answer: "Your data remains safe and accessible. You can export all your data before canceling if you wish."
                },
                {
                  question: "Is there a family plan?",
                  answer: "Currently, we offer individual plans. Family plans are coming soon in 2024!"
                },
                {
                  question: "Do you offer student discounts?",
                  answer: "Yes! Students get 50% off all plans. Contact support with your student ID for verification."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-gray-50 p-6 rounded-2xl"
                >
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h4>
                  <p className="text-gray-600">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Stay up to date on new features, fitness tips, and discounts
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-full border-0 focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />
            <button className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-full hover:from-pink-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105">
              SIGN UP
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Logo & Description */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✨</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">BloomYou</span>
              </div>
              <p className="text-gray-600 mb-4">
                Your AI-powered fitness companion. Track nutrition, log workouts, and achieve your goals with intelligent insights.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Twitter size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Facebook size={20} />
                </a>
                <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Instagram size={20} />
                </a>
              </div>
            </div>

            {/* Navigation Links */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* App Store Badges */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Download</h3>
              <div className="space-y-4">
                <a
                  href="#"
                  className="block"
                >
                  <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" className="h-12" />
                </a>
                <a
                  href="#"
                  className="block"
                >
                  <img src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png" alt="Get it on Google Play" className="h-12" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-500">&copy; 2024 BloomYou. Your wellness companion</p>
          </div>
        </div>
      </footer>
    </div>
  );
}