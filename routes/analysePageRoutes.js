import express from "express";
import {requireLogin} from "../middleware/requireLogin.js";

const analyse = express.Router();


analyse.get("/algemene-analyse", requireLogin("organisator"), (req, res) => {
    res.render("pages/algemeneAnalyse");
});

export default analyse;