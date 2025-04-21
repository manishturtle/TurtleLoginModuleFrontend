import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    // Forward the request to the backend API
    const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:8000/api';
    console.log('Sending login request to:', `${backendUrl}/auth/login/`);
    console.log('Request data:', { email });
    
    const response = await axios.post(`${backendUrl}/auth/login/`, {
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Login response:', response.data);
    
    // Return the response from the backend
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Login error:', error);
    
    if (error.response) {
      // Return the error response from the backend
      return res.status(error.response.status).json(error.response.data);
    }
    
    // Handle network errors
    return res.status(500).json({ message: 'Internal server error' });
  }
}
