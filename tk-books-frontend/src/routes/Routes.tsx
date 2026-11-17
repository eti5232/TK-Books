import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { SiteLayout } from '../components/Layout';
import BookPage from '../pages/BookPage';
import Books from '../pages/Books';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Contact from '../pages/Contact';
import FaqPage from '../pages/Faq';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';
import OrderSuccess from '../pages/OrderSuccess';
import Pay from '../pages/Pay';
import ProductPage from '../pages/ProductPage';
import Shop from '../pages/Shop';
import Track from '../pages/Track';
import ProtectedRoute from './ProtectedRoute';

// אזור המנהלת נטען רק כשצריך (המורות לא מורידות אותו)
const AdminLayout = lazy(() => import('../components/AdminLayout'));
const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const OrdersList = lazy(() => import('../pages/admin/Orders').then((m) => ({ default: m.OrdersList })));
const OrderDetail = lazy(() => import('../pages/admin/Orders').then((m) => ({ default: m.OrderDetail })));
const BooksAdmin = lazy(() => import('../pages/admin/Resources').then((m) => ({ default: m.BooksAdmin })));
const MaterialsAdmin = lazy(() => import('../pages/admin/Resources').then((m) => ({ default: m.MaterialsAdmin })));
const ProductsAdmin = lazy(() => import('../pages/admin/Resources').then((m) => ({ default: m.ProductsAdmin })));
const FaqsAdmin = lazy(() => import('../pages/admin/Resources').then((m) => ({ default: m.FaqsAdmin })));
const ContactsAdmin = lazy(() => import('../pages/admin/Resources').then((m) => ({ default: m.ContactsAdmin })));
const CustomersAdmin = lazy(() => import('../pages/admin/Resources').then((m) => ({ default: m.CustomersAdmin })));

export default function AppRoutes() {
  return (
    <Routes>
      {/* האתר הציבורי */}
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="books" element={<Books />} />
        <Route path="books/:slug" element={<BookPage />} />
        <Route path="shop" element={<Shop />} />
        <Route path="shop/:slug" element={<ProductPage />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="pay" element={<Pay />} />
        <Route path="order/success" element={<OrderSuccess />} />
        <Route path="track" element={<Track />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* אזור המנהלת */}
      <Route path="admin/login" element={<AdminLogin />} />
      <Route element={<ProtectedRoute />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="books" element={<BooksAdmin />} />
          <Route path="materials" element={<MaterialsAdmin />} />
          <Route path="products" element={<ProductsAdmin />} />
          <Route path="faqs" element={<FaqsAdmin />} />
          <Route path="contacts" element={<ContactsAdmin />} />
          <Route path="customers" element={<CustomersAdmin />} />
        </Route>
      </Route>
    </Routes>
  );
}
