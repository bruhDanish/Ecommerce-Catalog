const USERS_KEY = 'ecommerce_users';
const SESSION_KEY = 'ecommerce_session';

const defaultUsers = [
  { username: 'user1', password: 'password123', name: 'User One' },
  { username: 'user2', password: 'password123', name: 'User Two' },
  { username: 'user3', password: 'password123', name: 'User Three' }
];

class Auth {
  constructor() {
    this.users = [];
    this.currentUser = null;
    this.listeners = [];
    this.load();
  }

  load() {
    const savedUsers = localStorage.getItem(USERS_KEY);
    if (savedUsers) {
      this.users = JSON.parse(savedUsers);
    } else {
      this.users = [...defaultUsers];
      this.saveUsers();
    }

    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      this.currentUser = JSON.parse(session);
    }
  }

  saveUsers() {
    localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
  }

  saveSession() {
    if (this.currentUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    this.notify();
  }

  login(username, password) {
    let user = this.users.find(u => u.username === username);
    
    if (user) {
      if (user.password === password) {
        this.currentUser = user;
        this.saveSession();
        return { success: true };
      } else {
        return { success: false, message: 'Invalid password' };
      }
    } else {
      // Auto-register new user
      user = { username, password, name: username };
      this.users.push(user);
      this.saveUsers();
      
      this.currentUser = user;
      this.saveSession();
      return { success: true, message: 'New user registered and logged in.' };
    }
  }

  logout() {
    this.currentUser = null;
    this.saveSession();
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }
}

export const auth = new Auth();
