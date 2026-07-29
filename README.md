# BOOKE ERP + CRM SYSTEM
**🚀 Live Demo Hosted on AWS EC2: [http://13.49.159.172/](http://13.49.159.172/)** 

**Default Credentials:**
- Email: `admin@booke.com`
- Password: `admin@123`
A modern, full-stack Enterprise Resource Planning (ERP) and Customer Relationship Management (CRM) system built for small to medium businesses. Features a beautiful, premium glassmorphic UI alongside a robust relational database backbone.

## System Architecture

The application is containerized using Docker and is split into three primary services:
- **Frontend**: A React application built with Vite, styled with TailwindCSS, and served via an Nginx production server.
- **Backend**: A Node.js & Express API written in TypeScript, managing business logic and authentication.
- **Database**: A PostgreSQL database managed via Prisma ORM.

## Key Features

- **Role-Based Access Control (RBAC)**: Secure multi-tier access for ADMIN, SALES, and WAREHOUSE roles.
- **Advanced Dashboard**: Real-time business analytics with responsive charting.
- **Customer CRM**: Manage B2B/Retail customers, track GST details, and schedule follow-ups.
- **Inventory Management**: Real-time stock tracking with low-stock alerts.
- **Sales Challans**: End-to-end order processing with automatic inventory deduction upon confirmation and precise restock logic upon cancellation.
- **Dark Mode**: Fully supported, modern, responsive dark mode utilizing Tailwind classes.

## Project Structure (Root Directory)

```text
booke-erp/
├── backend/                 # Node.js + Express API
│   ├── prisma/              # Prisma schema & migrations
│   ├── src/                 # TS Source (routes, controllers, models)
│   └── Dockerfile           # Backend container config
├── frontend/                # React + Vite Frontend
│   ├── public/              # Static assets
│   ├── src/                 # React components, pages, api setup
│   ├── tailwind.config.js   # Tailwind design system
│   └── Dockerfile           # Frontend Nginx container config
├── docker-compose.yml       # Production-ready orchestration
├── .gitignore               # Git untracked files
└── README.md                # Documentation
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running.
- Node.js (for local development without Docker, if desired).

## Getting Started

To spin up the entire production-ready system, simply run:

```bash
docker-compose up --build -d
```

### Accessing the System

Once the containers are successfully running, access the web interface at:
- **Frontend URL**: [http://localhost:3000](http://localhost:3000)

**Default Credentials:**
- Email: `admin@example.com`
- Password: `admin`

## Development Scripts

If you wish to run the layers out of Docker for development:

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide Icons.
- **Backend**: Node.js, Express, TypeScript, JWT Authentication.
- **Database**: PostgreSQL with Prisma ORM.
- **Deployement**: Hosted at AWS EC2

## Known Problems

1. **Role Limitations**: Currently, roles are only implemented for the admin user. Other functional roles like sales, warehouse, and accounts are not fully integrated or functional.
2. **Password Security**: Passwords are saved in a plain, unprotected manner which poses a security risk. They should be securely hashed and safely stored for better protection and privacy.

## License

This project is licensed under the MIT License.
