import axios from 'axios';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password, passwordConfirm, companyName } = req.body;

  try {
    // Forward the request to the backend API
    const backendUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api';
    const endpoint = `${backendUrl}/auth/register/`;
    console.log('Sending registration request to:', endpoint);
    console.log('Request data:', { email, company_name: companyName });
    
    const response = await axios.post(endpoint, {
      email,
      password,
      password_confirm: passwordConfirm,
      company_name: companyName
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Registration response:', response.data);
    
    // Return the response from the backend
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.response) {
      // Return the error response from the backend
      return res.status(error.response.status).json(error.response.data);
    }
    
    // Handle network errors
    return res.status(500).json({ message: 'Internal server error' });
  }
}
