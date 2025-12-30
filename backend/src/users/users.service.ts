import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password: string;
  name?: string;
}

@Injectable()
export class UsersService {
  // In a real application, this would connect to a database
  // For demo purposes, we'll use an in-memory store
  private readonly users: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      password: bcrypt.hashSync('password123', 10),
      name: 'Admin User',
    },
  ];

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }

  async findById(id: string): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (user && bcrypt.compareSync(password, user.password)) {
      const { password: _, ...result } = user;
      return result as User;
    }
    return null;
  }

  async create(userData: Omit<User, 'id'>): Promise<User> {
    const newUser: User = {
      id: (this.users.length + 1).toString(),
      ...userData,
      password: bcrypt.hashSync(userData.password, 10),
    };
    this.users.push(newUser);
    return newUser;
  }
}
