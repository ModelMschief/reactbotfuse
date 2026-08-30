export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ALL' | 'HEAD';

export type AuthType = 
  | 'None'
  | 'Bearer JWT'
  | 'X-CONNECTION-KEY'
  | 'x-api-key'
  | 'X-Webhook-Token'
  | 'BOT_SECRET_KEY';

export type ParamLocation = 'header' | 'query' | 'body' | 'path' | 'formData';

export interface DocParameter {
  name: string;
  type: string;
  location: ParamLocation;
  required: boolean;
  description: string;
  defaultValue?: string | number | boolean;
  example?: string | number | boolean | object;
}

export interface DocHeader {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  example?: string;
}

export interface DocResponse {
  status: number;
  description: string;
  body: string;
  headers?: Record<string, string>;
}

export interface DocEndpoint {
  id: string;
  category: string;
  method: HttpMethod;
  path: string;
  title: string;
  summary: string;
  description: string;
  auth: AuthType;
  rateLimit?: string;
  headers?: DocHeader[];
  parameters?: DocParameter[];
  requestBodyExample?: any;
  responses: DocResponse[];
  notes?: string[];
  tags?: string[];
}

export interface DocCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  badge?: string;
  endpoints: DocEndpoint[];
}

export interface RateLimitRule {
  scope: string;
  limit: string;
  window: string;
  action: string;
  description: string;
}

export interface StatusCodeInfo {
  code: number;
  status: string;
  description: string;
  meaningInBotFusion: string;
}
