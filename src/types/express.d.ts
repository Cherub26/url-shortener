declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        user_id: string;
        username: string;
      };
    }
  }
}

export {}; 