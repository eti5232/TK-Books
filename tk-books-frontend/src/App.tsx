import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Loading } from './components/ui';
import { SiteLayout } from './components/Layout';
import Books from './pages/Books';
import BookPage from './pages/BookPage';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import FaqPage from './pages/Faq';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import OrderSuccess from './pages/OrderSuccess';
import Pay from './pages/Pay';
import ProductPage from './pages/ProductPage';
import Shop from './pages/Shop';
import Track from './pages/Track';

// אזור המנהלת נטען רק כשצריך (המורות לא מורידות אותו)
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/Login'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const OrdersList = lazy(() => import('./admin/Orders').then((m) => ({ default: m.OrdersList })));
const OrderDetail = lazy(() => import('./admin/Orders').then((m) => ({ default: m.OrderDetail })));
const BooksAdmin = lazy(() => import('./admin/Resources').then((m) => ({ default: m.BooksAdmin })));
const MaterialsAdmin = lazy(() => import('./admin/Resources').then((m) => ({ default: m.MaterialsAdmin })));
const ProductsAdmin = lazy(() => import('./admin/Resources').then((m) => ({ default: m.ProductsAdmin })));
const FaqsAdmin = lazy(() => import('./admin/Resources').then((m) => ({ default: m.FaqsAdmin })));
const ContactsAdmin = lazy(() => import('./admin/Resources').then((m) => ({ default: m.ContactsAdmin })));
const CustomersAdmin = lazy(() => import('./admin/Resources').then((m) => ({ default: m.CustomersAdmin })));

export default function App() {
  return (
    <Suspense fallback={<div className="container section"><Loading /></div>}>
      <Routes>
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

        <Route path="admin/login" element={<AdminLogin />} />
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
      </Routes>
    </Suspense>
  );
}
