# ConectaCG SaaS — Development Commands

.PHONY: dev prod build test seed migrate logs stop clean

## Start development environment (DB + Redis only)
dev:
	docker compose -f docker-compose.dev.yml up -d
	cd backend && npm run dev

## Start full production stack
prod:
	docker compose up -d --build

## Build all containers
build:
	docker compose build

## Run database migrations
migrate:
	cd backend && npm run db:migrate

## Seed database with test data
seed:
	cd backend && npm run db:seed

## Run full test suite
test:
	cd backend && npm test

## Run tests with coverage
test-coverage:
	cd backend && npm run test:coverage

## View logs
logs:
	docker compose logs -f backend

## Stop all containers
stop:
	docker compose down

## Full reset (WARNING: deletes all data)
clean:
	docker compose down -v --remove-orphans

## Open Prisma Studio
studio:
	cd backend && npm run db:studio

## Check container health
health:
	curl -s http://localhost:4000/health | python3 -m json.tool
