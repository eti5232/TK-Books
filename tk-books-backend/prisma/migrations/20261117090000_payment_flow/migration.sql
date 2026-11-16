-- זרימת תשלום: PENDING = ממתינה לתשלום, אחר כך PAID, ORDERED (הוזמנה מהספק), SHIPPED, DELIVERED
ALTER TYPE "OrderStatus" ADD VALUE 'PAID';
ALTER TYPE "OrderStatus" ADD VALUE 'ORDERED';
ALTER TYPE "OrderStatus" ADD VALUE 'REFUNDED';

ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "orderedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "paymentRef" TEXT;
ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT;
