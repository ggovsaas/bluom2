// src/services/marketplace.ts
// Marketplace Integration - Shopify + WooCommerce

import { supabase } from '../lib/supabaseClient';

// Shopify GraphQL query
const SHOPIFY_GRAPHQL_ENDPOINT = process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_URL || '';
const SHOPIFY_TOKEN = process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || '';

// WooCommerce REST API
const WOOCOMMERCE_URL = process.env.EXPO_PUBLIC_WOOCOMMERCE_URL || '';
const WOOCOMMERCE_KEY = process.env.EXPO_PUBLIC_WOOCOMMERCE_KEY || '';
const WOOCOMMERCE_SECRET = process.env.EXPO_PUBLIC_WOOCOMMERCE_SECRET || '';

// ============ SHOPIFY ============

export async function getShopifyProducts(category?: string, limit: number = 20) {
  if (!SHOPIFY_GRAPHQL_ENDPOINT || !SHOPIFY_TOKEN) {
    throw new Error('Shopify credentials not configured');
  }

  const query = `
    query GetProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            description
            featuredImage {
              url
            }
            variants(first: 1) {
              edges {
                node {
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
            tags
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({
        query,
        variables: { first: limit },
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return data.data.products.edges.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      description: edge.node.description,
      image: edge.node.featuredImage?.url,
      price: edge.node.variants.edges[0]?.node.price.amount,
      currency: edge.node.variants.edges[0]?.node.price.currencyCode,
      tags: edge.node.tags,
      source: 'shopify',
    }));
  } catch (error) {
    console.error('Error fetching Shopify products:', error);
    throw error;
  }
}

export async function getShopifyProduct(productId: string) {
  const query = `
    query GetProduct($id: ID!) {
      product(id: $id) {
        id
        title
        description
        images(first: 5) {
          edges {
            node {
              url
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({
        query,
        variables: { id: productId },
      }),
    });

    const data = await response.json();
    return data.data.product;
  } catch (error) {
    console.error('Error fetching Shopify product:', error);
    throw error;
  }
}

// ============ WOOCOMMERCE ============

export async function getWooCommerceProducts(category?: string, limit: number = 20) {
  if (!WOOCOMMERCE_URL || !WOOCOMMERCE_KEY || !WOOCOMMERCE_SECRET) {
    throw new Error('WooCommerce credentials not configured');
  }

  const auth = btoa(`${WOOCOMMERCE_KEY}:${WOOCOMMERCE_SECRET}`);
  const url = `${WOOCOMMERCE_URL}/wp-json/wc/v3/products?per_page=${limit}${category ? `&category=${category}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.statusText}`);
    }

    const products = await response.json();
    return products.map((product: any) => ({
      id: product.id.toString(),
      title: product.name,
      description: product.description,
      image: product.images[0]?.src,
      price: product.price,
      currency: product.currency || 'USD',
      tags: product.tags.map((t: any) => t.name),
      source: 'woocommerce',
    }));
  } catch (error) {
    console.error('Error fetching WooCommerce products:', error);
    throw error;
  }
}

// ============ AI RECOMMENDATIONS ============

export async function getAIRecommendations(userId: string) {
  // Generate recommendations if none exist
  await supabase.rpc('generate_ai_shop_recommendations', {
    p_user_id: userId,
  });

  // Get recommendations
  const { data, error } = await supabase
    .from('ai_shop_recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('clicked', false)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
}

export async function markRecommendationClicked(recommendationId: string) {
  const { error } = await supabase
    .from('ai_shop_recommendations')
    .update({ clicked: true })
    .eq('id', recommendationId);

  if (error) throw error;
}

// ============ PRODUCT INTERACTIONS ============

export async function logProductInteraction(
  userId: string,
  productId: string,
  source: 'shopify' | 'woocommerce',
  interactionType: 'viewed' | 'clicked' | 'added_to_cart' | 'purchased'
) {
  const { error } = await supabase
    .from('shop_product_interactions')
    .insert({
      user_id: userId,
      product_id: productId,
      source,
      interaction_type: interactionType,
    });

  if (error) throw error;
}

// ============ FAVORITES ============

export async function addToFavorites(
  userId: string,
  productId: string,
  source: 'shopify' | 'woocommerce',
  productTitle: string,
  productImageUrl?: string
) {
  const { data, error } = await supabase
    .from('shop_favorites')
    .upsert({
      user_id: userId,
      product_id: productId,
      source,
      product_title: productTitle,
      product_image_url: productImageUrl,
    }, {
      onConflict: 'user_id,product_id,source',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeFromFavorites(
  userId: string,
  productId: string,
  source: 'shopify' | 'woocommerce'
) {
  const { error } = await supabase
    .from('shop_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('source', source);

  if (error) throw error;
}

export async function getFavorites(userId: string) {
  const { data, error } = await supabase
    .from('shop_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

