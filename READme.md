# EduSpline Backend

> AI-Powered Education Risk Assessment Platform — REST API Backend

EduSpline is a Node.js/Express backend that powers an AI-driven student risk assessment platform. It handles authentication, institution management, team collaboration, and integrates with a trained machine learning model to predict student risk levels and generate personalized intervention recommendations.

---

## 🔗 Links

| Resource | URL |
|---|---|
| Live API | https://eduspline-backend.onrender.com |
| API Documentation | https://documenter.getpostman.com/view/45518060/2sBXcGDz5P |
| ML Model | https://eduspline-ai-prediction-model-1.onrender.com |
| ML Model Docs | https://eduspline-ai-prediction-model-1.onrender.com/docs |
| Health Check | https://eduspline-backend.onrender.com/health |

---

## 🚀 Features

- **Multi-role authentication** — email/password + Google OAuth 2.0
- **Email verification** — signed JWT links via Brevo transactional email
- **Institution management** — multi-tenant with complete data isolation
- **Team invites** — manual and CSV bulk invite with password setup on accept
- **AI risk assessment** — CSV upload forwarded to ML model, results stored in MongoDB
- **Admin dashboard** — total learners, high risk count, avg engagement, course completion
- **Student dashboard** — personal risk level, confidence score, recommendations
- **Role-based access control** — super_admin, admin, instructor, student
- **Security** — Helmet.js, CORS, rate limiting, bcrypt, trust proxy

---

## 🛠 Tech Stack

| Category | Tool |
|---|---|
| Runtime | Node.js v20 LTS |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | Passport.js (Google OAuth), JWT |
| Email | Brevo (sib-api-v3-sdk) |
| File Upload | multer (memory storage) |
| CSV Parsing | csv-parse |
| HTTP Client | axios |
| Security | Helmet.js, express-rate-limit, bcryptjs |
| Deployment | Render |

---

## 📁 Project Structure

```
backend/
├── config/
│   ├── db.js               MongoDB connection
│   ├── passport.js         Google OAuth strategy
│   └── multer.js           CSV upload config
├── controllers/
│   ├── auth.controller.js
│   ├── team.controller.js
│   └── prediction.controller.js
├── middleware/
│   ├── auth.middleware.js  JWT protect + allowRoles
│   └── validate.middleware.js
├── models/
│   ├── User.js
│   ├── Institution.js
│   └── Prediction.js
├── routes/
│   ├── auth.routes.js
│   ├── team.routes.js
│   └── prediction.routes.js
├── utils/
│   ├── generateToken.js
│   └── sendEmail.js
├── .env.example
├── app.js
└── server.js
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/edurisk
JWT_SECRET=your_64_byte_hex_secret
JWT_INVITE_SECRET=your_64_byte_hex_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER=your_verified_sender@gmail.com
CLIENT_URL=http://localhost:5173
```

Generate secure JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🏃 Running Locally

```bash
# Clone the repository
git clone https://github.com/your-username/eduspline-backend.git
cd eduspline-backend

# Install dependencies
npm install

# Create .env file and fill in your values
cp .env.example .env

# Make sure MongoDB is running locally
# Then start the dev server
npm run dev
```

Server starts at `http://localhost:5000`

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | None | Register admin |
| GET | `/api/auth/verify-email?token=` | None | Verify email |
| POST | `/api/auth/login` | None | Login |
| POST | `/api/auth/set-password` | None | Set password |
| POST | `/api/auth/institution` | Bearer | Institution setup |
| GET | `/api/auth/me` | Bearer | Get logged in user |
| GET | `/api/auth/settings` | Bearer + Admin | Get institution settings |
| PUT | `/api/auth/settings` | Bearer + Admin | Update institution settings |
| PUT | `/api/auth/change-password` | Bearer | Change password |
| GET | `/api/auth/google` | None | Google OAuth |
| GET | `/api/auth/google/callback` | None | Google OAuth callback |

### Team Management

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/team/invite` | Bearer + Admin | Manual invite |
| POST | `/api/team/invite/csv` | Bearer + Admin | CSV bulk invite |
| POST | `/api/team/accept-invite` | None | Accept invite + set password |
| GET | `/api/team` | Bearer + Admin | List team members |

### Predictions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/predictions/upload` | Bearer + Admin | Upload CSV for risk analysis |
| GET | `/api/predictions/dashboard` | Bearer + Admin | Dashboard metrics |
| GET | `/api/predictions/insights` | Bearer + Admin | Insights table |
| GET | `/api/predictions/student` | Bearer | Student own prediction |

### Utility

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Server health check |

---

## 📊 CSV Format for Risk Assessment

The admin uploads a CSV with the following required columns:

```
name, email, StudyHours, Attendance, Resources, Extracurricular,
Motivation, Internet, Gender, Age, OnlineCourses, Discussions,
AssignmentCompletion, EDTech_Usage_Level, StressLevel, LearningStyle
```

Sample CSV available in `/samples/students_risk_upload.csv`

---

## 🔐 Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT access tokens expire in 1 hour
- Invite tokens expire in 48 hours
- Separate JWT secrets for access tokens and invite tokens
- Rate limiting: 20 requests per 15 minutes on auth routes
- Helmet.js security headers on all responses
- CORS restricted to registered frontend origin
- All queries scoped to institution — no cross-tenant data access

---

## 🚢 Deployment (Render)

1. Push code to GitHub
2. Connect repository to Render
3. Set all environment variables in Render dashboard (do not use `.env` on Render)
4. Do **not** set `PORT` — Render injects it automatically
5. Health check URL: `https://eduspline-backend.onrender.com/health`

**Important:** After frontend deploys to Vercel, update these on Render:
- `CLIENT_URL` → Vercel production URL
- `GOOGLE_CALLBACK_URL` → production callback URL

Also update Google Cloud Console with production URLs for OAuth.

---

## 🤝 Frontend Integration

The frontend needs these environment variables:

```env
VITE_API_URL=https://eduspline-backend.onrender.com
```

All authenticated requests must include:

```js
headers: {
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`
}
```

Decode user info from token without an API call:

```js
const getUser = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('accessToken');
      return null;
    }
    return payload; // { id, role, email }
  } catch {
    return null;
  }
};
```

---

## 📄 License

This project is built as part of a capstone project. All rights reserved.