// This is a mock API endpoint for checking email availability
import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, companyName, company_name } = req.body;
  // Use company_name from body if available, otherwise use companyName
  const companyNameToUse = company_name || companyName;

  try {
    // Forward the request to the backend API
    const backendUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api';
    const endpoint = `${backendUrl}/auth/check-email/`;
    console.log('Sending request to:', endpoint);
    console.log('Request data:', { email, company_name: companyNameToUse });
    
    const response = await axios.post(endpoint, {
      email,
      company_name: companyNameToUse
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Response:', response.data);
    
    // Return the response from the backend
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error checking email:', error);
    
    if (error.response) {
      // Return the error response from the backend
      return res.status(error.response.status).json(error.response.data);
    }
    
    // Handle network errors
    return res.status(500).json({ message: 'Internal server error' });
  }
}
