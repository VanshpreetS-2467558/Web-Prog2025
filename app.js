import express from "express";
import router from "./routes/routes.js";
import authenticationRouter from "./routes/authenticationRoutes.js";
import { InitializeDatabase } from "./db.js";
import session from "express-session";

const app = express();
const port = process.env.PORT || 8080; // Set by Docker Entrypoint or use 8080


// Session / Cookie middelware
app.use(session({
  secret: "INF project",        //secret sleutel
  resave: "false",              // sessie wordt niet opgeslagen als er niks veranderd
  saveUninitialized: "false",   // lege sessie wordt niet opgeslagen
  rolling: "true",              // server refreshed sessie bij elke request
  cookie: {                     // cookie 
    httpOnly: true,             // cookie niet beschikbaar via js in browser
    maxAge: 3600000,              // sessie blijft 1 uur geldig
  }
}));

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

// Middleware for parsing JSON bodies and html forms
app.use(express.urlencoded({extended: true })); // voor html forms bij inlog/register
app.use(express.json());

// Middleware for debug logging
app.use((request, response, next) => {
  console.log(
    `Request URL: ${request.url} @ ${new Date().toLocaleString("nl-BE")}`
  );
  next();
});


// Middleware for session
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Your routes here ...
app.use("/", router);
app.use("/", authenticationRouter);


// Middleware for unknown routes
// Must be last in pipeline
app.use((request, response, next) => {
  response.status(404).render("error_pages/404");
});

// Middleware for error handling
app.use((error, request, response, next) => {
  console.error(error.stack);
  response.status(500).render("error_pages/500");
});

// App starts here
InitializeDatabase();
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

