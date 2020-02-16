# Air Buddy Backend

To get started, create a file named `secrets.json` in the root directory with contents

```json
{
  "AMADEUS_API_KEY": "<your-api-key-here>",
  "AMADEUS_API_SECRET": "<your-api-secret-here>"
}
```

filling in your real key and secret.

If you don't already have a MongoDB server running locally, you can start one with

```
./run-mongo.sh
```

To start the server,

```
npm start
```
