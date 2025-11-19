# Google Vision API Setup Guide

## Overview
This guide will help you set up Google Vision API to enable real AI-powered food recognition in your AiFitness app.

## Prerequisites
- Google Cloud account
- Project with billing enabled
- Basic knowledge of Google Cloud Console

## Step 1: Enable Google Vision API

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Select Your Project**
   - I can see you have "AiFitnessApp" project already created
   - Make sure this project is selected in the top navigation

3. **Enable Cloud Vision API**
   - Navigate to **APIs & Services** → **Library**
   - Search for "Cloud Vision API"
   - Click on "Cloud Vision API"
   - Click **"Enable"**

## Step 2: Create API Credentials

1. **Go to Credentials**
   - Navigate to **APIs & Services** → **Credentials**
   - Click **"Create Credentials"** → **"API Key"**

2. **Configure API Key**
   - Copy the generated API key
   - Click **"Restrict Key"** for security
   - Under "API restrictions", select "Cloud Vision API"
   - Click **"Save"**

## Step 3: Set Up Environment Variables

1. **Create .env file** (if not exists)
   ```bash
   # In your project root directory
   touch .env
   ```

2. **Add your API key**
   ```env
   # Google Vision API Configuration
   GOOGLE_VISION_API_KEY=your_api_key_here
   
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

3. **Replace `your_api_key_here`** with the actual API key you copied

## Step 4: Install Dependencies

Once you have disk space available, install the required packages:

```bash
# Install Google Cloud Vision SDK
npm install @google-cloud/vision

# Or if you prefer to use REST API (current implementation)
npm install node-fetch
```

## Step 5: Test the Integration

1. **Restart your server**
   ```bash
   npm run dev
   ```

2. **Test the feature**
   - Go to your app at http://localhost:5173
   - Navigate to the Fuel page
   - Click the camera icon for "Photo Calorie Detector"
   - Take a photo of food
   - The app will now use real AI recognition!

## How It Works

### Current Implementation
The app now includes:

1. **Real AI Recognition**: Uses Google Vision API to identify food items in photos
2. **Smart Fallback**: Falls back to mock recognition if API key isn't set
3. **Enhanced Food Database**: 30+ common foods with accurate nutritional data
4. **Confidence Scoring**: Shows how confident the AI is about the recognition

### API Features Used
- **Label Detection**: Identifies objects and concepts in the image
- **Text Detection**: Reads any text visible in the image
- **Food Filtering**: Filters results to focus on food-related items
- **Nutritional Lookup**: Matches recognized foods to nutritional database

## Supported Foods

The system can recognize and provide nutritional data for:
- **Fruits**: Apple, Banana, Orange, Grape, Strawberry, Blueberry
- **Vegetables**: Carrot, Broccoli, Spinach, Lettuce, Tomato, Onion
- **Grains**: Rice, Pasta, Bread
- **Proteins**: Chicken, Beef, Pork, Fish, Salmon, Egg
- **Dairy**: Milk, Cheese, Yogurt, Butter
- **Nuts**: Almond, Walnut, Peanut
- **Desserts**: Cake, Cookie, Ice Cream, Chocolate
- **Meals**: Sandwich, Pizza, Burger, Salad, Soup

## Cost Considerations

### Google Vision API Pricing (as of 2024)
- **First 1,000 requests/month**: FREE
- **Additional requests**: $1.50 per 1,000 requests
- **Text detection**: $1.50 per 1,000 requests

### Estimated Costs for Typical Usage
- **10 photos/day**: ~300 requests/month = FREE
- **50 photos/day**: ~1,500 requests/month = $0.75/month
- **100 photos/day**: ~3,000 requests/month = $3.00/month

## Security Best Practices

1. **API Key Restrictions**
   - Always restrict your API key to Cloud Vision API only
   - Set up HTTP referrer restrictions if possible
   - Monitor usage in Google Cloud Console

2. **Environment Variables**
   - Never commit API keys to version control
   - Use .env files for local development
   - Use secure environment variables in production

3. **Error Handling**
   - The app includes comprehensive error handling
   - Falls back gracefully if API is unavailable
   - Provides user-friendly error messages

## Troubleshooting

### Common Issues

1. **"API key not valid"**
   - Check that the API key is correct
   - Ensure Cloud Vision API is enabled
   - Verify billing is set up

2. **"Quota exceeded"**
   - Check your usage in Google Cloud Console
   - Consider upgrading your quota
   - The app will fall back to mock recognition

3. **"No food detected"**
   - Try taking a clearer photo
   - Ensure the food is well-lit and centered
   - Try different angles

### Debug Mode
To see detailed API responses, add this to your .env:
```env
DEBUG_VISION_API=true
```

## Production Deployment

For production deployment:

1. **Set up environment variables** in your hosting platform
2. **Enable billing** in Google Cloud Console
3. **Set up monitoring** for API usage
4. **Configure error logging** for debugging
5. **Test thoroughly** with various food types

## Next Steps

Once Google Vision API is working, you can enhance the feature with:

1. **Multiple Food Detection**: Identify multiple foods in one image
2. **Portion Size Estimation**: Use computer vision to estimate serving sizes
3. **Barcode Integration**: Combine with barcode scanning for packaged foods
4. **Custom Training**: Train custom models for specific food types
5. **Offline Recognition**: Add TensorFlow.js for offline capabilities

## Support

If you encounter issues:
1. Check the Google Cloud Console for API usage and errors
2. Review the server logs for detailed error messages
3. Test with the Google Vision API demo: https://cloud.google.com/vision/docs/detecting-objects

The integration is now ready! Your AI Food Recognition feature will use real Google Vision API for accurate food identification and nutritional analysis. 