import { Database } from '../lib/database.types';

export type Post = Database['public']['Tables']['posts']['Row'] & { 
  is_announcement?: boolean;
};

export type PostInsert = Database['public']['Tables']['posts']['Insert'] & { 
  is_announcement?: boolean;
};

export type PostUpdate = Database['public']['Tables']['posts']['Update'] & { 
  is_announcement?: boolean;
};
