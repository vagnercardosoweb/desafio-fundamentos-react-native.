import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import formatValue from '../utils/formatValue';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
  cartTotal: number;
  totalItensInCart: number;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem('products');

      if (productsStorage) {
        setProducts(JSON.parse(productsStorage));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    (async () => {
      await AsyncStorage.setItem('products', JSON.stringify(products));
    })();
  }, [products]);

  const addToCart = useCallback((product: Product) => {
    setProducts(old => {
      const newProducts = [...old];
      const findIndex = newProducts.findIndex(p => p.id === product.id);

      if (findIndex !== -1) {
        newProducts[findIndex].quantity += 1;
      } else {
        newProducts.push(product);
      }

      return newProducts;
    });
  }, []);

  const increment = useCallback((id: string) => {
    setProducts(old => {
      const newProducts = [...old];
      const findIndex = newProducts.findIndex(p => p.id === id);

      if (findIndex !== -1) {
        newProducts[findIndex].quantity += 1;
      }

      return newProducts;
    });
  }, []);

  const decrement = useCallback(id => {
    setProducts(old => {
      const newProducts = [...old];
      const findIndex = newProducts.findIndex(p => p.id === id);

      if (findIndex !== -1) {
        newProducts[findIndex].quantity -= 1;

        if (newProducts[findIndex].quantity <= 0) {
          newProducts.splice(findIndex, 1);
        }
      }

      return newProducts;
    });
  }, []);

  const cartTotal = useMemo(
    () =>
      formatValue(
        products.reduce((total, product) => {
          total += product.price * product.quantity;

          return total;
        }, 0),
      ),
    [products],
  );

  const totalItensInCart = useMemo(
    () =>
      products.reduce((total, product) => {
        total += product.quantity;

        return total;
      }, 0),
    [products],
  );

  const value = React.useMemo(
    () => ({
      addToCart,
      increment,
      decrement,
      products,
      cartTotal,
      totalItensInCart,
    }),
    [products, addToCart, increment, decrement, cartTotal, totalItensInCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
