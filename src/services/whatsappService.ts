import axios from 'axios';

// WBroadcast backend configuration
const getWBroadcastBaseUrl = () => process.env.WBROADCAST_BACKEND_URL || 'http://localhost:3001';
const getServiceAuthToken = () => process.env.SERVICE_AUTH_TOKEN;

export interface WhatsAppMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send WhatsApp message via WBroadcast backend service
 * This centralizes all WhatsApp functionality in WBroadcast
 */
export async function sendProjectPDFMessage(
  phone: string,
  message: string
): Promise<WhatsAppMessageResult> {
  try {
    // Read environment variables at function call time (after dotenv.config() has run)
    const SERVICE_AUTH_TOKEN = getServiceAuthToken();
    const WBROADCAST_BASE_URL = getWBroadcastBaseUrl();
    
    if (!SERVICE_AUTH_TOKEN) {
      console.error('SERVICE_AUTH_TOKEN not configured');
      console.error('Current env check:', {
        hasToken: !!process.env.SERVICE_AUTH_TOKEN,
        tokenValue: process.env.SERVICE_AUTH_TOKEN ? '***' + process.env.SERVICE_AUTH_TOKEN.slice(-4) : 'undefined'
      });
      return {
        success: false,
        error: 'Service authentication not configured. Please set SERVICE_AUTH_TOKEN in environment variables.'
      };
    }

    // Call WBroadcast backend WhatsApp API
    const response = await axios.post(
      `${WBROADCAST_BASE_URL}/api/whatsapp/send-text`,
      {
        phone,
        message
      },
      {
        headers: {
          'X-Service-Auth': SERVICE_AUTH_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      return {
        success: true,
        messageId: response.data.messageId
      };
    } else {
      return {
        success: false,
        error: response.data.error || response.data.details || 'Unknown error'
      };
    }
  } catch (error: any) {
    console.error('Error sending WhatsApp PDF message via WBroadcast:', error);
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      const WBROADCAST_BASE_URL = getWBroadcastBaseUrl();
      return {
        success: false,
        error: `Cannot connect to WBroadcast backend at ${WBROADCAST_BASE_URL}. Make sure WBroadcast backend is running.`
      };
    }

    // Handle HTTP errors
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.error || error.response.data?.message || `HTTP ${error.response.status}: ${error.response.statusText}`
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
}

