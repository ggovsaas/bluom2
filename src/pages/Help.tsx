import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  HelpCircle, 
  Search, 
  MessageCircle, 
  Mail, 
  Phone,
  Book,
  Video,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Star,
  Send,
  X
} from 'lucide-react';

const Help: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    category: 'general'
  });

  const faqCategories = [
    {
      title: 'Getting Started',
      icon: Book,
      faqs: [
        {
          question: 'How do I set up my profile?',
          answer: 'Go to Profile > Edit Profile to add your personal information, goals, and preferences. This helps us provide personalized recommendations.'
        },
        {
          question: 'How do I log my first meal?',
          answer: 'Tap the + button in the Fuel section, search for your food, and select the meal type. You can also use the camera feature for AI food recognition.'
        },
        {
          question: 'How do I track my workouts?',
          answer: 'Visit the Move section and tap the + button. You can log exercises manually, use our exercise database, or follow guided workout videos.'
        }
      ]
    },
    {
      title: 'Nutrition Tracking',
      icon: Utensils,
      faqs: [
        {
          question: 'How accurate is the calorie counting?',
          answer: 'Our database uses verified nutritional information from USDA and FatSecret. For best accuracy, weigh your food and select the correct serving size.'
        },
        {
          question: 'Can I create custom recipes?',
          answer: 'Yes! Use the recipe creator in the Fuel section to combine ingredients and calculate nutrition per serving automatically.'
        },
        {
          question: 'How do I adjust my daily calorie goal?',
          answer: 'Go to Settings > Daily Goals to modify your calorie and macro targets based on your current goals and activity level.'
        }
      ]
    },
    {
      title: 'Premium Features',
      icon: Star,
      faqs: [
        {
          question: 'What does Premium include?',
          answer: 'Premium unlocks unlimited meal logging, advanced analytics, personalized workout plans, and priority customer support.'
        },
        {
          question: 'How do I cancel my subscription?',
          answer: 'You can cancel anytime in Settings > Subscription. Your Premium features will remain active until the end of your billing period.'
        },
        {
          question: 'Can I get a refund?',
          answer: 'We offer a 30-day money-back guarantee for annual subscriptions. Contact support for assistance with refunds.'
        }
      ]
    },
    {
      title: 'Technical Issues',
      icon: Settings,
      faqs: [
        {
          question: 'The app is running slowly',
          answer: 'Try closing and reopening the app, ensure you have the latest version, and check your internet connection. Clear the app cache if issues persist.'
        },
        {
          question: 'My data is not syncing',
          answer: 'Check your internet connection and ensure you\'re logged in. Data syncs automatically when connected to the internet.'
        },
        {
          question: 'I forgot my password',
          answer: 'Use the "Forgot Password" link on the login screen to reset your password via email.'
        }
      ]
    }
  ];

  const contactOptions = [
    {
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      icon: MessageCircle,
      color: 'bg-blue-500',
      available: 'Available 24/7'
    },
    {
      title: 'Email Support',
      description: 'Send us a detailed message',
      icon: Mail,
      color: 'bg-green-500',
      available: 'Response within 24h'
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with our team',
      icon: Phone,
      color: 'bg-purple-500',
      available: 'Mon-Fri 9AM-6PM EST'
    }
  ];

  const resources = [
    {
      title: 'Video Tutorials',
      description: 'Step-by-step guides for all features',
      icon: Video,
      link: '#'
    },
    {
      title: 'User Guide',
      description: 'Complete documentation',
      icon: Book,
      link: '#'
    },
    {
      title: 'Community Forum',
      description: 'Connect with other users',
      icon: MessageCircle,
      link: '#'
    }
  ];

  const filteredFaqs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  const handleContactSubmit = () => {
    // Handle contact form submission
    console.log('Contact form submitted:', contactForm);
    setShowContactModal(false);
    setContactForm({ subject: '', message: '', category: 'general' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-gray-800">Help & Support</h1>
          <p className="text-gray-600">Find answers and get assistance</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
            />
          </div>
        </motion.div>

        {/* Quick Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-lg mb-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Need immediate help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contactOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => setShowContactModal(true)}
                className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
              >
                <div className={`w-10 h-10 ${option.color} rounded-lg flex items-center justify-center mb-3`}>
                  <option.icon className="text-white" size={20} />
                </div>
                <h4 className="font-semibold text-gray-800 mb-1">{option.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                <p className="text-xs text-green-600 font-medium">{option.available}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* FAQ Sections */}
        <div className="space-y-6">
          {(searchQuery ? filteredFaqs : faqCategories).map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (categoryIndex + 3) * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <category.icon className="text-blue-600" size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{category.title}</h3>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {category.faqs.map((faq, faqIndex) => (
                  <div key={faqIndex}>
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === faqIndex ? null : faqIndex)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                    >
                      <span className="font-medium text-gray-800">{faq.question}</span>
                      {expandedFaq === faqIndex ? (
                        <ChevronDown className="text-gray-400" size={20} />
                      ) : (
                        <ChevronRight className="text-gray-400" size={20} />
                      )}
                    </button>
                    {expandedFaq === faqIndex && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-4"
                      >
                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg mt-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Resources</h3>
          <div className="space-y-3">
            {resources.map((resource, index) => (
              <a
                key={index}
                href={resource.link}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <resource.icon className="text-gray-600" size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{resource.title}</p>
                    <p className="text-sm text-gray-600">{resource.description}</p>
                  </div>
                </div>
                <ExternalLink className="text-gray-400" size={16} />
              </a>
            ))}
          </div>
        </motion.div>

        {/* Still Need Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white mt-6"
        >
          <div className="text-center">
            <HelpCircle className="mx-auto mb-4" size={48} />
            <h3 className="text-lg font-bold mb-2">Still need help?</h3>
            <p className="text-sm opacity-90 mb-4">
              Our support team is here to help you succeed with your fitness journey
            </p>
            <button
              onClick={() => setShowContactModal(true)}
              className="bg-white bg-opacity-20 px-6 py-3 rounded-xl font-medium hover:bg-opacity-30 transition-colors"
            >
              Contact Support
            </button>
          </div>
        </motion.div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Contact Support</h3>
              <button
                onClick={() => setShowContactModal(false)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
              >
                <X size={16} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={contactForm.category}
                  onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                >
                  <option value="general">General Question</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing & Subscription</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  placeholder="Brief description of your issue"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  placeholder="Please provide as much detail as possible..."
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none h-32 resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleContactSubmit}
                disabled={!contactForm.subject || !contactForm.message}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium disabled:bg-gray-300 flex items-center justify-center space-x-2"
              >
                <Send size={16} />
                <span>Send Message</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Help;