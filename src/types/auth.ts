export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  farmName: string;
  profileImage?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  farmName: string;
  role: string;
}