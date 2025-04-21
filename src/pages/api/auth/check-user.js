import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  try {
    // Forward the request to the backend API
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000/api';
    console.log('Sending check-user request to:', `${backendUrl}/auth/check-user/`);
    console.log('Request data:', { email });
    
    const response = await axios.post(`${backendUrl}/auth/check-user/`, {
      email
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Check user response:', response.data);
    
    // Return the response from the backend
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Check user error:', error.response?.data || error.message);
    
    // Return the error from the backend
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    return res.status(500).json({ message: 'An error occurred while checking user' });
  }
}
