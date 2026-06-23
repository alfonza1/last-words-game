# Dead Keys — Java backend (`server`)

A **Spring Boot (Java 17+)** backend for the Dead Keys typing game. The game used
to store everything in the browser (`localStorage`); now **player progress
(stats, coins, upgrades) and a global leaderboard live on this server**, and the
frontend calls its API. Progress is saved to a JSON file so it survives restarts.

> Settings (audio volumes, difficulty, map, weapon, screen shake) stay
> device-local — they're UI preferences, not progress.

## Run

**Java 17+ required** (Java 20 is fine). No Maven install needed.

```bash
# Option A — prebuilt jar (fastest)
PORT=4100 java -jar target/server-1.0.0.jar
# Windows PowerShell:  $env:PORT=4100; java -jar target\server-1.0.0.jar

# Option B — Maven wrapper (downloads Maven on first run)
./mvnw spring-boot:run          # macOS/Linux/Git Bash
mvnw.cmd spring-boot:run        # Windows
```

Default port **4100**. The frontend's Vite dev server (`:5180`) proxies `/api`
and `/health` to it, so just run this, then `npm run dev` in `../client`.

Progress is written to **`dk-data.json`** in the working directory (override with
the `DATA_FILE` env var). Delete that file to reset all profiles + the leaderboard.

## API

```
GET  /health
POST /api/guest                       -> { guest, profile }   (creates a profile)
GET  /api/profile/{id}                -> { profile }
POST /api/profile/{id}/run            -> { profile, isHighScore }   (merge a finished run)
POST /api/profile/{id}/buy   {key}    -> { profile }   (server validates cost/coins)
POST /api/profile/{id}/devgrant       -> { profile }   (testing: +coins, unlock stats)
GET  /api/leaderboard?limit=          -> { leaderboard }
```

A **profile** = `{ guestId, name, stats, upgrades, upgradeGames }`. The browser
keeps only the `guestId` (in `localStorage` under `dk.guestId`).

## Game logic owned by the server

- **Run merge**: best score / WPM / accuracy / survival, cumulative kills, bosses,
  coins, games played, and missed-word tallies (same rules as the old client code).
- **Upgrades**: purchase is authoritative here — it checks the level cap and coin
  cost, deducts coins, and (re)starts the 5-game upgrade lifespan. Finishing a run
  consumes one game; upgrades reset to zero when the lifespan runs out.
- **Leaderboard**: every finished run is recorded and served sorted by score.

## Layout

```
src/main/java/com/deadkeys/
  DeadKeysApplication.java   app entry + permissive CORS
  model/                     Stats, Upgrades, Profile (mutable) + Dtos (records)
  upgrades/UpgradeCatalog    upgrade defs, cost math, lifespan
  store/Store.java           file-backed store (dk-data.json)
  service/ProfileService     domain rules: run-merge, buy, dev-grant (+ UpgradeException)
  web/ApiController.java      thin HTTP layer (+ NotFoundException, error mapping)
src/main/resources/application.properties
```
