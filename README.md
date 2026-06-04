# Shopper - Flipkart Style E-Commerce Catalog

A state-of-the-art, high-performance, single-page (SPA) e-commerce catalog application styled after Flipkart. Built with a modular vanilla JavaScript architecture and premium TailwindCSS aesthetics.

---

## 🚀 Key Features

* **Interactive Carousel & Category Nav**: Beautifully animated hero banners and visual category listings.
* **Instant Filtering & Sorting**: Real-time filtering by price range, star ratings, and dynamic category-specific selectors (e.g., Age Group for Toys, Material for Furniture, Gender for Fashion, and Delivery Speed for Groceries).
* **Robust Shopping Cart & Wishlist**: Drop zone integration for drag-and-drop cart additions, real-time quantity/subtotal updates, and badge count synchronizations.
* **Pincode Validation & Delivery Calculator**: Direct verification of 6-digit Indian pincodes displaying estimated delivery times (1-5 days) and local warehouse locations.
* **Review & Rating System**: Add personalized ratings and reviews, with interactive star selections, auto-recalculating average ratings, and distribution bars.
* **Secure Checkout Simulator**: Real-time card BIN detection (HDFC, SBI, Axis, PNB), custom chip rendering, EMI plan calculations, UPI code generator, and order fulfillment states.

---

## 📁 File Structure

```text
ECOMMERCE-CATALOG
├── css
│   ├── component.css       # Custom animations, transitions, scrollbars
│   └── main.css            # Base styles and structure
├── images                  # Product and banner assets (JPEG, WebP, PNG formats)
├── js
│   ├── app.js              # Coordinator, SPA hash router, and wishlist logic
│   ├── auth.js             # User authentication and session management
│   ├── cart.js             # Cart state manager and sidebar UI updates
│   ├── catalog.js          # Catalog listings and product details/reviews renderer
│   ├── checkout.js         # Validation forms and payment processing engine
│   ├── data.js             # Complete mock product database (124 items)
│   └── filter.js           # Real-time search, filters, and categories logic
├── index.html              # Main application markup
└── README.md               # Documentation
```

---

## 🛠️ Technology Stack

* **Structure**: HTML5 Semantic markup
* **Styling**: TailwindCSS & Vanilla CSS variables
* **Logic**: Vanilla ES Modules JavaScript (Strictly front-end only, zero framework boilerplate)
* **Icons & Assets**: Custom SVG code and Unsplash photography

---

## 💻 How to Run Locally

Since this app is built using ES Modules (`type="module"`), it must be served via a web server (it cannot be run directly via `file://`).

1. Open your terminal in the project directory.
2. Spin up a local server:
```bash
   python3 -m http.server 3000
```
3. Open [http://localhost:3000](http://localhost:3000) in your web browser.