# Dead Keys

An arcade typing-survival game, split into two modules:

```
zombie-text-rush/
  client/   React + TypeScript + Vite game client   (dev server :5180)
  server/   Spring Boot (Java) backend / REST API    (HTTP :4100)
```

The **client** is the game; the **server** owns player progress (stats, coins,
upgrades) and the global leaderboard, persisted to a JSON file.

> **Backend is always Java.** The Spring Boot service in `server/` is the one and
> only application backend. Firebase is used *only* for authentication (verifying
> who the player is) — it is never the app's data/logic backend.

## Run it (two terminals)

```bash
# 1) server — Java 17+ required, no Maven install needed
cd server
java -jar target/server-1.0.0.jar      # or: ./mvnw spring-boot:run

# 2) client
cd client
npm install      # first time only
npm run dev      # http://localhost:5180
```

The client's Vite dev server proxies `/api` and `/health` to the server on
`:4100`, so start the server first (or the game shows a "Backend offline" banner
and runs without saving progress).

See `client/README.md` and `server/README.md` for module details.
