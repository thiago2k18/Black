import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Preferences } from '@capacitor/preferences';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Criar usuário padrão imediatamente
    this.createGuestUser();
    this.loadStoredUser();
  }

  private async loadStoredUser() {
    try {
      const { value } = await Preferences.get({ key: 'currentUser' });
      if (value) {
        const user = JSON.parse(value);
        this.currentUserSubject.next(user);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      // Manter usuário padrão em caso de erro
    }
  }

  private createGuestUser() {
    const guestUser: User = {
      id: 'guest-user',
      name: 'Usuário',
      email: 'guest@andarbem.com',
      avatar: 'assets/images/avatar-placeholder.svg',
      createdAt: new Date()
    };
    
    this.currentUserSubject.next(guestUser);
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      // Simulação de login - em produção, usar Supabase
      if (email && password) {
        const user: User = {
          id: '1',
          name: 'Usuário AndarBem',
          email: email,
          avatar: 'assets/images/avatar-placeholder.svg',
          createdAt: new Date()
        };

        await this.setCurrentUser(user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  }

  async register(name: string, email: string, password: string): Promise<boolean> {
    try {
      // Simulação de registro - em produção, usar Supabase
      const user: User = {
        id: Date.now().toString(),
        name: name,
        email: email,
        avatar: 'assets/images/avatar-placeholder.svg',
        createdAt: new Date()
      };

      await this.setCurrentUser(user);
      return true;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await Preferences.remove({ key: 'currentUser' });
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }

  private async setCurrentUser(user: User): Promise<void> {
    try {
      await Preferences.set({
        key: 'currentUser',
        value: JSON.stringify(user)
      });
      this.currentUserSubject.next(user);
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  }

  getCurrentUser(): User {
    const currentUser = this.currentUserSubject.value;
    
    // Se não há usuário logado, criar um usuário padrão
    if (!currentUser) {
      this.createGuestUser();
      return this.currentUserSubject.value!;
    }
    
    return currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  async updateProfile(updates: Partial<User>): Promise<boolean> {
    try {
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...updates };
        await this.setCurrentUser(updatedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return false;
    }
  }
}
