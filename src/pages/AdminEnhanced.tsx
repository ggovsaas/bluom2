// src/pages/AdminEnhanced.tsx
// Enhanced Admin Dashboard with all missing features

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  ChefHat, 
  Dumbbell,
  Brain,
  ShoppingBag,
  Bell,
  Settings,
  Users,
  BarChart3,
  Shield,
  Upload,
  Video,
  Music,
  Package,
  FileText,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Types
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  image_url: string;
  price: number;
  in_stock: boolean;
  featured: boolean;
  premium_only: boolean;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  category: string;
  scheduled_at: string;
  status: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  is_premium: boolean;
}

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  details: any;
  created_at: string;
}

const AdminEnhanced: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'recipes' | 'workouts' | 'meditations' | 'marketplace' | 'notifications' | 'users' | 'settings' | 'analytics' | 'logs'>('recipes');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [globalSettings, setGlobalSettings] = useState<any>({});
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    category_id: '',
    price: 0,
    image_url: '',
    in_stock: true,
    featured: false,
    premium_only: false
  });
  
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    body: '',
    category: 'general',
    scheduled_at: '',
    target_users: 'all' // 'all', 'premium', 'free', 'specific'
  });

  // Authentication
  const handleLogin = () => {
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      setIsAuthenticated(true);
      fetchAllData();
    } else {
      alert('Invalid credentials');
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    try {
      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (productsData) setProducts(productsData);

      // Fetch notifications
      const { data: notificationsData } = await supabase
        .from('queued_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (notificationsData) setNotifications(notificationsData);

      // Fetch users (using service role would be better, but for now use anon)
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (usersData) setUsers(usersData);

      // Fetch global settings (if table exists)
      const { data: settingsData } = await supabase
        .from('global_app_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (settingsData) setGlobalSettings(settingsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  // Product Management
  const handleSaveProduct = async () => {
    try {
      if (productForm.id) {
        await supabase
          .from('products')
          .update(productForm)
          .eq('id', productForm.id);
      } else {
        await supabase
          .from('products')
          .insert(productForm);
      }
      fetchAllData();
      setShowProductModal(false);
      resetProductForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Delete this product?')) {
      try {
        await supabase
          .from('products')
          .delete()
          .eq('id', id);
        fetchAllData();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      slug: '',
      description: '',
      category_id: '',
      price: 0,
      image_url: '',
      in_stock: true,
      featured: false,
      premium_only: false
    });
  };

  // Notification Management
  const handleSaveNotification = async () => {
    try {
      const notificationData = {
        category: notificationForm.category,
        type: 'marketing',
        payload: {
          title: notificationForm.title,
          body: notificationForm.body
        },
        scheduled_at: notificationForm.scheduled_at || null,
        status: 'pending'
      };

      await supabase
        .from('queued_notifications')
        .insert(notificationData);
      
      fetchAllData();
      setShowNotificationModal(false);
      resetNotificationForm();
    } catch (error) {
      console.error('Error saving notification:', error);
      alert('Error saving notification');
    }
  };

  const resetNotificationForm = () => {
    setNotificationForm({
      title: '',
      body: '',
      category: 'general',
      scheduled_at: '',
      target_users: 'all'
    });
  };

  // File Upload to Supabase Storage
  const handleFileUpload = async (file: File, bucket: string, path: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-blue-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
            <p className="text-gray-600">Access the management dashboard</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="px-6 pt-12 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600">Manage all app content and settings</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="bg-red-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'recipes', label: 'Recipes', icon: ChefHat, color: 'orange' },
              { id: 'workouts', label: 'Workouts', icon: Dumbbell, color: 'green' },
              { id: 'meditations', label: 'Meditations', icon: Brain, color: 'purple' },
              { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag, color: 'blue' },
              { id: 'notifications', label: 'Notifications', icon: Bell, color: 'yellow' },
              { id: 'users', label: 'Users', icon: Users, color: 'indigo' },
              { id: 'settings', label: 'Settings', icon: Settings, color: 'gray' },
              { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'pink' },
              { id: 'logs', label: 'Activity Logs', icon: Activity, color: 'red' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === tab.id 
                    ? `bg-${tab.color}-600 text-white` 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Marketplace Tab */}
        {activeTab === 'marketplace' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Product Management</h2>
              <button
                onClick={() => {
                  resetProductForm();
                  setShowProductModal(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Product</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-xl p-4">
                  <img src={product.image_url || '/placeholder.png'} alt={product.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{product.description?.substring(0, 100)}...</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-blue-600">€{product.price}</span>
                    <div className="flex gap-2">
                      {product.featured && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">Featured</span>}
                      {product.premium_only && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">Premium</span>}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setProductForm({ ...product, id: product.id });
                        setShowProductModal(true);
                      }}
                      className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-200 flex items-center justify-center space-x-1"
                    >
                      <Edit3 size={16} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg font-medium hover:bg-red-200 flex items-center justify-center space-x-1"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Notification Manager</h2>
              <button
                onClick={() => {
                  resetNotificationForm();
                  setShowNotificationModal(true);
                }}
                className="bg-yellow-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-yellow-700 flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Create Notification</span>
              </button>
            </div>

            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{notification.title || 'Untitled'}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      notification.status === 'sent' ? 'bg-green-100 text-green-700' :
                      notification.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {notification.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{notification.body || 'No body'}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Category: {notification.category}</span>
                    {notification.scheduled_at && (
                      <span>Scheduled: {new Date(notification.scheduled_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-6">User Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">{user.email || 'N/A'}</td>
                      <td className="py-3 px-4">{user.name || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {user.is_premium ? (
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs">Premium</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">Free</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Global Settings</h2>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-gray-700"
              >
                Edit Settings
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Maintenance Mode</span>
                <span className={globalSettings.maintenance_mode ? 'text-red-600' : 'text-green-600'}>
                  {globalSettings.maintenance_mode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-medium">Notifications Enabled</span>
                <span className={globalSettings.notifications_enabled ? 'text-green-600' : 'text-red-600'}>
                  {globalSettings.notifications_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Activity Logs</h2>
            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No activity logs yet</p>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Add/Edit Product</h3>
              <button onClick={() => setShowProductModal(false)}>
                <X size={24} className="text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl"
              />
              <input
                type="text"
                placeholder="Slug"
                value={productForm.slug}
                onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl"
              />
              <textarea
                placeholder="Description"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl h-24"
              />
              <input
                type="number"
                placeholder="Price"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                className="w-full p-3 border border-gray-300 rounded-xl"
              />
              <input
                type="url"
                placeholder="Image URL"
                value={productForm.image_url}
                onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl"
              />
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={productForm.featured}
                    onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                  />
                  <span>Featured</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={productForm.premium_only}
                    onChange={(e) => setProductForm({ ...productForm, premium_only: e.target.checked })}
                  />
                  <span>Premium Only</span>
                </label>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowProductModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProduct}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
              >
                Save Product
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Create Notification</h3>
              <button onClick={() => setShowNotificationModal(false)}>
                <X size={24} className="text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl"
              />
              <textarea
                placeholder="Body"
                value={notificationForm.body}
                onChange={(e) => setNotificationForm({ ...notificationForm, body: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl h-24"
              />
              <select
                value={notificationForm.category}
                onChange={(e) => setNotificationForm({ ...notificationForm, category: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl"
              >
                <option value="general">General</option>
                <option value="nutrition">Nutrition</option>
                <option value="workouts">Workouts</option>
                <option value="wellness">Wellness</option>
                <option value="marketing">Marketing</option>
              </select>
              <input
                type="datetime-local"
                placeholder="Schedule (optional)"
                value={notificationForm.scheduled_at}
                onChange={(e) => setNotificationForm({ ...notificationForm, scheduled_at: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl"
              />
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotification}
                className="flex-1 py-3 bg-yellow-600 text-white rounded-xl font-medium hover:bg-yellow-700"
              >
                Create Notification
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminEnhanced;


