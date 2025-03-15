import { googleLogin } from '../redux/slices/authSlice';
import { AppDispatch } from '../redux/store';

interface GoogleResponse {
  credential: string;
}

export const handleGoogleLogin = async (response: GoogleResponse, dispatch: AppDispatch) => {
  try {
    // Send the Google credential token to our backend
    const resultAction = await dispatch(googleLogin(response.credential));
    
    if (googleLogin.fulfilled.match(resultAction)) {
      return resultAction.payload.user;
    } else if (googleLogin.rejected.match(resultAction)) {
      throw new Error(resultAction.error.message || 'Failed to login with Google');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to login with Google');
  }
};

// Helper function to decode JWT token (if needed for client-side info)
const decodeJwtResponse = (token: string) => {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}; 