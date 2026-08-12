# GRABB-IT Clothing - Store Owner Administrative Guide

Welcome to the Grabb-it Clothing administration portal. This guide explains how to manage your store's catalog, stock levels, orders, and customer feedback.

---

## 1. How to Log In

1. Open your web browser and navigate to: `http://localhost:3000/admin` (or `/admin/login`).
2. Input your registered administrative email address and password.
3. Click **Login**. You will be authenticated and redirected to your main control dashboard.

---

## 2. Managing Products (Adding & Editing)

### How to Add a New Product:
1. Navigate to the **Products** tab on the left menu and click **+ Add Product**.
2. Fill out the catalog parameters:
   - **Name**: The display name of the item.
   - **SKU**: A unique identifier code.
   - **Category**: Dropdown grouping (e.g. Men's T-Shirts).
   - **Price**: Catalog price.
   - **Sale Price**: Enter a discount price if active (optional).
   - **Image URL**: Enter a primary display photo link.
3. Check options to flag the apparel as *New Arrival*, *Trending*, or *Featured*.
4. Click **Save Product**. The backend automatically seeds size variants (`S`, `M`, `L`, `XL`) with starting stocks of `15`.

### How to Edit an Existing Product:
1. Click the **Edit** button next to any product in the list.
2. Modify descriptions, active status, prices, or images, and click **Save**.

### How to Archive/Deactivate a Product:
1. When editing a product, set the **Active** toggle switch to **Inactive** (or uncheck the box).
2. The product will be hidden from customer catalogs, but historical orders will remain intact.

---

## 3. Creating Collections

To group items for a seasonal campaign:
1. Navigate to the **Collections** tab and click **Create Collection**.
2. Input a Title, Description, Cover Image, and Banner Layout URLs.
3. Check the checkboxes next to the products you want to assign to this collection.
4. Click **Publish**. The collection will display dynamically on the homepage collections list.

---

## 4. Managing Inventory Stock

To review or modify inventory:
1. Click the **Inventory** tab on the dashboard menu.
2. The system lists all SKUs, sizes, colors, and stock levels, sorted by lowest stock.
3. Hover over the **Stock Qty** field and click edit or adjust the numeric input box directly.
4. The system flags items as **IN STOCK**, **LOW STOCK** (5 units or less), or **OUT OF STOCK** (0 units).

---

## 5. Managing Orders & Delivery Tracking

When a customer places an order, it appears under the **Orders** tab.

### Updating Delivery Stages:
1. Change the order's status dropdown as progress shifts:
   `Pending` → `Confirmed` → `Packed` → `Shipped` → `Out for Delivery` → `Delivered`.
2. As you toggle these, the customer receives an automatic notification and their order details page timeline updates.

### Adding Tracking Information:
1. Once an order is marked `Shipped`, type details into the **Shipment Tracking** panel on the order card:
   - **Courier Partner**: Carrier name (e.g., Delhivery, Blue Dart).
   - **Tracking ID**: Shipment barcode code.
   - **Tracking Link URL**: Customer tracking portal hyperlink.
2. Click **Save** to update details.

---

## 6. Review Moderation

1. Go to the **Reviews** tab.
2. Moderate reviews left by verified purchasers.
3. Toggle approval filters to show or hide comments from product details pages.
