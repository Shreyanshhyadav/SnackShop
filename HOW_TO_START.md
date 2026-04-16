# How to Start the E-Commerce Project (Docker)

## Prerequisites

- **Docker** — [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
- **Docker Compose** — included with Docker Desktop

---

## Start Everything

From the project root, run:

```bash
docker compose up --build
```

This spins up three containers:

| Service  | URL                        | Container              |
|----------|----------------------------|------------------------|
| Frontend | http://localhost:5173      | ecommerce-frontend     |
| Backend  | http://localhost:8001      | ecommerce-backend      |
| API Docs | http://localhost:8001/docs | (auto-generated)       |
| MongoDB  | localhost:27019            | ecommerce-mongo        |

---

## Seed the Database (Optional)

To load sample products and create an admin user:

```bash
docker compose exec backend python seed_runner.py
```

Admin credentials after seeding: `admin@shop.com` / `admin123`

---

## Stop Everything

```bash
docker compose down
```

To also remove the MongoDB data volume:

```bash
docker compose down -v
```

---

## Running Without Docker

If you prefer running locally without containers, install Python 3.9+, Node.js 18+, and MongoDB, then:

```bash
# Backend (in one terminal)
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```
