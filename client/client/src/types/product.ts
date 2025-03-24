export interface ProductVariant {
  stock: number;
  size?: string;
  color?: string;
}

export interface ProductSpecifications {
  material?: string;
  dimensions?: string;
  care?: string[];
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string | { _id: string; name: string };
  material: string | { _id: string; name: string };
  art: string | { _id: string; name: string };
  tags: string[];
  isFavorite?: boolean;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
  variants?: ProductVariant[];
  specifications?: ProductSpecifications;
  isActive?: boolean;
  showInDIY?: boolean;
}

export interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    [key: string]: any;
  };
  quantity: number;
}

export interface AddToCartPayload {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
} 