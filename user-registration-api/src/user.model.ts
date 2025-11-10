export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
}

export class UserEntity implements User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;

  constructor(email: string, password: string) {
    this.id = Date.now().toString(); // Simple ID generation
    this.email = email;
    this.password = password;
    this.createdAt = new Date();
  }
}
