import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

interface Plan {
  id: string;
  name: string;
  price: number;
  period: string;
  popular: boolean;
  savings: string;
  description: string;
  features: string[];
}

interface Feature {
  category: string;
  icon: string;
  items: string[];
}

interface Testimonial {
  name: string;
  text: string;
  rating: number;
  location: string;
}

export default function PremiumScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useUser();

  // Stripe handles currency conversion automatically
  const pricing = {
    trial: 9.99,
    monthly: 8.99,
    annual: 4.99,
  };

  const features: Feature[] = [
    {
      category: 'Nutrition',
      icon: 'target',
      items: [
        'Unlimited meal logging',
        'Custom macro targets',
        'Recipe recommendations',
        'Nutrition analysis & insights',
        'Meal planning assistant',
        'Barcode scanner',
        'Custom food database',
        'Personalized nutrition plan',
        'Weekly adjustments',
      ],
    },
    {
      category: 'Fitness',
      icon: 'flash',
      items: [
        'Unlimited workout routines',
        'Personalized training plans',
        'Video workout library',
        'Form analysis & tips',
        'Progress predictions',
        'Custom exercise creation',
        'Advanced workout analytics',
      ],
    },
    {
      category: 'Wellness',
      icon: 'heart',
      items: [
        'Advanced sleep analysis',
        'Mood pattern insights',
        'Stress management tools',
        'Mindfulness soundscapes',
        'Recovery optimization',
        'Health trend analysis',
        'Wellness personalization',
      ],
    },
    {
      category: 'Analytics',
      icon: 'trending-up',
      items: [
        'Body composition tracking',
        'Detailed progress reports',
        'Goal achievement predictions',
        'Custom data exports',
        'Advanced visualizations',
        'Comparative analytics',
        'Performance insights',
      ],
    },
  ];

  const plans: Plan[] = [
    {
      id: 'trial',
      name: '1 Month Trial',
      price: pricing.trial,
      period: '/month',
      popular: false,
      savings: 'Try Premium',
      description: 'Perfect for testing all features',
      features: ['All Premium features', '30-day money-back guarantee', 'Priority support'],
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: pricing.monthly,
      period: '/month',
      popular: false,
      savings: 'Flexible',
      description: 'Month-to-month flexibility',
      features: ['All Premium features', 'Cancel anytime', 'Monthly billing'],
    },
    {
      id: 'annual',
      name: 'Annual',
      price: pricing.annual,
      period: '/month',
      popular: true,
      savings: 'Save 44%',
      description: 'Best value for committed users',
      features: ['All Premium features', '2 months free', 'Annual billing', 'Best value'],
    },
  ];

  const testimonials: Testimonial[] = [
    {
      name: 'Sarah M.',
      text: 'The personalized workout plans helped me lose 25 pounds in 4 months!',
      rating: 5,
      location: 'New York, USA',
    },
    {
      name: 'Mike T.',
      text: 'The nutrition insights completely changed how I think about food.',
      rating: 5,
      location: 'London, UK',
    },
    {
      name: 'Jessica L.',
      text: 'Finally found an app that actually helps me sleep better.',
      rating: 5,
      location: 'Toronto, Canada',
    },
  ];

  const handleUpgrade = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    Alert.alert(
      'Upgrade to Premium',
      `Upgrading to ${plan?.name} plan! (Demo only - In production this would process payment)`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            updateProfile({ isPremium: true });
            Alert.alert('Success', 'You are now a Premium member!');
            navigation.goBack();
          },
        },
      ]
    );
  };

  // Already Premium View
  if (profile?.isPremium) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
          </View>

          <View style={styles.premiumActiveContainer}>
            <View style={styles.premiumIconContainer}>
              <Ionicons name="star" size={48} color="#f59e0b" />
            </View>
            <Text style={styles.premiumActiveTitle}>You're Premium!</Text>
            <Text style={styles.premiumActiveSubtitle}>
              Enjoy unlimited access to all features and continue crushing your goals.
            </Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Premium Benefits</Text>
              <View style={styles.benefitsGrid}>
                {features.map((feature) => (
                  <View key={feature.category} style={styles.benefitItem}>
                    <View style={styles.benefitHeader}>
                      <Ionicons name={feature.icon as any} size={20} color="#2563eb" />
                      <Text style={styles.benefitCategory}>{feature.category}</Text>
                    </View>
                    {feature.items.slice(0, 2).map((item, index) => (
                      <View key={index} style={styles.benefitFeature}>
                        <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                        <Text style={styles.benefitFeatureText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.manageButton} activeOpacity={0.7}>
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Upgrade View
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.premiumIconContainer}>
            <Ionicons name="star" size={40} color="#ffffff" />
          </View>
          <Text style={styles.title}>
            Upgrade to <Text style={styles.titleGradient}>Premium</Text>
          </Text>
          <Text style={styles.subtitle}>
            Unlock the full potential of your fitness journey
          </Text>
        </View>

        {/* Pricing Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          {plans.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                plan.popular && styles.planCardPopular,
              ]}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                  <View style={styles.planPriceContainer}>
                    <Text style={styles.planPrice}>
                      ${plan.price.toFixed(2)}
                    </Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                </View>
                {plan.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsBadgeText}>{plan.savings}</Text>
                  </View>
                )}
              </View>

              <View style={styles.planFeatures}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.planFeature}>
                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                    <Text style={styles.planFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.planButton,
                  plan.popular && styles.planButtonPopular,
                ]}
                onPress={() => handleUpgrade(plan.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.planButtonText,
                    plan.popular && styles.planButtonTextPopular,
                  ]}
                >
                  {plan.id === 'trial' ? 'Start Free Trial' : 'Choose Plan'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Features Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Premium Features</Text>
          {features.map((feature) => (
            <View key={feature.category} style={styles.card}>
              <View style={styles.featureHeader}>
                <View style={styles.featureIconContainer}>
                  <Ionicons name={feature.icon as any} size={24} color="#2563eb" />
                </View>
                <Text style={styles.featureCategory}>{feature.category}</Text>
              </View>
              {feature.items.map((item, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                  <Text style={styles.featureItemText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Special Offer */}
        <View style={styles.specialOfferCard}>
          <View style={styles.specialOfferHeader}>
            <Ionicons name="sparkles" size={24} color="#ffffff" />
            <Text style={styles.specialOfferTitle}>Limited Time Offer</Text>
          </View>
          <Text style={styles.specialOfferText}>
            Get your first month FREE when you upgrade to annual plan. That's a ${pricing.trial.toFixed(2)} value!
          </Text>
          <Text style={styles.specialOfferExpiry}>Offer expires in 3 days</Text>
        </View>

        {/* Testimonials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Users Say</Text>
          {testimonials.map((testimonial, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.testimonialRating}>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Ionicons key={i} name="star" size={16} color="#f59e0b" />
                ))}
              </View>
              <Text style={styles.testimonialText}>"{testimonial.text}"</Text>
              <View style={styles.testimonialFooter}>
                <Text style={styles.testimonialName}>- {testimonial.name}</Text>
                <Text style={styles.testimonialLocation}>{testimonial.location}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Security & Trust */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
            <Text style={styles.cardHeaderText}>Your Data is Safe</Text>
          </View>
          <View style={styles.securityList}>
            <View style={styles.securityItem}>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text style={styles.securityItemText}>256-bit SSL encryption</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text style={styles.securityItemText}>GDPR compliant data handling</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text style={styles.securityItemText}>Cancel anytime, no questions asked</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text style={styles.securityItemText}>30-day money-back guarantee</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="card-outline" size={24} color="#2563eb" />
            <Text style={styles.cardHeaderText}>Secure Payment</Text>
          </View>
          <Text style={styles.paymentText}>
            We accept all major payment methods and process payments securely through
            industry-leading providers.
          </Text>
          <View style={styles.paymentMethods}>
            <Text style={styles.paymentMethod}>💳 Credit Cards</Text>
            <Text style={styles.paymentMethod}>🏦 Bank Transfer</Text>
            <Text style={styles.paymentMethod}>📱 Digital Wallets</Text>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Can I cancel anytime?</Text>
              <Text style={styles.faqAnswer}>
                Yes, you can cancel your subscription at any time with no cancellation fees.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>What happens to my data if I cancel?</Text>
              <Text style={styles.faqAnswer}>
                Your data remains accessible for 30 days after cancellation, then it's permanently
                deleted if you don't resubscribe.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Is there a family plan?</Text>
              <Text style={styles.faqAnswer}>
                Family plans are coming soon! Each account needs its own subscription for now.
              </Text>
            </View>
            <View style={styles.faqItem}>
              <Text style={styles.faqQuestion}>Do you offer student discounts?</Text>
              <Text style={styles.faqAnswer}>
                Yes! Students get 50% off with valid student ID verification.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ebf2fe',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  premiumIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleGradient: {
    color: '#f59e0b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  planCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  planCardPopular: {
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -60 }],
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  planPeriod: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 4,
  },
  savingsBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  planFeatures: {
    marginBottom: 16,
    gap: 8,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planFeatureText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  planButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  planButtonPopular: {
    backgroundColor: '#2563eb',
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  planButtonTextPopular: {
    color: '#ffffff',
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureCategory: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  featureItemText: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
  },
  specialOfferCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#9333ea',
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  specialOfferHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  specialOfferTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  specialOfferText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
    lineHeight: 20,
  },
  specialOfferExpiry: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
  },
  testimonialRating: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  testimonialText: {
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 12,
    lineHeight: 20,
  },
  testimonialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testimonialName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  testimonialLocation: {
    fontSize: 12,
    color: '#94a3b8',
  },
  securityList: {
    gap: 12,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  securityItemText: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
  },
  paymentText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#64748b',
  },
  faqList: {
    gap: 20,
  },
  faqItem: {
    gap: 4,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  premiumActiveContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  premiumActiveTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  premiumActiveSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  benefitItem: {
    width: (width - 64) / 2,
    gap: 8,
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  benefitCategory: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  benefitFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  benefitFeatureText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  manageButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#475569',
  },
});
