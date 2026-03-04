# CampusMall - Complete Full-Stack E-Commerce Platform

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

## Table of Contents
1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Database Schema](#database-schema)
7. [Setup & Installation](#setup--installation)
8. [API Documentation](#api-documentation)
9. [Frontend Features](#frontend-features)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Developer Guide](#developer-guide)
13. [Documentation for Research & Academic Reports](#documentation-for-research--academic-reports)
14. [Troubleshooting](#troubleshooting)
15. [Contributing](#contributing)

---

## Project Overview

**CampusMall** is a production-ready, full-stack e-commerce platform designed for modern online marketplaces. It enables multiple vendors to sell products through a centralized platform with a comprehensive admin dashboard, vendor management system, and customer-facing store.

### Business Model
- **Multi-Vendor Marketplace**: Multiple vendors can sell products on a single platform
- **Electronic Payments**: Integrated Stripe payment gateway for secure transactions
- **Vendor Commission**: System supports commission-based revenue models
- **Coupon Management**: Promotional campaigns with customizable coupons
- **Order Management**: Complete order lifecycle from placement to delivery
- **User Ratings & Reviews**: Customer testimonials and product ratings
- **Admin Oversight**: Comprehensive admin panel for platform management

### Current Status
✅ **100% Complete** - Ready for deployment and production use

---

## Key Features

### For Customers
- ✅ User authentication (JWT-based)
- ✅ Browse products by category
- ✅ Advanced product search and filtering
- ✅ Shopping cart functionality
- ✅ Secure checkout with Stripe integration
- ✅ Order tracking and history
- ✅ User profile management
- ✅ Address management
- ✅ Product reviews and ratings
- ✅ Coupon code application
- ✅ My Orders dashboard

### For Vendors
- ✅ Vendor dashboard with analytics
- ✅ Product catalog management
- ✅ Inventory management (stock tracking)
- ✅ Order management and fulfillment
- ✅ Revenue analytics
- ✅ Vendor profile setup

### For Administrators
- ✅ Complete admin panel
- ✅ User management
- ✅ Vendor management and approval
- ✅ Product moderation
- ✅ Order monitoring
- ✅ Platform analytics
- ✅ Payment verification
- ✅ Coupon management
- ✅ System logs and reports

### Platform Features
- ✅ Multi-role authentication (Admin, Vendor, Customer)
- ✅ Role-based access control (RBAC)
- ✅ Responsive design (Mobile, Tablet, Desktop)
- ✅ RESTful API with OpenAPI/Swagger documentation
- ✅ PostgreSQL-ready (currently SQLite for development)
- ✅ Email notification system
- ✅ File upload handling
- ✅ API rate limiting
- ✅ CORS support for frontend

---

## Technology Stack

### Backend
| Component | Technology |
|-----------|-----------|
| **Framework** | Django 5.2.1 |
| **API** | Django REST Framework 3.14.0 |
| **Authentication** | JWT (djangorestframework-simplejwt) |
| **API Documentation** | drf-spectacular 0.27.2 |
| **Database** | SQLite 3 (PostgreSQL ready) |
| **Payment** | Stripe API |
| **CORS** | django-cors-headers |
| **Filtering** | django-filter |
| **File Processing** | Pillow 12.1.0 |
| **PDF Generation** | ReportLab |
| **Environment** | python-decouple, python-dotenv |

### Frontend
| Component | Technology |
|-----------|-----------|
| **Framework** | React 18+ |
| **Language** | TypeScript |
| **Build Tool** | Vite 5+ |
| **Styling** | Tailwind CSS 3+ |
| **UI Components** | Shadcn/ui (Radix UI) |
| **Form Handling** | React Hook Form |
| **HTTP Client** | Axios |
| **State Management** | React Context API |
| **Icons** | Lucide React |
| **Carousel** | Embla Carousel |
| **Testing** | Vitest |
| **Linting** | ESLint |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| **Backend Server** | Django Development Server (Gunicorn ready) |
| **Frontend Server** | Vite Dev Server / Static hosting |
| **Payment Gateway** | Stripe |
| **File Storage** | Local filesystem (S3-ready architecture) |

---

## Architecture

### System Architecture Overview
```
Client (React + TypeScript) 
  ↓ HTTP/REST with JWT
API Layer (Django REST Framework)
  ↓ ORM
Business Logic (Django Apps)
  ↓
Data Layer (SQLite/PostgreSQL)
  ↓
External Services (Stripe, Email, Storage)
```

### Core Components
1. **Frontend**: React SPA with TypeScript
2. **Backend API**: Django REST Framework
3. **Authentication**: JWT tokens
4. **Database**: Relational (SQLite/PostgreSQL)
5. **Payment**: Stripe integration
6. **File Storage**: Local/Cloud storage
7. **Admin**: Django admin + custom panel

---

## Project Structure

### Key Directories
```
campus_mall/
├── backend/
│   ├── apps/
│   │   ├── users/          # Authentication & user management
│   │   ├── products/       # Product catalog
│   │   ├── orders/         # Order management
│   │   ├── vendors/        # Vendor management
│   │   ├── payments/       # Payment processing
│   │   ├── coupons/        # Coupon system
│   │   ├── testimonials/   # Reviews & ratings
│   │   └── admin_panel/    # Admin features
│   ├── core/               # Django settings
│   ├── media/              # Uploaded files
│   └── db.sqlite3          # Database
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # State management
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
│   ├── public/             # Static assets
│   └── vite.config.ts      # Vite configuration
│
└── README.md               # This file
```

---

## Database Schema

### Core Models
1. **User**: Customer, Vendor, Admin accounts
2. **Vendor**: Vendor profiles and information
3. **Product**: Product catalog items
4. **ProductVariation**: Product variants (size, color)
5. **Order**: Customer orders
6. **OrderItem**: Items in each order
7. **Coupon**: Promotional discount codes
8. **Testimonial**: Product reviews and ratings

### Entity Relationships
- User → Vendor (one-to-one when vendor)
- User → Order (one-to-many)
- Vendor → Product (one-to-many)
- Vendor → Order (one-to-many)
- Product → ProductVariation (one-to-many)
- Product → OrderItem (one-to-many)
- Order → OrderItem (one-to-many)

---

## Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Setup database
python manage.py makemigrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Run server
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "VITE_API_URL=http://localhost:8000/api" > .env.local

# Run dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## API Documentation

### Base URL: `http://localhost:8000/api`

### Authentication Endpoints
- `POST /users/register/` - Register new user
- `POST /users/login/` - Login user
- `POST /users/refresh/` - Refresh JWT token
- `GET /users/profile/` - Get user profile

### Product Endpoints
- `GET /products/` - List products
- `GET /products/<id>/` - Product details
- `POST /products/` - Create product (vendor)
- `PUT /products/<id>/` - Update product
- `DELETE /products/<id>/` - Delete product

### Order Endpoints
- `GET /orders/` - List user orders
- `POST /orders/` - Create order
- `GET /orders/<id>/` - Order details
- `PUT /orders/<id>/` - Update order
- `POST /orders/<id>/cancel/` - Cancel order

### Payment Endpoints
- `POST /payments/create-payment-intent/` - Stripe payment intent
- `POST /payments/confirm-payment/` - Confirm payment

### Vendor Endpoints
- `GET /vendors/` - List vendors
- `GET /vendors/<id>/` - Vendor profile
- `POST /vendors/` - Register vendor

### Admin Endpoints
- `GET /admin/dashboard/` - Dashboard stats
- `GET /admin/users/` - List users
- `GET /admin/vendors/` - List vendors

---

## Frontend Features

### Pages
- Homepage with featured products
- Product listing with filters
- Product detail page
- Shopping cart
- User checkout
- Order management
- User dashboard
- Vendor dashboard
- Admin dashboard
- Authentication pages

### Components (30+)
- Navbar with authentication
- Product cards
- Shopping cart widget
- Order tracker
- Form components
- Address manager
- Profile editor
- And more...

---

## Testing

### Backend Tests
```bash
cd backend
python manage.py test
python manage.py test apps.products -v 2
```

### Frontend Tests
```bash
cd frontend
npm run test
npm run test:watch
```

---

## Deployment

### Backend
```bash
# Using Gunicorn
pip install gunicorn
gunicorn core.wsgi:application --bind 0.0.0.0:8000

# Using Docker (optional)
docker build -t campusmart-backend .
docker run -p 8000:8000 campusmart-backend
```

### Frontend
```bash
# Build
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to Netlify
netlify deploy --prod --dir=dist
```

---

## Developer Guide

### Adding New Features

1. **Create Backend Model**
```python
# apps/feature/models.py
class Feature(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
```

2. **Create Serializer**
```python
# apps/feature/serializers.py
class FeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feature
        fields = ['id', 'name', 'description']
```

3. **Create ViewSet**
```python
# apps/feature/views.py
class FeatureViewSet(viewsets.ModelViewSet):
    queryset = Feature.objects.all()
    serializer_class = FeatureSerializer
```

4. **Register URLs**
```python
# apps/feature/urls.py
router.register(r'features', FeatureViewSet)
```

5. **Create Frontend Component**
```typescript
// src/components/FeatureList.tsx
export function FeatureList() {
  // Component code
}
```

### Code Style Guidelines
- **Backend**: Follow PEP 8
- **Frontend**: Follow ESLint config
- **TypeScript**: Use strict mode
- **Comments**: Add docstrings
- **Tests**: Write meaningful tests

---

## Documentation for Research & Academic Reports

This README is comprehensive enough to guide researchers and students in writing detailed project documentation. Here's a recommended report structure:

### Part 1: Executive Summary (1-2 pages)
What is CampusMall? Key features, business model, current status.

### Part 2: Introduction (2-3 pages)
E-commerce industry background, problem statement, objectives, scope.

### Part 3: Requirements (3-5 pages)
Functional requirements, non-functional requirements, use cases.

### Part 4: Architecture & Design (4-6 pages)
System architecture, design patterns, database design, security.

### Part 5: Implementation (5-8 pages)
Backend implementation, frontend implementation, key code examples.

### Part 6: Testing & QA (3-4 pages)
Unit tests, integration tests, performance testing, results.

### Part 7: Deployment (3-4 pages)
Deployment architecture, CI/CD, monitoring, backup strategy.

### Part 8: Security Analysis (2-3 pages)
Security measures, vulnerabilities, compliance, hardening.

### Part 9: Performance Analysis (2-3 pages)
Performance metrics, benchmarks, optimizations, scalability.

### Part 10: Future Enhancements (1-2 pages)
Potential improvements, advanced features, technology upgrades.

### Part 11: Conclusion (1-2 pages)
Summary, lessons learned, impact, recommendations.

### Part 12: Appendices
- Complete API reference
- Database schema details
- Installation guides
- Configuration files
- Testing reports

### Research Analysis Framework
For each major component, document:
- **Why was it chosen?** - Rationale and alternatives
- **How is it implemented?** - Technical details
- **What were the challenges?** - Problems solved
- **Performance characteristics** - Speed, scalability
- **Security implications** - Vulnerabilities and mitigations

### Report Generation Tips
1. Use clear headings and subheadings
2. Include diagrams and flowcharts
3. Provide code examples
4. Include screenshots of UI
5. Document all design decisions
6. Cite sources properly
7. Write in academic style

### Recommended Tools
- **Writing**: Markdown, LaTeX, Word
- **Diagrams**: Lucidchart, Draw.io, Mermaid
- **API Docs**: Swagger/OpenAPI
- **Version Control**: Git
- **PDF Generation**: Pandoc, Weasyprint

### Documentation Checklist
- [ ] Executive summary written
- [ ] Introduction complete
- [ ] Requirements documented
- [ ] Architecture explained
- [ ] Implementation details provided
- [ ] Testing results included
- [ ] Deployment guide written
- [ ] Security analysis done
- [ ] Performance analysis complete
- [ ] Future enhancements listed
- [ ] Conclusion written
- [ ] Appendices included
- [ ] All references cited
- [ ] Proof-read

---

## Troubleshooting

### Common Backend Issues

#### ModuleNotFoundError
```
Solution: pip install -r requirements.txt
```

#### Database Migration Errors
```
Solution:
python manage.py makemigrations
python manage.py migrate
```

#### CORS Errors
```
Solution: Add frontend URL to CORS_ALLOWED_ORIGINS in settings.py
```

#### Stripe API Errors
```
Solution: Verify STRIPE_SECRET_KEY in .env is correct
```

### Common Frontend Issues

#### Cannot Reach API
```
Solution:
1. Ensure backend is running
2. Check VITE_API_URL in .env.local
3. Verify CORS settings on backend
```

#### Authentication Issues
```
Solution:
1. Clear browser localStorage
2. Re-login
3. Check JWT expiration settings
```

#### Build Errors
```
Solution: Check tsconfig.json path aliases
```

---

## Contributing

### Commit Message Format
```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Example: feat(orders): add order status update
```

### Pull Request Process
1. Create feature branch
2. Write code and tests
3. Update documentation
4. Commit with clear messages
5. Push and create PR
6. Address review comments
7. Merge when approved

---

## License

MIT License - see LICENSE file for details

---

## Support & Contact

- **GitHub Issues**: Report bugs
- **Email**: support@campusmart.com
- **Documentation**: Check wiki
- **Community**: Discord/Forum

---

## Quick Reference

### URLs
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- API: `http://localhost:8000/api`
- Admin: `http://localhost:8000/admin`

### Test Credentials (Default)
- Admin: `admin@example.com` / `admin123`
- Customer: `customer@example.com` / `customer123`
- Vendor: `vendor1@example.com` / `vendor123`

---

**Project**: CampusMall - E-Commerce Platform
**Version**: 1.0.0
**Status**: Production Ready ✅
**Last Updated**: March 2026

---

**Ready to get started? Follow the Setup & Installation section above!**
