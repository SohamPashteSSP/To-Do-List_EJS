import express from "express";
import bodyParser from "body-parser";
import getDayToLocale from "./date.js";

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const port = 3000;

let items = [];
let workItems = [];

app.route("/")
.get((req, res) => {
    let day = getDayToLocale();

    res.render("list", {
        listTitle: day,
        newListItems: items,
    });
})
.post((req, res) => {
    let item = req.body.newItem;
    
    if (req.body.list === "Work") {
        workItems.push(item);
        res.redirect("/work");
    }
    else {
        items.push(item);
        res.redirect("/");
    }
});

app.route("/work")
.get((req, res) => {
    res.render("list", {
        listTitle: "Work List",
        newListItems: workItems,
    });
})
.post((req, res) => {
    let item = req.body.newItem;
    workItems.push(item);
    res.redirect("/work");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
});