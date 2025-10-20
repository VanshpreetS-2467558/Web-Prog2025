import express from "express";
import { InitializeDatabase } from "./db.js";

const app = express();
const port = process.env.PORT || 8080; // Set by Docker Entrypoint or use 8080

// set the view engine to ejs
app.set("view engine", "ejs");
app.set("views", "./views");

// process.env.DEPLOYMENT is set by Docker Entrypoint
if (!process.env.DEPLOYMENT) {
  console.info("Development mode");
  // Serve static files from the "public" directory
  app.use(express.static("public"));
}

// Middleware for serving static files
app.use(express.static("public"));

// Middleware for parsing JSON bodies
app.use(express.json());

// Middleware for debug logging
app.use((request, response, next) => {
  console.log(
    `Request URL: ${request.url} @ ${new Date().toLocaleString("nl-BE")}`
  );
  next();
});

// app.get("/", (request, response) => { ///////////////////////////////////////////
//   response.send("Hello World!");
// });

// Your routes here ...
app.get("/", (request, response) => {
  response.render("pages/index");
});
app.get("/over-ons", (request, response) => {
  response.render("pages/over-ons");
});
app.get("/bezoekers", (request, response) => {
  response.render("pages/bezoekers");
});
app.get("/organisatoren", (request, response) => {
  response.render("pages/organisatoren");
});
app.get("/hulp", (request, response) => {
  response.render("pages/hulp");
});
app.get("/inloggen", (request, response) => {
  response.render("pages/inloggen");
});
app.get("/privacy" , (request,response)=>{
  response.render("pages/privacy");
})
app.get("/voorwaarden" , (request,response)=>{
  response.render("pages/voorwaarden");
})
app.get("/cookiebeleid" , (request,response)=>{
  response.render("pages/cookie");
})
app.get("/registreren", (request,response)=>{
  response.render("pages/registreren");
})


// Middleware for unknown routes
// Must be last in pipeline
app.use((request, response, next) => {
  response.status(404).send("Sorry can't find that!");
});

// Middleware for error handling
app.use((error, request, response, next) => {
  console.error(error.stack);
  response.status(500).send("Something broke!");
});

// App starts here
// InitializeDatabase();
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

