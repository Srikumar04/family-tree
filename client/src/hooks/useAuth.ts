import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const { user, isLoading, login, register, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    navigate('/dashboard');
  };

  const handleRegister = async (email: string, password: string) => {
    await register(email, password);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return { user, isLoading, handleLogin, handleRegister, handleLogout };
};
