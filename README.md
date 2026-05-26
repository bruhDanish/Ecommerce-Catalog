# 🛒 E-Commerce Product Catalog & Cart System

Welcome to the internal frontend development project! This project simulates a real-world ecommerce storefront. Our goal is to build a highly interactive catalog featuring complex search/filtering, a functional shopping cart, drag-and-drop interactions, and a rigorously validated checkout flow.

## 💻 Tech Stack

To keep the focus strictly on core frontend mechanics and UI interactions, we are keeping the required stack lightweight. 

**Recommended Core Stack:**
* *HTML*
* *CSS / Tailwind CSS*
* *JavaScript*

## 🛠️ Functional Requirements

* **Catalog:** Display products dynamically using a responsive grid.
* **Discovery:** Users can search via text and apply multiple filters simultaneously.
* **Cart:** Users can add items via button click OR by dragging a product card into the cart area.
* **State:** Cart calculates totals automatically and persists data using Local Storage.
* **Checkout:** Form requires strict validation (Email, Phone, Address) before simulating a successful order.

## 🔄 Strict Git Workflow & Rules

To prevent code loss and massive merge conflicts, the team must strictly adhere to the following rules established in our previous sprints:

1.  **Protect the Main Branch:** No one is allowed to push code directly to the `main` branch. It is strictly locked.
2.  **Pull Requests Only:** The `main` branch is only updated via approved PRs.
3.  **Strict Branch Naming:** Create separate branches for every single feature using the format `pod[number]-[feature-name]` (e.g., `pod3-drag-drop`).
4.  **Pull Before You Push:** Before writing code every morning, you must pull the latest version of the `main` branch into your local environment.
5.  **The Gatekeeper:** Student 12 must review all code, verify it does not break the layout, and manually resolve merge conflicts before hitting merge.

## 🚀 Getting Started

1. Clone the repository: `git clone [repo-link]`
2. Create your feature branch: `git checkout -b podX-your-feature`
3. Launch a local development server (e.g., VS Code Live Server) to view the application. No backend or database installation is required.
